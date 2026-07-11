"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMode } from "./ModeContext";

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { mode, setMode, studentName } = useMode();
  const pathname = usePathname();

  const items = [
    { href: "/", label: "🏠 作品いちらん", show: true },
    {
      href: "/teacher/works/new",
      label: "➕ 作品をつくる",
      show: mode === "teacher",
    },
  ].filter((i) => i.show);

  return (
    <>
      {/* 背景オーバーレイ */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* ドロワー本体 */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 max-w-[80%] bg-white/95 backdrop-blur-xl shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-4 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
          <span className="text-lg font-black">メニュー</span>
          <button
            onClick={onClose}
            className="text-xl w-9 h-9 grid place-items-center rounded-lg hover:bg-white/15 active:scale-90 transition"
            aria-label="とじる"
          >
            ✕
          </button>
        </div>

        <nav className="p-3 grid gap-2">
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              onClick={onClose}
              className={`block px-4 py-3 rounded-2xl text-lg font-bold transition ${
                pathname === i.href
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {i.label}
            </Link>
          ))}
        </nav>

        {/* モード切替 */}
        <div className="p-4 mt-1 mx-3 rounded-2xl bg-slate-50 ring-1 ring-slate-200/70">
          <div className="text-sm text-slate-500 mb-2 font-bold">
            モードをきりかえ
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode("teacher")}
              className={`px-3 py-3 rounded-xl text-base font-bold transition ${
                mode === "teacher"
                  ? "bg-white text-indigo-600 shadow ring-1 ring-indigo-200"
                  : "text-slate-600 hover:bg-white/60"
              }`}
            >
              👨‍🏫 先生
            </button>
            <button
              onClick={() => setMode("student")}
              className={`px-3 py-3 rounded-xl text-base font-bold transition ${
                mode === "student"
                  ? "bg-white text-indigo-600 shadow ring-1 ring-indigo-200"
                  : "text-slate-600 hover:bg-white/60"
              }`}
            >
              🎒 生徒
            </button>
          </div>
          {mode === "student" && studentName && (
            <div className="text-sm text-slate-500 mt-3">
              なまえ: <span className="font-bold text-slate-700">{studentName}</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
