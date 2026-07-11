import type { Metadata } from "next";
import "./globals.css";
import { ModeProvider } from "@/components/ModeContext";
import Shell from "@/components/Shell";

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
          <Shell>{children}</Shell>
        </ModeProvider>
      </body>
    </html>
  );
}
