"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ChatMessage } from "@/lib/types";

type Turn = { role: "user" | "assistant"; content: string };

export default function Chat({
  workId,
  sceneId,
  studentName,
}: {
  workId: string;
  sceneId: string | null;
  studentName: string;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // この作品×生徒の会話履歴を読み込む
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("work_id", workId)
        .eq("student_name", studentName)
        .order("created_at", { ascending: true });
      const msgs = (data as ChatMessage[] | null ?? []).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      setTurns(msgs);
    })();
  }, [workId, studentName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const next = [...turns, { role: "user" as const, content: text }];
    setTurns(next);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workId,
          sceneId,
          studentName,
          messages: next,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        console.error(json);
        setTurns((t) => [
          ...t,
          { role: "assistant", content: "ごめんね、うまくお返事できなかったよ。" },
        ]);
      } else {
        setTurns((t) => [...t, { role: "assistant", content: json.reply }]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow mt-4">
      <h2 className="text-lg font-bold mb-2">🤖 先生ロボと はなす</h2>
      <div className="grid gap-2 max-h-80 overflow-y-auto mb-3">
        {turns.length === 0 && (
          <p className="text-gray-500">
            きになったこと、なんでも きいてみよう！
          </p>
        )}
        {turns.map((t, i) => (
          <div
            key={i}
            className={`px-3 py-2 rounded-2xl text-lg max-w-[85%] ${
              t.role === "user"
                ? "bg-indigo-600 text-white justify-self-end"
                : "bg-gray-100 text-gray-900 justify-self-start"
            }`}
          >
            {t.content}
          </div>
        ))}
        {sending && (
          <div className="bg-gray-100 text-gray-500 px-3 py-2 rounded-2xl justify-self-start">
            考え中…
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          className="flex-1 border-2 border-indigo-200 rounded-xl p-3 text-lg"
          placeholder="しつもんを かいてね"
        />
        <button
          onClick={send}
          disabled={sending}
          className="bg-indigo-600 text-white px-5 py-3 rounded-xl text-lg font-bold disabled:opacity-50"
        >
          そうしん
        </button>
      </div>
    </div>
  );
}
