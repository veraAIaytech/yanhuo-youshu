"use client";

// 收银台：环境检测（微信/支付宝/浏览器）→ Mock 通道完整收银链路 → 取餐码
// 落地时 MockProvider 换成官方接口，本页 UI 零改动（见 docs/PLAN.md）

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import type { MenuItem, Order } from "@/lib/types";

type Env = "wechat" | "alipay" | "browser";

export default function CheckoutPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [pickupCode, setPickupCode] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [env, setEnv] = useState<Env>("browser");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetch("/api/menu")
      .then((r) => r.json())
      .then((d) => setMenu(d.menu))
      .catch(() => {});
  }, []);

  // 展示用：内部 id → 顾客看得懂的名字
  const itemName = (id: string) => menu.find((m) => m.id === id)?.name ?? id;
  const optName = (menuId: string, optId: string) =>
    menu.find((m) => m.id === menuId)?.options.find((o) => o.id === optId)?.name ?? optId;

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("orderId");
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("micromessenger")) setEnv("wechat");
    else if (ua.includes("alipay")) setEnv("alipay");
    if (id) {
      fetch(`/api/orders?id=${id}`)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d) => {
          setOrder(d.order);
          setPickupCode(d.pickupCode);
        })
        .catch(() => setNotFound(true));
    } else {
      setNotFound(true);
    }
  }, []);

  const pay = async (method: string) => {
    if (!order || paying) return;
    setPaying(true);
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, method }),
      });
      const d = await res.json();
      if (d.order) {
        setOrder({ ...d.order });
        setPickupCode(d.pickupCode);
      }
    } finally {
      setPaying(false);
    }
  };

  if (notFound) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="text-4xl">🥞</p>
        <h1 className="mt-4 text-lg font-bold">演示数据刚被重置啦</h1>
        <p className="mt-2 text-sm text-ink-soft">不是你的错——回首页重新下一单就好</p>
        <Link href="/" className="btn-lantern mt-6 inline-block">
          回去看看菜单
        </Link>
        <Nav active="customer" />
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md items-center justify-center">
        <p className="text-ink-soft">正在核对订单…</p>
      </main>
    );
  }

  // ---- 已支付：取餐码 ----
  if (order.status !== "待支付") {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        <div className="night-panel flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="text-5xl">🥢</p>
          <h1 className="mt-4 text-xl font-bold">付好啦，给你留着！</h1>
          <p className="mt-2 text-sm text-paper/75">
            {order.pickupSlot} 到摊，报这个号就行
          </p>
          <div className="mt-6 rounded-2xl bg-paper px-10 py-5">
            <p className="text-xs text-ink-soft">取餐号</p>
            <p className="text-4xl font-black tracking-widest text-lantern-deep">{pickupCode}</p>
          </div>
          <p className="mt-6 text-sm leading-6 text-paper/85">
            {order.customerNick === "路人甲"
              ? "豆浆给你盛最烫的那碗 ☕"
              : `${order.customerNick}，豆浆给你盛最烫的那碗 ☕`}
          </p>
          <p className="mt-2 text-xs text-paper/50">
            已支付 ¥{order.total} · {order.payMethod} · Mock 通道（落地时换官方接口，页面不变）
          </p>
        </div>
        <Nav active="customer" />
      </main>
    );
  }

  // ---- 待支付：选支付方式 ----
  const methods =
    env === "wechat"
      ? [{ id: "微信", label: "微信支付（长按识别收款码）", emoji: "💚" }]
      : env === "alipay"
        ? [{ id: "支付宝", label: "支付宝付款", emoji: "💙" }]
        : [
            { id: "微信", label: "微信支付", emoji: "💚" },
            { id: "支付宝", label: "支付宝", emoji: "💙" },
            { id: "到店付", label: "到摊再付", emoji: "🤝" },
          ];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="px-5 pb-4 pt-8">
        <h1 className="text-xl font-bold">收银台</h1>
        <p className="mt-1 text-xs text-ink-soft">
          检测到你正在{env === "wechat" ? "微信内" : env === "alipay" ? "支付宝内" : "浏览器"}打开 ·
          已自动选出可用支付方式
        </p>
      </header>

      <div className="flex-1 px-4">
        <div className="card-paper p-4">
          <p className="text-xs text-ink-soft">良米煎饼 · 自提订单</p>
          <p className="mt-1 text-3xl font-black">¥{order.total}</p>
          <div className="mt-2 space-y-1 text-sm text-ink-soft">
            {order.items.map((l, i) => (
              <p key={i}>
                × {l.qty} · {itemName(l.menuItemId)}
                {l.optionIds.length
                  ? `（${l.optionIds.map((oid) => optName(l.menuItemId, oid)).join("/")}）`
                  : ""}
              </p>
            ))}
            <p>自提时段：{order.pickupSlot}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {methods.map((m) => (
            <button
              key={m.id}
              className="card-paper flex w-full items-center gap-3 p-4 text-left font-semibold"
              disabled={paying}
              onClick={() => pay(m.id)}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="flex-1">{paying ? "正在收银…" : m.label}</span>
              <span className="text-ink-soft">›</span>
            </button>
          ))}
        </div>

        <p className="mt-4 px-1 text-xs leading-5 text-ink-soft">
          🔒 演示环境使用 Mock 通道模拟收款，不产生真实扣款。
          落地路线：先官方双码（≈0 费率）→ 流水上来再接商户号 API，适配层已就绪。
        </p>
      </div>
      <Nav active="customer" />
    </main>
  );
}
