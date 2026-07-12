import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Buddy — AI Pet",
  description: "会話と思い出で育つAIペット",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
