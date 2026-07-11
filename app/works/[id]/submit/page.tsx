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
        さきに <Link href={`/works/${id}`} className="text-indigo-600 font-bold underline">
          こちら
        </Link>{" "}
        でなまえを 登録してね。
      </p>
    );

  // 提出後: 要約+採点表示
  if (result)
    return (
      <div>
        <div className="text-center mb-5">
          <div className="text-5xl mb-2">🎉</div>
          <h1 className="text-3xl font-black tracking-tight">
            ていしゅつ できたよ！
          </h1>
        </div>
        <div className="card p-6 grid gap-5">
          <div className="text-center">
            <div className="text-sm text-slate-500 mb-1">せんせいの てん</div>
            <div className="text-4xl tracking-widest">
              {result.score
                ? "⭐".repeat(result.score) + "☆".repeat(5 - result.score)
                : "―"}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-500 font-bold mb-1">ようやく</div>
            <p className="text-lg">{result.summary}</p>
          </div>
          <div>
            <div className="text-sm text-slate-500 font-bold mb-1">せんせいから</div>
            <p className="text-lg leading-relaxed bg-gradient-to-br from-amber-50 to-yellow-50 ring-1 ring-amber-100 rounded-2xl p-4">
              {result.comment}
            </p>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <Link href={`/works/${id}`} className="btn-ghost px-5 py-3 text-lg">
            もどる
          </Link>
          <Link href="/" className="btn-primary px-5 py-3 text-lg">
            作品いちらんへ
          </Link>
        </div>
      </div>
    );

  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">
        📝 かんそうぶんを かく
      </h1>
      {work && (
        <p className="text-slate-500 mt-1 font-bold">「{work.title}」</p>
      )}
      <p className="text-slate-500 mt-2">
        すきなシーンや、かんがえたこと、かんじたことを かいてみよう。
      </p>
      <textarea
        value={essay}
        onChange={(e) => setEssay(e.target.value)}
        rows={10}
        className="input mt-3"
        placeholder="このアニメを見て…"
      />
      <button
        onClick={submit}
        disabled={sending || !essay.trim()}
        className="btn-accent px-6 py-4 text-xl mt-3"
      >
        {sending ? "せんせいが よんでいるよ…" : "ていしゅつする"}
      </button>
    </div>
  );
}
