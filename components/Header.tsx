"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMode } from "./ModeContext";

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { mode, setMode } = useMode();
  const router = useRouter();

  const handleModeChange = (nextMode: "teacher" | "student") => {
    setMode(nextMode);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/20">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onMenuClick}
            className="text-2xl w-10 h-10 grid place-items-center rounded-xl hover:bg-white/15 active:scale-90 transition"
            aria-label="メニューをひらく"
          >
            ☰
          </button>
          <Link href="/" className="text-xl font-black tracking-tight">
            🎬 アニメ考察ひろば
          </Link>
        </div>

        <div className="flex gap-1 bg-white/15 p-1 rounded-full backdrop-blur-sm">
          <button
            onClick={() => handleModeChange("teacher")}
            className={`px-4 py-1.5 rounded-full text-base font-bold transition ${
              mode === "teacher"
                ? "bg-white text-indigo-600 shadow"
                : "text-white/90 hover:bg-white/10"
            }`}
          >
            👨‍🏫 先生
          </button>
          <button
            onClick={() => handleModeChange("student")}
            className={`px-4 py-1.5 rounded-full text-base font-bold transition ${
              mode === "student"
                ? "bg-white text-indigo-600 shadow"
                : "text-white/90 hover:bg-white/10"
            }`}
          >
            🎒 生徒
          </button>
        </div>
      </div>
    </header>
  );
}
