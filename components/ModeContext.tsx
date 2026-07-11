"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Mode = "teacher" | "student";

type ModeContextType = {
  mode: Mode;
  setMode: (m: Mode) => void;
  studentName: string;
  setStudentName: (n: string) => void;
};

const ModeContext = createContext<ModeContextType | null>(null);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("student");
  const [studentName, setStudentNameState] = useState<string>("");

  // 生徒名はlocalStorageに保持
  useEffect(() => {
    const saved = localStorage.getItem("studentName");
    if (saved) setStudentNameState(saved);
    const savedMode = localStorage.getItem("mode");
    if (savedMode === "teacher" || savedMode === "student") setMode(savedMode);
  }, []);

  const setStudentName = (n: string) => {
    setStudentNameState(n);
    localStorage.setItem("studentName", n);
  };

  const setModeAndSave = (m: Mode) => {
    setMode(m);
    localStorage.setItem("mode", m);
  };

  return (
    <ModeContext.Provider
      value={{ mode, setMode: setModeAndSave, studentName, setStudentName }}
    >
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used within ModeProvider");
  return ctx;
}
