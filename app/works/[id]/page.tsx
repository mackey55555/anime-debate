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
      <div className="max-w-md mx-auto mt-8 bg-white rounded-2xl p-6 shadow text-center">
        <h1 className="text-2xl font-bold mb-2">🎒 なまえを おしえてね</h1>
        <p className="text-gray-600 mb-4">
          きみのメモやチャットを ほぞんするために つかうよ。
        </p>
        <input
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          className="border-2 border-indigo-200 rounded-xl p-3 text-lg w-full text-center"
          placeholder="なまえ"
        />
        <button
          onClick={() => nameInput.trim() && setStudentName(nameInput.trim())}
          className="mt-4 bg-indigo-600 text-white px-6 py-3 rounded-xl text-lg font-bold w-full"
        >
          はじめる
        </button>
      </div>
    );
  }

  if (!work) return <p className="text-lg">よみこみ中…</p>;

  if (scenes.length === 0)
    return (
      <div>
        <h1 className="text-2xl font-bold">{work.title}</h1>
        <p className="text-gray-600 mt-4">まだシーンがありません。</p>
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{work.title}</h1>
        <span className="text-lg font-bold text-indigo-600">
          {index + 1} / {scenes.length}
        </span>
      </div>

      {/* 紙芝居ビューア */}
      <div className="bg-white rounded-2xl p-4 shadow mt-3">
        {current.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.image_url}
            alt=""
            className="rounded-xl w-full object-contain max-h-[60vh] bg-gray-100"
          />
        ) : (
          <div className="rounded-xl w-full h-64 bg-gray-100 flex items-center justify-center text-gray-400 text-lg">
            （画像はまだありません）
          </div>
        )}
        {current.dialogue && (
          <p className="text-xl mt-3 leading-relaxed">💬 {current.dialogue}</p>
        )}
      </div>

      {/* 送るボタン */}
      <div className="flex items-center justify-between gap-3 mt-3">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="flex-1 bg-gray-200 text-gray-800 px-4 py-4 rounded-xl text-xl font-bold disabled:opacity-40"
        >
          ◀ もどる
        </button>
        <button
          onClick={() => setIndex((i) => Math.min(scenes.length - 1, i + 1))}
          disabled={index === scenes.length - 1}
          className="flex-1 bg-indigo-600 text-white px-4 py-4 rounded-xl text-xl font-bold disabled:opacity-40"
        >
          つぎへ ▶
        </button>
      </div>

      {/* シーンメモ */}
      <div className="bg-white rounded-2xl p-4 shadow mt-4">
        <h2 className="text-lg font-bold mb-2">
          ✏️ このシーンで かんがえたこと
        </h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          className="border-2 border-indigo-200 rounded-xl p-3 text-lg w-full"
          placeholder="どうしてこうなったのかな？ どんな気もちかな？"
        />
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={saveNote}
            disabled={savingNote}
            className="bg-green-600 text-white px-6 py-3 rounded-xl text-lg font-bold disabled:opacity-50"
          >
            {savingNote ? "ほぞん中…" : "メモをほぞん"}
          </button>
          {savedFlash && (
            <span className="text-green-600 font-bold">ほぞんしたよ！</span>
          )}
        </div>
      </div>

      {/* AIチャット */}
      <Chat workId={id} sceneId={current?.id ?? null} studentName={studentName} />

      {/* 感想文へ（提出はステップ6で実装） */}
      <div className="mt-6 text-center">
        <Link
          href={`/works/${id}/submit`}
          className="inline-block bg-pink-500 text-white px-6 py-4 rounded-xl text-xl font-bold"
        >
          📝 感想文をかく
        </Link>
      </div>
    </div>
  );
}
