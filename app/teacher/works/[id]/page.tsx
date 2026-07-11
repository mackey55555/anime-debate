"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Work, Scene, Submission } from "@/lib/types";

export default function TeacherWork({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [work, setWork] = useState<Work | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [promptText, setPromptText] = useState("");
  const [dialogue, setDialogue] = useState("");
  const [adding, setAdding] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editPromptText, setEditPromptText] = useState("");
  const [editDialogue, setEditDialogue] = useState("");
  const [savingEdit, setSavingEdit] = useState<string | null>(null);
  const [tab, setTab] = useState<"scenes" | "submissions">("scenes");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  const load = async () => {
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
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const addScene = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim() && !dialogue.trim()) return;
    setAdding(true);
    const nextOrder =
      scenes.length > 0
        ? Math.max(...scenes.map((s) => s.sort_order)) + 1
        : 0;
    const { error } = await supabase.from("scenes").insert({
      work_id: id,
      sort_order: nextOrder,
      prompt_text: promptText,
      dialogue,
    });
    setAdding(false);
    if (error) {
      console.error(error);
      alert("シーンの追加に失敗しました");
      return;
    }
    setPromptText("");
    setDialogue("");
    load();
  };

  // ↑↓で隣のシーンとsort_orderを入れ替える
  const moveScene = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= scenes.length) return;
    const a = scenes[i];
    const b = scenes[j];
    setReordering(true);
    await Promise.all([
      supabase.from("scenes").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("scenes").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    setReordering(false);
    load();
  };

  const generateImage = async (scene: Scene) => {
    setGenerating(scene.id);
    try {
      const res = await fetch("/api/scenes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workId: id,
          sceneId: scene.id,
          promptText: scene.prompt_text,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        console.error(json);
        alert("画像生成に失敗しました: " + (json.error ?? ""));
      } else {
        await load();
      }
    } catch (e) {
      console.error(e);
      alert("画像生成に失敗しました");
    } finally {
      setGenerating(null);
    }
  };

  const deleteScene = async (scene: Scene) => {
    if (!window.confirm("このシーンを本当に削除しますか？")) return;
    setDeleting(scene.id);
    const { error } = await supabase.from("scenes").delete().eq("id", scene.id);
    setDeleting(null);
    if (error) {
      console.error(error);
      alert("シーンの削除に失敗しました");
      return;
    }
    await load();
  };

  const startEditingScene = (scene: Scene) => {
    setEditingSceneId(scene.id);
    setEditPromptText(scene.prompt_text ?? "");
    setEditDialogue(scene.dialogue ?? "");
  };

  const cancelEdit = () => {
    setEditingSceneId(null);
  };

  const saveSceneEdit = async (scene: Scene) => {
    setSavingEdit(scene.id);
    const { error } = await supabase
      .from("scenes")
      .update({ prompt_text: editPromptText, dialogue: editDialogue })
      .eq("id", scene.id);
    setSavingEdit(null);
    if (error) {
      console.error(error);
      alert("シーンの更新に失敗しました");
      return;
    }
    setEditingSceneId(null);
    await load();
  };

  const loadSubmissions = async () => {
    setLoadingSubs(true);
    try {
      const res = await fetch(`/api/works/${id}/submissions`);
      const json = await res.json();
      setSubmissions(json.submissions ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSubs(false);
    }
  };

  const openSubmissions = () => {
    setTab("submissions");
    loadSubmissions();
  };

  if (!work) return <p className="text-lg text-slate-500">よみこみ中…</p>;

  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">{work.title}</h1>
      {work.description && (
        <p className="text-slate-500 mt-1">{work.description}</p>
      )}
      <p className="text-sm text-slate-400 mt-1">
        画風: <span className="font-bold text-slate-500">{work.style}</span>
      </p>

      {/* タブ */}
      <div className="flex gap-1.5 mt-5 p-1 bg-slate-100 rounded-2xl w-fit">
        <button
          onClick={() => setTab("scenes")}
          className={`px-5 py-2 rounded-xl text-lg font-bold transition ${
            tab === "scenes"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          シーン編集
        </button>
        <button
          onClick={openSubmissions}
          className={`px-5 py-2 rounded-xl text-lg font-bold transition ${
            tab === "submissions"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          提出一覧
        </button>
      </div>

      {tab === "submissions" ? (
        <div className="mt-4">
          {loadingSubs ? (
            <p className="text-lg">よみこみ中…</p>
          ) : submissions.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-slate-500">まだ提出がありません。</p>
            </div>
          ) : (
            <ul className="grid gap-3">
              {submissions.map((sub) => (
                <li key={sub.id} className="card p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold">
                      🎒 {sub.student_name}
                    </div>
                    <div className="text-xl tracking-widest">
                      {sub.ai_score
                        ? "⭐".repeat(sub.ai_score) +
                          "☆".repeat(5 - sub.ai_score)
                        : "―"}
                    </div>
                  </div>
                  {sub.ai_summary && (
                    <p className="mt-2">
                      <span className="text-sm text-slate-400 font-bold">
                        要約:{" "}
                      </span>
                      {sub.ai_summary}
                    </p>
                  )}
                  {sub.ai_comment && (
                    <p className="mt-2 text-slate-700 bg-gradient-to-br from-amber-50 to-yellow-50 ring-1 ring-amber-100 rounded-2xl p-3">
                      {sub.ai_comment}
                    </p>
                  )}
                  <details className="mt-2">
                    <summary className="cursor-pointer text-indigo-600 font-bold">
                      感想文ぜんぶを見る
                    </summary>
                    <p className="mt-2 whitespace-pre-wrap text-slate-700">
                      {sub.essay}
                    </p>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
      <>
      <h2 className="section-title mt-6 mb-3">シーン一覧</h2>
      {scenes.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-5xl mb-3">🎬</div>
          <p className="text-slate-500">まだシーンがありません。</p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {scenes.map((s, i) => (
            <li key={s.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="font-bold text-white text-sm px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500">
                  シーン {i + 1}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => moveScene(i, -1)}
                    disabled={reordering || i === 0}
                    className="w-9 h-9 grid place-items-center bg-slate-100 hover:bg-slate-200 rounded-lg text-lg font-bold transition active:scale-90 disabled:opacity-30"
                    aria-label="上へ"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveScene(i, 1)}
                    disabled={reordering || i === scenes.length - 1}
                    className="w-9 h-9 grid place-items-center bg-slate-100 hover:bg-slate-200 rounded-lg text-lg font-bold transition active:scale-90 disabled:opacity-30"
                    aria-label="下へ"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => startEditingScene(s)}
                    className="w-9 h-9 grid place-items-center bg-slate-100 hover:bg-slate-200 rounded-lg text-lg font-bold transition active:scale-90"
                    aria-label="編集"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => deleteScene(s)}
                    disabled={deleting === s.id}
                    className="w-9 h-9 grid place-items-center bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-lg font-bold transition active:scale-90 disabled:opacity-30"
                    aria-label="削除"
                  >
                    ×
                  </button>
                </div>
              </div>
              {editingSceneId === s.id ? (
                <div className="mt-3 space-y-3">
                  <label className="grid gap-1.5">
                    <span className="text-sm text-slate-400 font-bold">絵の説明</span>
                    <textarea
                      value={editPromptText}
                      onChange={(e) => setEditPromptText(e.target.value)}
                      className="input"
                      rows={2}
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-sm text-slate-400 font-bold">セリフ</span>
                    <textarea
                      value={editDialogue}
                      onChange={(e) => setEditDialogue(e.target.value)}
                      className="input"
                      rows={2}
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => saveSceneEdit(s)}
                      disabled={savingEdit === s.id}
                      className="btn-primary px-4 py-2"
                    >
                      {savingEdit === s.id ? "保存中…" : "保存する"}
                    </button>
                    <button
                      onClick={cancelEdit}
                      type="button"
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : s.image_url ? (
                <img
                  src={s.image_url}
                  alt=""
                  className="rounded-2xl mt-3 max-h-64 w-full object-cover"
                />
              ) : (
                <div className="rounded-2xl mt-3 h-32 bg-slate-100 flex items-center justify-center text-sm text-slate-400">
                  （画像はまだありません）
                </div>
              )}
              {s.prompt_text && (
                <div className="mt-3">
                  <span className="text-sm text-slate-400 font-bold">
                    絵の説明:{" "}
                  </span>
                  {s.prompt_text}
                </div>
              )}
              {s.dialogue && (
                <div className="mt-1">
                  <span className="text-sm text-slate-400 font-bold">
                    セリフ:{" "}
                  </span>
                  {s.dialogue}
                </div>
              )}
              <button
                onClick={() => generateImage(s)}
                disabled={generating === s.id}
                className="btn-accent mt-3 px-4 py-2"
              >
                {generating === s.id
                  ? "生成中…（30秒ほど）"
                  : s.image_url
                  ? "🎨 画像を作り直す"
                  : "🎨 画像を生成"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2 className="section-title mt-6 mb-3">シーンを追加</h2>
      <form onSubmit={addScene} className="card p-5 grid gap-4">
        <label className="grid gap-1.5">
          <span className="font-bold">絵の説明（プロンプト）</span>
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            className="input"
            rows={2}
            placeholder="例: 森の中で光る木を見つける子ども"
          />
        </label>
        <label className="grid gap-1.5">
          <span className="font-bold">セリフ</span>
          <textarea
            value={dialogue}
            onChange={(e) => setDialogue(e.target.value)}
            className="input"
            rows={2}
            placeholder="例: あれ、なんだか光ってるよ！"
          />
        </label>
        <button type="submit" disabled={adding} className="btn-primary px-6 py-3 text-lg">
          {adding ? "追加中…" : "＋ シーンを追加"}
        </button>
      </form>
      </>
      )}
    </div>
  );
}
