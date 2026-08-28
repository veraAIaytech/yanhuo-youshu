"use client";

// 阿姨端：晨报（明日备货）+ 熟客时间表 + 今日订单 + 收摊语音记账
import { useCallback, useEffect, useRef, useState } from "react";
import Nav from "@/components/Nav";
import type { CustomerProfile, Order } from "@/lib/types";

interface Brief {
  date: string;
  predictedUnits: number;
  confidencePct: number;
  perItem: { menuItemId: string; name: string; prepUnits: number }[];
  reasons: string[];
}

interface AyiData {
  brief: Brief;
  regulars: CustomerProfile[];
  orders: Order[];
  ledgers: { time: string; text: string; result: string; source: string }[];
  stall: { openToday: boolean; note: string };
}

// Web Speech API 最小类型（TS 无内置）
interface SpeechRecognitionLike {
  lang: string;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  start(): void;
}

export default function AyiPage() {
  const [data, setData] = useState<AyiData | null>(null);
  const [listening, setListening] = useState(false);
  const [ledgerText, setLedgerText] = useState("");
  const [ledgerBusy, setLedgerBusy] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  const load = useCallback(
    () =>
      fetch("/api/ayi")
        .then((r) => r.json())
        .then(setData),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const sendLedger = async (text: string) => {
    if (!text.trim() || ledgerBusy) return;
    setLedgerBusy(true);
    try {
      await fetch("/api/ayi/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      setLedgerText("");
      await load();
    } finally {
      setLedgerBusy(false);
    }
  };

  const startVoice = () => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) {
      setLedgerText("（这台设备不支持语音，直接打字也行）");
      return;
    }
    const rec = new SR();
    rec.lang = "zh-CN";
    rec.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setLedgerText(t);
      setListening(false);
      void sendLedger(t);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  const advance = async (orderId: string, status: Order["status"]) => {
    await fetch("/api/ayi/order-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
    load();
  };

  if (!data) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md items-center justify-center">
        <p className="text-paper/60">炉子生着呢…</p>
      </main>
    );
  }

  const { brief, regulars, orders, ledgers } = data;
  const wd = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      {/* 晨报 */}
      <header className="night-panel px-5 pb-6 pt-8">
        <p className="text-xs tracking-widest text-paper/60">烟火有数 · 阿姨端</p>
        <h1 className="mt-1 text-2xl font-bold">阿姨早，今天心里有数 ☕</h1>
        <div className="card-paper mt-4 border-none bg-night-soft/60 p-4 backdrop-blur">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-paper/60">明天（周{wd[new Date(brief.date).getDay()]}）预计卖出</p>
              <p className="text-4xl font-black text-lantern">
                {brief.predictedUnits}
                <span className="text-base font-semibold"> 份</span>
              </p>
            </div>
            <span className="chalk-tag border-scallion-light text-scallion-light">
              近5天误差 ±{Math.max(0, 100 - brief.confidencePct)}%
            </span>
          </div>
          <ul className="mt-3 space-y-1 text-sm text-paper/90">
            {brief.perItem.map((p) => (
              <li key={p.menuItemId} className="flex justify-between">
                <span>{p.name}</span>
                <span className="font-semibold">备 {p.prepUnits}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1.5 border-t border-paper/15 pt-3">
            {brief.reasons.map((r, i) => (
              <p key={i} className="text-xs leading-5 text-paper/70">
                🪔 {r}
              </p>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-5 px-4 pb-6 pt-5">
        {/* 熟客时间表 */}
        <section>
          <h2 className="mb-2 text-sm font-bold text-ink-soft">今天该等谁 · 熟客时间表</h2>
          <div className="space-y-2">
            {regulars.map((c) => {
              const came = orders.some((o) => o.customerNick === c.nick);
              return (
                <div key={c.id} className={`card-paper flex gap-3 p-3 ${came ? "opacity-50" : ""}`}>
                  <div className="w-12 text-center">
                    <p className="text-sm font-black text-lantern-deep">{c.preferredTime}</p>
                    <p className="text-[10px] text-ink-soft">通常</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      {c.nick}
                      {came && <span className="ml-2 text-xs text-scallion">✓ 已来过</span>}
                    </p>
                    <p className="text-xs text-ink">{c.favorite}</p>
                    <p className="mt-0.5 text-[11px] leading-4 text-ink-soft">{c.notes}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 今日订单 */}
        <section>
          <h2 className="mb-2 text-sm font-bold text-ink-soft">线上订单（{orders.length}）</h2>
          {orders.length === 0 ? (
            <div className="card-paper p-4 text-sm text-ink-soft">
              还没有线上订单 —— 摊位照常营业，来了就记
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((o) => (
                <div key={o.id} className="card-paper p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">
                      取餐 {o.id.slice(0, 4).toUpperCase()} · {o.customerNick}
                    </p>
                    <p className="text-sm font-bold text-lantern-deep">¥{o.total}</p>
                  </div>
                  <p className="mt-1 text-xs text-ink-soft">
                    {o.pickupSlot}
                    {o.note ? ` · ${o.note}` : ""}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs">{o.status}</span>
                    {o.status === "已支付" && (
                      <button className="btn-lantern !px-3 !py-1 text-xs" onClick={() => advance(o.id, "制作中")}>
                        开始做
                      </button>
                    )}
                    {o.status === "制作中" && (
                      <button className="btn-lantern !px-3 !py-1 text-xs" onClick={() => advance(o.id, "已完成")}>
                        出餐完成
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 收摊记账 */}
        <section>
          <h2 className="mb-2 text-sm font-bold text-ink-soft">收摊了？跟手机说一声就行</h2>
          <div className="card-paper p-3">
            <div className="flex gap-2">
              <input
                value={ledgerText}
                onChange={(e) => setLedgerText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendLedger(ledgerText)}
                placeholder='比如："今天卖了八十个，豆浆剩半桶"'
                className="flex-1 rounded-lg border border-wood/30 bg-cream px-3 py-2 text-sm"
              />
              <button
                onClick={startVoice}
                className={`h-10 w-10 rounded-full text-lg ${listening ? "bg-tomato text-white" : "bg-lantern text-white"}`}
                title="按一下说话"
              >
                🎙
              </button>
            </div>
            <button
              className="btn-lantern mt-2 w-full text-sm"
              disabled={ledgerBusy || !ledgerText.trim()}
              onClick={() => sendLedger(ledgerText)}
            >
              {ledgerBusy ? "记着呢…" : "记到账本上"}
            </button>
            {ledgers.length > 0 && (
              <ul className="mt-3 space-y-2 border-t border-wood/20 pt-3">
                {ledgers.map((l, i) => (
                  <li key={i} className="text-xs">
                    <span className="text-ink-soft">{l.time}</span> · {l.result}
                    <span className="ml-1 rounded bg-scallion-light px-1 text-[10px] text-scallion">
                      {l.source === "glm" ? "AI解析" : "兜底解析"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
      <Nav active="ayi" />
    </main>
  );
}
