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
        className={`fixed top-0 left-0 h-full w-72 max-w-[80%] bg-white shadow-xl z-50 transform transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b">
          <span className="text-lg font-bold">メニュー</span>
          <button
            onClick={onClose}
            className="text-2xl px-2 leading-none"
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
              className={`block px-4 py-3 rounded-xl text-lg font-bold ${
                pathname === i.href
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              {i.label}
            </Link>
          ))}
        </nav>

        {/* モード切替 */}
        <div className="p-3 border-t mt-2">
          <div className="text-sm text-gray-500 mb-2">モードをきりかえ</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode("teacher")}
              className={`px-3 py-3 rounded-xl text-base font-bold ${
                mode === "teacher"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              👨‍🏫 先生
            </button>
            <button
              onClick={() => setMode("student")}
              className={`px-3 py-3 rounded-xl text-base font-bold ${
                mode === "student"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              🎒 生徒
            </button>
          </div>
          {mode === "student" && studentName && (
            <div className="text-sm text-gray-500 mt-3">
              なまえ: <span className="font-bold">{studentName}</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
