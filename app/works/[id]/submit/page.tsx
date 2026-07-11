"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useMode } from "@/components/ModeContext";
import type { Work } from "@/lib/types";

type Result = { summary: string; score: number | null; comment: string };

export default function SubmitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { studentName } = useMode();
  const [work, setWork] = useState<Work | null>(null);
  const [essay, setEssay] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("works")
        .select("*")
        .eq("id", id)
        .single();
      setWork(data);
    })();
  }, [id]);

  const submit = async () => {
    if (!essay.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workId: id, studentName, essay }),
      });
      const json = await res.json();
      if (!res.ok) {
        console.error(json);
        alert("提出に失敗しました: " + (json.error ?? ""));
      } else {
        setResult(json);
      }
    } catch (e) {
      console.error(e);
      alert("提出に失敗しました");
    } finally {
      setSending(false);
    }
  };

  if (!studentName)
    return (
      <p className="text-lg">
        さきに <Link href={`/works/${id}`} className="text-indigo-600 underline">
          こちら
        </Link>{" "}
        でなまえを 登録してね。
      </p>
    );

  // 提出後: 要約+採点表示
  if (result)
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">📝 ていしゅつ できたよ！</h1>
        <div className="bg-white rounded-2xl p-5 shadow grid gap-4">
          <div>
            <div className="text-sm text-gray-500">せんせいの てん</div>
            <div className="text-3xl">
              {result.score
                ? "⭐".repeat(result.score) + "☆".repeat(5 - result.score)
                : "―"}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">ようやく</div>
            <p className="text-lg">{result.summary}</p>
          </div>
          <div>
            <div className="text-sm text-gray-500">せんせいから</div>
            <p className="text-lg leading-relaxed bg-yellow-50 rounded-xl p-3">
              {result.comment}
            </p>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <Link
            href={`/works/${id}`}
            className="bg-gray-200 px-5 py-3 rounded-xl text-lg font-bold"
          >
            もどる
          </Link>
          <Link
            href="/"
            className="bg-indigo-600 text-white px-5 py-3 rounded-xl text-lg font-bold"
          >
            作品いちらんへ
          </Link>
        </div>
      </div>
    );

  return (
    <div>
      <h1 className="text-2xl font-bold">📝 かんそうぶんを かく</h1>
      {work && <p className="text-gray-600 mt-1">「{work.title}」</p>}
      <p className="text-gray-600 mt-2">
        すきなシーンや、かんがえたこと、かんじたことを かいてみよう。
      </p>
      <textarea
        value={essay}
        onChange={(e) => setEssay(e.target.value)}
        rows={10}
        className="border-2 border-indigo-200 rounded-xl p-3 text-lg w-full mt-3"
        placeholder="このアニメを見て…"
      />
      <button
        onClick={submit}
        disabled={sending || !essay.trim()}
        className="mt-3 bg-pink-500 text-white px-6 py-4 rounded-xl text-xl font-bold disabled:opacity-50"
      >
        {sending ? "せんせいが よんでいるよ…" : "ていしゅつする"}
      </button>
    </div>
  );
}
