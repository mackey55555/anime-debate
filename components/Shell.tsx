"use client";

import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Header onMenuClick={() => setOpen(true)} />
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <main className="max-w-3xl mx-auto p-4">{children}</main>
    </>
  );
}
