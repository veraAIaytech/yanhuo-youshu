"use client";

// 底部演示导航：三个入口（顾客 / 阿姨 / 飞轮面板）
import Link from "next/link";

export default function Nav({ active }: { active: "customer" | "ayi" | "board" }) {
  const items = [
    { key: "customer", href: "/", label: "🥞 点餐", match: "customer" as const },
    { key: "ayi", href: "/ayi", label: "🪔 阿姨端", match: "ayi" as const },
    { key: "board", href: "/board", label: "📈 数据飞轮", match: "board" as const },
  ];
  return (
    <nav
      className="sticky bottom-0 z-40 flex border-t border-wood/25 bg-paper/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((it) => (
        <Link
          key={it.key}
          href={it.href}
          className={`flex-1 py-3 text-center text-sm font-medium min-h-[48px] leading-[24px] ${
            active === it.match ? "text-lantern-deep" : "text-ink-soft"
          }`}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
