"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NewWork() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState("やわらかい水彩画のアニメ風");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("works")
      .insert({ title, description, style })
      .select()
      .single();
    setSaving(false);
    if (error || !data) {
      console.error("作品保存エラー:", error?.message, error);
      alert("保存に失敗しました: " + (error?.message ?? ""));
      return;
    }
    router.push(`/teacher/works/${data.id}`);
  };

  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight mb-1">作品をつくる</h1>
      <p className="text-slate-500 mb-5">タイトルと画風をきめよう。</p>
      <form onSubmit={submit} className="card p-6 grid gap-5">
        <label className="grid gap-1.5">
          <span className="text-lg font-bold">タイトル</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder="例: ふしぎな森のぼうけん"
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-lg font-bold">せつめい</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input"
            rows={3}
            placeholder="どんなお話かな？"
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-lg font-bold">画風（え の スタイル）</span>
          <input
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="input"
            placeholder="例: やわらかい水彩画のアニメ風"
          />
        </label>
        <button type="submit" disabled={saving} className="btn-success px-6 py-4 text-xl">
          {saving ? "保存中…" : "つくる"}
        </button>
      </form>
    </div>
  );
}
