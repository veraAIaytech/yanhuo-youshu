import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "烟火有数 · 煎饼阿姨的 AI 经营副驾",
  description:
    "给个体小摊主的 AI 记性、算盘和喇叭：备货预测、熟客档案、出摊预告。AI 不抢锅铲，只补记性。",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "烟火有数",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
