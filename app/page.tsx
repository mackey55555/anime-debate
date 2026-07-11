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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">作品いちらん</h1>
        {mode === "teacher" && (
          <Link
            href="/teacher/works/new"
            className="bg-green-600 text-white px-5 py-3 rounded-xl text-lg font-bold"
          >
            ＋ 作品をつくる
          </Link>
        )}
      </div>

      {loading ? (
        <p className="text-lg">よみこみ中…</p>
      ) : works.length === 0 ? (
        <p className="text-lg text-gray-600">まだ作品がありません。</p>
      ) : (
        <ul className="grid gap-3">
          {works.map((w) => (
            <li key={w.id}>
              <Link
                href={
                  mode === "teacher"
                    ? `/teacher/works/${w.id}`
                    : `/works/${w.id}`
                }
                className="block bg-white rounded-xl p-4 shadow hover:shadow-md"
              >
                <div className="text-xl font-bold">{w.title}</div>
                {w.description && (
                  <div className="text-gray-600 mt-1">{w.description}</div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
