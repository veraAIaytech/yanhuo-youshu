"use client";

// 数据飞轮面板：预测 vs 实际曲线、误差收敛、浪费减少 —— 单摊数据的价值可视化
import { useCallback, useEffect, useState } from "react";
import Nav from "@/components/Nav";

interface Stat {
  date: string;
  predictedUnits: number;
  actualUnits: number;
  wasteUnits: number;
  errorPct: number;
  weather: { condition: string };
  event?: string;
}

interface BoardData {
  stats: Stat[];
  simDate: string;
  summary: {
    errorEarlyPct: number;
    errorRecentPct: number;
    wasteEarly: number;
    wasteRecent: number;
    wasteSavedPct: number;
  };
}

export default function BoardPage() {
  const [data, setData] = useState<BoardData | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    () =>
      fetch("/api/board")
        .then((r) => r.json())
        .then(setData),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const sim = async (action: "advance" | "reset") => {
    setBusy(true);
    try {
      await fetch("/api/sim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (!data) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md items-center justify-center">
        <p className="text-ink-soft">正在翻账本…</p>
      </main>
    );
  }

  const { stats, summary } = data;

  // ---- SVG 折线（预测 vs 实际） ----
  const W = 340;
  const H = 170;
  const PAD_L = 28;
  const PAD_B = 22;
  const maxV = Math.max(...stats.map((s) => Math.max(s.predictedUnits, s.actualUnits))) * 1.1;
  const x = (i: number) => PAD_L + (i * (W - PAD_L - 8)) / Math.max(1, stats.length - 1);
  const y = (v: number) => H - PAD_B - (v / maxV) * (H - PAD_B - 10);
  const path = (key: "predictedUnits" | "actualUnits") =>
    stats.map((s, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(s[key]).toFixed(1)}`).join(" ");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="night-panel px-5 pb-6 pt-8">
        <p className="text-xs tracking-widest text-paper/60">烟火有数 · 数据飞轮</p>
        <h1 className="mt-1 text-2xl font-bold">越用，越懂这个摊</h1>
        <p className="mt-2 text-sm text-paper/70">全部来自阿姨自己摊位的流水 —— 数据不出摊，价值先出摊</p>
      </header>

      <div className="flex-1 space-y-4 px-4 pb-6 pt-4">
        {/* 三个收敛指标 */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="card-paper p-3">
            <p className="text-[11px] text-ink-soft">预测误差</p>
            <p className="mt-1 text-lg font-black text-tomato">±{summary.errorEarlyPct}%</p>
            <p className="text-[11px] text-ink-soft">↓ 前5天</p>
            <p className="text-xl font-black text-scallion">±{summary.errorRecentPct}%</p>
            <p className="text-[11px] text-ink-soft">近5天</p>
          </div>
          <div className="card-paper p-3">
            <p className="text-[11px] text-ink-soft">平均每天浪费</p>
            <p className="mt-1 text-lg font-black text-tomato">{summary.wasteEarly} 份</p>
            <p className="text-[11px] text-ink-soft">↓ 前5天</p>
            <p className="text-xl font-black text-scallion">{summary.wasteRecent} 份</p>
            <p className="text-[11px] text-ink-soft">近5天</p>
          </div>
          <div className="card-paper p-3">
            <p className="text-[11px] text-ink-soft">浪费减少</p>
            <p className="mt-2 text-3xl font-black text-scallion">{summary.wasteSavedPct}%</p>
            <p className="mt-1 text-[11px] text-ink-soft">≈ 每月省 出 {summary.wasteEarly - summary.wasteRecent}×30 份食材</p>
          </div>
        </div>

        {/* 曲线图 */}
        <div className="card-paper p-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <p className="font-bold">预测 vs 实际（近 {stats.length} 天）</p>
            <p>
              <span className="mr-2 inline-block h-2 w-4 rounded bg-lantern" />
              预测
              <span className="ml-3 inline-block h-2 w-4 rounded bg-scallion" />
              实际
            </p>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            {[0.25, 0.5, 0.75].map((t) => (
              <line
                key={t}
                x1={PAD_L}
                x2={W - 8}
                y1={y(maxV * t)}
                y2={y(maxV * t)}
                stroke="#8b5e3c"
                strokeOpacity="0.15"
              />
            ))}
            <path d={path("predictedUnits")} fill="none" stroke="#e8a33d" strokeWidth="2.5" strokeLinecap="round" />
            <path d={path("actualUnits")} fill="none" stroke="#4a7c59" strokeWidth="2.5" strokeLinecap="round" />
            {/* 分界：第9天起"学会看天气" */}
            {stats.length > 9 && (
              <line x1={x(stats.length - 5)} x2={x(stats.length - 5)} y1="8" y2={H - PAD_B} stroke="#c4553b" strokeDasharray="4 3" strokeOpacity="0.6" />
            )}
            {stats.length > 9 && (
              <text x={x(stats.length - 5) + 4} y="16" fontSize="9" fill="#c4553b">
                开始融合天气/日历
              </text>
            )}
            {stats.map((s, i) =>
              i % 3 === 0 ? (
                <text key={i} x={x(i)} y={H - 6} fontSize="8" fill="#7a6a58" textAnchor="middle">
                  {s.date.slice(5)}
                </text>
              ) : null
            )}
          </svg>
        </div>

        {/* 模拟器 */}
        <div className="card-paper p-4">
          <p className="text-sm font-bold">演示模拟器 🎬</p>
          <p className="mt-1 text-xs leading-5 text-ink-soft">
            点「快进一天」，系统会像真实世界一样过一天：早上给预测、晚上记实际、误差进飞轮。
            路演时用它 2 分钟讲完 14 天的故事。
          </p>
          <div className="mt-3 flex gap-2">
            <button className="btn-lantern flex-1 text-sm" disabled={busy} onClick={() => sim("advance")}>
              {busy ? "…" : "⏩ 快进一天"}
            </button>
            <button
              className="flex-1 rounded-full border border-wood/40 py-2.5 text-sm font-semibold min-h-[44px]"
              disabled={busy}
              onClick={() => sim("reset")}
            >
              ↺ 重置演示数据
            </button>
          </div>
        </div>

        {/* 明细表（最近6天） */}
        <div className="card-paper p-4">
          <p className="mb-2 text-sm font-bold">账本明细</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-ink-soft">
                <th className="py-1">日期</th>
                <th>天气</th>
                <th className="text-right">预测</th>
                <th className="text-right">实际</th>
                <th className="text-right">浪费</th>
              </tr>
            </thead>
            <tbody>
              {stats.slice(-6).reverse().map((s) => (
                <tr key={s.date} className="border-t border-wood/15">
                  <td className="py-1.5">{s.date.slice(5)}</td>
                  <td>{s.weather.condition}</td>
                  <td className="text-right">{s.predictedUnits}</td>
                  <td className="text-right font-semibold">{s.actualUnits}</td>
                  <td className="text-right text-tomato">{s.wasteUnits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Nav active="board" />
    </main>
  );
}
