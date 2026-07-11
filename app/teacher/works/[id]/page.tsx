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

  if (!work) return <p className="text-lg">よみこみ中…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold">{work.title}</h1>
      {work.description && (
        <p className="text-gray-600 mt-1">{work.description}</p>
      )}
      <p className="text-sm text-gray-500 mt-1">画風: {work.style}</p>

      {/* タブ */}
      <div className="flex gap-2 mt-4 border-b-2 border-gray-200">
        <button
          onClick={() => setTab("scenes")}
          className={`px-5 py-2 rounded-t-xl text-lg font-bold ${
            tab === "scenes"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          シーン編集
        </button>
        <button
          onClick={openSubmissions}
          className={`px-5 py-2 rounded-t-xl text-lg font-bold ${
            tab === "submissions"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-600"
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
            <p className="text-gray-600">まだ提出がありません。</p>
          ) : (
            <ul className="grid gap-3">
              {submissions.map((sub) => (
                <li key={sub.id} className="bg-white rounded-xl p-4 shadow">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold">
                      🎒 {sub.student_name}
                    </div>
                    <div className="text-xl">
                      {sub.ai_score
                        ? "⭐".repeat(sub.ai_score) +
                          "☆".repeat(5 - sub.ai_score)
                        : "―"}
                    </div>
                  </div>
                  {sub.ai_summary && (
                    <p className="mt-2">
                      <span className="text-sm text-gray-500">要約: </span>
                      {sub.ai_summary}
                    </p>
                  )}
                  {sub.ai_comment && (
                    <p className="mt-1 text-gray-700 bg-yellow-50 rounded-lg p-2">
                      {sub.ai_comment}
                    </p>
                  )}
                  <details className="mt-2">
                    <summary className="cursor-pointer text-indigo-600">
                      感想文ぜんぶを見る
                    </summary>
                    <p className="mt-2 whitespace-pre-wrap">{sub.essay}</p>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
      <>
      <h2 className="text-xl font-bold mt-6 mb-2">シーン一覧</h2>
      {scenes.length === 0 ? (
        <p className="text-gray-600">まだシーンがありません。</p>
      ) : (
        <ul className="grid gap-3">
          {scenes.map((s, i) => (
            <li key={s.id} className="bg-white rounded-xl p-4 shadow">
              <div className="flex items-center justify-between">
                <div className="font-bold text-indigo-600">
                  シーン {i + 1}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => moveScene(i, -1)}
                    disabled={reordering || i === 0}
                    className="bg-gray-200 px-3 py-1 rounded-lg text-lg font-bold disabled:opacity-30"
                    aria-label="上へ"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveScene(i, 1)}
                    disabled={reordering || i === scenes.length - 1}
                    className="bg-gray-200 px-3 py-1 rounded-lg text-lg font-bold disabled:opacity-30"
                    aria-label="下へ"
                  >
                    ↓
                  </button>
                </div>
              </div>
              {s.image_url ? (
                <img
                  src={s.image_url}
                  alt=""
                  className="rounded-lg mt-2 max-h-64"
                />
              ) : (
                <div className="text-sm text-gray-400 mt-1">
                  （画像はまだありません）
                </div>
              )}
              {s.prompt_text && (
                <div className="mt-2">
                  <span className="text-sm text-gray-500">絵の説明: </span>
                  {s.prompt_text}
                </div>
              )}
              {s.dialogue && (
                <div className="mt-1">
                  <span className="text-sm text-gray-500">セリフ: </span>
                  {s.dialogue}
                </div>
              )}
              <button
                onClick={() => generateImage(s)}
                disabled={generating === s.id}
                className="mt-3 bg-pink-500 text-white px-4 py-2 rounded-xl font-bold disabled:opacity-50"
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

      <h2 className="text-xl font-bold mt-6 mb-2">シーンを追加</h2>
      <form onSubmit={addScene} className="grid gap-3 bg-white rounded-xl p-4 shadow">
        <label className="grid gap-1">
          <span className="font-bold">絵の説明（プロンプト）</span>
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            className="border-2 border-indigo-200 rounded-xl p-3 text-lg"
            rows={2}
            placeholder="例: 森の中で光る木を見つける子ども"
          />
        </label>
        <label className="grid gap-1">
          <span className="font-bold">セリフ</span>
          <textarea
            value={dialogue}
            onChange={(e) => setDialogue(e.target.value)}
            className="border-2 border-indigo-200 rounded-xl p-3 text-lg"
            rows={2}
            placeholder="例: あれ、なんだか光ってるよ！"
          />
        </label>
        <button
          type="submit"
          disabled={adding}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-lg font-bold disabled:opacity-50"
        >
          {adding ? "追加中…" : "＋ シーンを追加"}
        </button>
      </form>
      </>
      )}
    </div>
  );
}
