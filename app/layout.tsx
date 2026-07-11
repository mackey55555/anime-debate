import type { Metadata } from "next";
import "./globals.css";
import { ModeProvider } from "@/components/ModeContext";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "アニメ考察ひろば",
  description: "小学生のアニメ考察・感想アプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <ModeProvider>
          <Header />
          <main className="max-w-3xl mx-auto p-4">{children}</main>
        </ModeProvider>
      </body>
    </html>
  );
}
