"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Work, Scene } from "@/lib/types";

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

  if (!work) return <p className="text-lg">よみこみ中…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold">{work.title}</h1>
      {work.description && (
        <p className="text-gray-600 mt-1">{work.description}</p>
      )}
      <p className="text-sm text-gray-500 mt-1">画風: {work.style}</p>

      <h2 className="text-xl font-bold mt-6 mb-2">シーン一覧</h2>
      {scenes.length === 0 ? (
        <p className="text-gray-600">まだシーンがありません。</p>
      ) : (
        <ul className="grid gap-3">
          {scenes.map((s, i) => (
            <li key={s.id} className="bg-white rounded-xl p-4 shadow">
              <div className="font-bold text-indigo-600">
                シーン {i + 1}
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
    </div>
  );
}
