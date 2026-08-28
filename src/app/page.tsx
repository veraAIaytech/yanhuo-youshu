"use client";

// 顾客端：出摊预告 + 菜单多规格 + 购物车 + 自提时段下单
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import type { MenuItem } from "@/lib/types";

interface CartLine {
  menuItemId: string;
  optionIds: string[];
  qty: number;
}

const PICKUP_SLOTS = ["06:30 - 06:50", "06:50 - 07:10", "07:10 - 07:30", "07:30 - 08:00", "08:00 - 08:40", "08:40 以后"];

export default function CustomerPage() {
  const router = useRouter();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [stall, setStall] = useState<{ openToday: boolean; note: string } | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pickupSlot, setPickupSlot] = useState(PICKUP_SLOTS[2]);
  const [nick, setNick] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/menu")
      .then((r) => r.json())
      .then((d) => {
        setMenu(d.menu);
        setStall(d.stall);
      });
  }, []);

  const keyOf = (l: CartLine) => `${l.menuItemId}|${[...l.optionIds].sort().join(",")}`;

  const addToCart = (item: MenuItem, optionIds: string[]) => {
    setCart((prev) => {
      const line = { menuItemId: item.id, optionIds, qty: 1 };
      const k = keyOf(line);
      const found = prev.find((l) => keyOf(l) === k);
      if (found) return prev.map((l) => (keyOf(l) === k ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, line];
    });
    setExpanded(null);
  };

  const setQty = (line: CartLine, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (keyOf(l) === keyOf(line) ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0)
    );
  };

  const priceOf = (item: MenuItem, optionIds: string[]) =>
    item.price + optionIds.reduce((a, oid) => a + (item.options.find((o) => o.id === oid)?.priceDelta ?? 0), 0);

  const cartCount = cart.reduce((a, l) => a + l.qty, 0);
  const cartTotal = useMemo(
    () =>
      Math.round(
        cart.reduce((a, l) => a + priceOf(menu.find((m) => m.id === l.menuItemId)!, l.optionIds) * l.qty, 0) * 10
      ) / 10,
    [cart, menu]
  );

  const submit = async () => {
    if (submitting || cart.length === 0) return;
    setSubmitting(true);
    try {
      const orderId = crypto.randomUUID();
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, items: cart, pickupSlot, note, customerNick: nick || "路人甲" }),
      });
      const data = await res.json();
      if (data.order) {
        sessionStorage.setItem("lastOrder", JSON.stringify(data.order));
        router.push(`/checkout?orderId=${data.order.id}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const categories: ("主食" | "饮品" | "小料")[] = ["主食", "饮品", "小料"];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      {/* 出摊预告 —— 防跑空 */}
      <header className="night-panel px-5 pb-6 pt-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs tracking-widest text-paper/60">烟火有数 · 张姐煎饼摊</p>
            <h1 className="mt-1 text-2xl font-bold">今天出摊 🌙</h1>
          </div>
          <span className="chalk-tag border-scallion-light text-scallion-light">营业中</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-paper/85">
          {stall?.note ?? "05:40 出摊 · 卖完即止"}
          <br />
          <span className="text-paper/60">明天是否出摊，关注本摊即可收到预告</span>
        </p>
      </header>

      <div className="flex-1 px-4 pb-28 pt-4">
        {categories.map((cat) => {
          const items = menu.filter((m) => m.category === cat);
          if (items.length === 0) return null;
          return (
            <section key={cat} className="mb-5">
              <h2 className="mb-2 text-sm font-bold text-ink-soft">{cat}</h2>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="card-paper p-3">
                    <button
                      className="flex w-full items-center gap-3 text-left"
                      onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                    >
                      <span className="text-3xl">{item.emoji}</span>
                      <span className="flex-1">
                        <span className="block font-semibold">{item.name}</span>
                        <span className="block text-xs text-ink-soft">{item.description}</span>
                      </span>
                      <span className="font-bold text-lantern-deep">¥{item.price}</span>
                    </button>
                    {expanded === item.id && (
                      <div className="mt-3 border-t border-wood/20 pt-3">
                        {item.options.length > 0 && (
                          <OptionPicker item={item} onAdd={(oids) => addToCart(item, oids)} />
                        )}
                        {item.options.length === 0 && (
                          <button className="btn-lantern w-full" onClick={() => addToCart(item, [])}>
                            加一份
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* 购物车栏 */}
      {cartCount > 0 && (
        <button
          onClick={() => setSheetOpen(true)}
          className="btn-lantern fixed bottom-16 left-1/2 z-40 flex w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2 items-center justify-between"
        >
          <span>🧺 {cartCount} 份</span>
          <span>¥{cartTotal} · 去下单</span>
        </button>
      )}

      {/* 下单面板 */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-night/50" onClick={() => setSheetOpen(false)}>
          <div
            className="max-h-[80dvh] mx-auto w-full max-w-md overflow-y-auto rounded-t-2xl bg-paper p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-lg font-bold">确认一下 📝</h3>
            <div className="space-y-2">
              {cart.map((l) => {
                const mi = menu.find((m) => m.id === l.menuItemId)!;
                return (
                  <div key={keyOf(l)} className="flex items-center gap-2">
                    <span className="flex-1 text-sm">
                      {mi.name}
                      {l.optionIds.length > 0 && (
                        <span className="text-ink-soft">
                          {" "}
                          · {l.optionIds.map((oid) => mi.options.find((o) => o.id === oid)?.name).join(" / ")}
                        </span>
                      )}
                    </span>
                    <button className="h-8 w-8 rounded-full bg-cream font-bold" onClick={() => setQty(l, -1)}>
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{l.qty}</span>
                    <button className="h-8 w-8 rounded-full bg-cream font-bold" onClick={() => setQty(l, 1)}>
                      ＋
                    </button>
                  </div>
                );
              })}
            </div>

            <label className="mt-4 block text-sm font-semibold">自提时段</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {PICKUP_SLOTS.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setPickupSlot(slot)}
                  className={`rounded-lg border px-1 py-2 text-xs ${
                    pickupSlot === slot ? "border-lantern bg-lantern/15 font-semibold" : "border-wood/30"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <input
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                placeholder="怎么称呼您（可留空）"
                className="w-1/2 rounded-lg border border-wood/30 bg-cream px-3 py-2 text-sm"
              />
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="备注：趁热 / 多酱…"
                className="w-1/2 rounded-lg border border-wood/30 bg-cream px-3 py-2 text-sm"
              />
            </div>

            <button className="btn-lantern mt-5 w-full" disabled={submitting} onClick={submit}>
              {submitting ? "下单中…" : `选好了，去收银台 · ¥${cartTotal}`}
            </button>
          </div>
        </div>
      )}

      <Nav active="customer" />
    </main>
  );
}

function OptionPicker({ item, onAdd }: { item: MenuItem; onAdd: (optionIds: string[]) => void }) {
  const [sel, setSel] = useState<string[]>([]);
  const toggle = (id: string) =>
    setSel((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const extra = sel.reduce((a, id) => a + (item.options.find((o) => o.id === id)?.priceDelta ?? 0), 0);
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {item.options.map((o) => (
          <button
            key={o.id}
            onClick={() => toggle(o.id)}
            className={`min-h-[32px] rounded-full border px-3 py-1.5 text-xs ${
              sel.includes(o.id) ? "border-lantern bg-lantern/15 font-semibold" : "border-wood/30"
            }`}
          >
            {o.name}
            {o.priceDelta > 0 && <span className="text-ink-soft"> +¥{o.priceDelta}</span>}
          </button>
        ))}
      </div>
      <button className="btn-lantern mt-3 w-full" onClick={() => onAdd(sel)}>
        加入购物车 · ¥{item.price + extra}
      </button>
    </div>
  );
}
