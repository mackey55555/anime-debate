"use client";

import Link from "next/link";
import { useMode } from "./ModeContext";

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { mode, setMode } = useMode();

  return (
    <header className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between shadow">
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="text-2xl px-2 py-1 rounded-lg hover:bg-indigo-500"
          aria-label="メニューをひらく"
        >
          ☰
        </button>
        <Link href="/" className="text-xl font-bold">
          🎬 アニメ考察ひろば
        </Link>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setMode("teacher")}
          className={`px-4 py-2 rounded-full text-lg font-bold ${
            mode === "teacher"
              ? "bg-white text-indigo-600"
              : "bg-indigo-500 text-white"
          }`}
        >
          👨‍🏫 先生
        </button>
        <button
          onClick={() => setMode("student")}
          className={`px-4 py-2 rounded-full text-lg font-bold ${
            mode === "student"
              ? "bg-white text-indigo-600"
              : "bg-indigo-500 text-white"
          }`}
        >
          🎒 生徒
        </button>
      </div>
    </header>
  );
}
