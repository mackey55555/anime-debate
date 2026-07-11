"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useMode } from "@/components/ModeContext";
import Chat from "@/components/Chat";
import type { Work, Scene, SceneNote } from "@/lib/types";

export default function StudentWork({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { studentName, setStudentName } = useMode();
  const [nameInput, setNameInput] = useState("");

  const [work, setWork] = useState<Work | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [index, setIndex] = useState(0);

  const [note, setNote] = useState("");
  const [noteId, setNoteId] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  // 作品とシーンを読み込む
  useEffect(() => {
    (async () => {
      const [{ data: w }, { data: s }] = await Promise.all([
        supabase.from("works").select("*").eq("id", id).single(),
        supabase
          .from("scenes")
          .select("*")
          .eq("work_id", id)
          .order("sort_order", { ascending: true }),
      ]);
      setWork(w);
      setScenes(s ?? []);
    })();
  }, [id]);

  const current = scenes[index];

  // 現在シーンのメモを読み込む
  useEffect(() => {
    if (!current || !studentName) {
      setNote("");
      setNoteId(null);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("scene_notes")
        .select("*")
        .eq("scene_id", current.id)
        .eq("student_name", studentName)
        .maybeSingle();
      const n = data as SceneNote | null;
      setNote(n?.body ?? "");
      setNoteId(n?.id ?? null);
    })();
  }, [current?.id, studentName]);

  const saveNote = async () => {
    if (!current || !studentName) return;
    setSavingNote(true);
    if (noteId) {
      const { error } = await supabase
        .from("scene_notes")
        .update({ body: note })
        .eq("id", noteId);
      if (error) console.error("メモ更新エラー:", error.message, error);
    } else {
      const { data, error } = await supabase
        .from("scene_notes")
        .insert({
          work_id: id,
          scene_id: current.id,
          student_name: studentName,
          body: note,
        })
        .select()
        .single();
      if (error) console.error("メモ保存エラー:", error.message, error);
      else setNoteId(data.id);
    }
    setSavingNote(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  // 名前がまだなら名前入力画面
  if (!studentName) {
    return (
      <div className="max-w-md mx-auto mt-10 card p-8 text-center">
        <div className="text-5xl mb-2">🎒</div>
        <h1 className="text-2xl font-black mb-2">なまえを おしえてね</h1>
        <p className="text-slate-500 mb-5">
          きみのメモやチャットを ほぞんするために つかうよ。
        </p>
        <input
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" &&
            nameInput.trim() &&
            setStudentName(nameInput.trim())
          }
          className="input text-center"
          placeholder="なまえ"
        />
        <button
          onClick={() => nameInput.trim() && setStudentName(nameInput.trim())}
          className="btn-primary px-6 py-3 text-lg w-full mt-4"
        >
          はじめる
        </button>
      </div>
    );
  }

  if (!work) return <p className="text-lg text-slate-500">よみこみ中…</p>;

  if (scenes.length === 0)
    return (
      <div>
        <h1 className="text-3xl font-black tracking-tight">{work.title}</h1>
        <div className="card p-10 text-center mt-4">
          <div className="text-5xl mb-3">🖼️</div>
          <p className="text-slate-500">まだシーンがありません。</p>
        </div>
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight">{work.title}</h1>
        <span className="text-base font-bold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
          {index + 1} / {scenes.length}
        </span>
      </div>

      {/* 進捗バー */}
      <div className="h-1.5 bg-slate-200 rounded-full mt-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
          style={{ width: `${((index + 1) / scenes.length) * 100}%` }}
        />
      </div>

      {/* 紙芝居ビューア */}
      <div className="card p-4 mt-3">
        {current.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.image_url}
            alt=""
            className="rounded-2xl w-full object-contain max-h-[60vh] bg-slate-100"
          />
        ) : (
          <div className="rounded-2xl w-full h-64 bg-slate-100 flex items-center justify-center text-slate-400 text-lg">
            （画像はまだありません）
          </div>
        )}
        {current.dialogue && (
          <p className="text-xl mt-3 leading-relaxed bg-slate-50 rounded-2xl px-4 py-3">
            💬 {current.dialogue}
          </p>
        )}
      </div>

      {/* 送るボタン */}
      <div className="flex items-center justify-between gap-3 mt-3">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="btn-ghost flex-1 px-4 py-4 text-xl disabled:opacity-40"
        >
          ◀ もどる
        </button>
        <button
          onClick={() => setIndex((i) => Math.min(scenes.length - 1, i + 1))}
          disabled={index === scenes.length - 1}
          className="btn-primary flex-1 px-4 py-4 text-xl disabled:opacity-40"
        >
          つぎへ ▶
        </button>
      </div>

      {/* シーンメモ */}
      <div className="card p-5 mt-4">
        <h2 className="section-title mb-3">✏️ このシーンで かんがえたこと</h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          className="input"
          placeholder="どうしてこうなったのかな？ どんな気もちかな？"
        />
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={saveNote}
            disabled={savingNote}
            className="btn-success px-6 py-3 text-lg"
          >
            {savingNote ? "ほぞん中…" : "メモをほぞん"}
          </button>
          {savedFlash && (
            <span className="text-emerald-600 font-bold">ほぞんしたよ！</span>
          )}
        </div>
      </div>

      {/* AIチャット */}
      <Chat workId={id} sceneId={current?.id ?? null} studentName={studentName} />

      {/* 感想文へ */}
      <div className="mt-6 text-center">
        <Link href={`/works/${id}/submit`} className="btn-accent px-8 py-4 text-xl">
          📝 感想文をかく
        </Link>
      </div>
    </div>
  );
}
