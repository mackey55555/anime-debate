"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useMode } from "@/components/ModeContext";
import type { Work } from "@/lib/types";

export default function Home() {
  const { mode } = useMode();
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("works")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) console.error("works取得エラー:", error.message, error);
      setWorks(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight">作品いちらん</h1>
          <p className="text-slate-500 mt-1">
            {mode === "teacher"
              ? "作品を作って、みんなに紙芝居をとどけよう。"
              : "見たい作品をえらんでね。"}
          </p>
        </div>
        {mode === "teacher" && (
          <Link href="/teacher/works/new" className="btn-success px-5 py-3 text-lg">
            ＋ 作品をつくる
          </Link>
        )}
      </div>

      {loading ? (
        <p className="text-lg text-slate-500">よみこみ中…</p>
      ) : works.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-5xl mb-3">🎬</div>
          <p className="text-lg text-slate-500">まだ作品がありません。</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {works.map((w) => (
            <li key={w.id}>
              <Link
                href={
                  mode === "teacher"
                    ? `/teacher/works/${w.id}`
                    : `/works/${w.id}`
                }
                className="card card-hover p-5 h-full flex flex-col group"
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl w-12 h-12 shrink-0 grid place-items-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100">
                    🎞️
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition">
                      {w.title}
                    </div>
                    {w.description && (
                      <div className="text-slate-500 mt-1 line-clamp-2">
                        {w.description}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
