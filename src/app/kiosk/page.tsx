"use client";

// iPad 招揽看板（替代易拉宝）：全屏轮播 + 实时演示数据 + 体验二维码
// 用法：iPad Safari 打开 /kiosk → 分享 → 添加到主屏幕 → 全屏展示
// 提示：设置 > 显示与亮度 > 自动锁定 > 永不（防熄屏）

import { useEffect, useState } from "react";

interface BoardSummary {
  errorEarlyPct: number;
  errorRecentPct: number;
  wasteSavedPct: number;
}

const FEATURES = [
  {
    emoji: "📓",
    title: "AI 替阿姨记熟客",
    line1: "张叔 · 双蛋 不要香菜",
    line2: "通常 07:20 来，他那份先留着",
  },
  {
    emoji: "🌅",
    title: "明早备多少，睡前就知道",
    line1: "「明天降温又开学，备 132 份」",
    line2: "薄脆不过夜，浪费少一半",
  },
  {
    emoji: "📣",
    title: "今天出不出摊，提前知道",
    line1: "顾客不再跑空",
    line2: "收摊了？对手机说一声就记完账",
  },
];

export default function KioskPage() {
  const [fi, setFi] = useState(0);
  const [summary, setSummary] = useState<BoardSummary | null>(null);
  const [stallNote, setStallNote] = useState("05:40 出摊 · 卖完即止");
  const [qrOk, setQrOk] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setFi((f) => (f + 1) % FEATURES.length), 4500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const load = () =>
      fetch("/api/board")
        .then((r) => r.json())
        .then((d) => setSummary(d.summary))
        .catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch("/api/menu")
      .then((r) => r.json())
      .then((d) => d.stall?.note && setStallNote(d.stall.note))
      .catch(() => {});
  }, []);

  return (
    <main className="night-panel fixed inset-0 flex flex-col overflow-hidden">
      {/* 顶部品牌条 */}
      <header className="flex items-center justify-between px-[4vw] pt-[3.5vh]">
        <div className="flex items-center gap-[1.2vw]">
          <span className="text-[4vw]">🥞</span>
          <h1 className="text-[3.2vw] font-black tracking-wide">烟火有数</h1>
          <span className="chalk-tag hidden text-[1vw] text-paper/60 sm:inline">张姐煎饼摊的 AI 经营副驾</span>
        </div>
        <p className="text-[1.15vw] text-paper/60">软件应用赛道 · 滴水穿石</p>
      </header>

      {/* 主体：左文案 右轮播 */}
      <section className="flex flex-1 items-center gap-[4vw] px-[4vw]">
        <div className="flex-1">
          <p className="text-[1.6vw] leading-relaxed text-lantern">不抢阿姨的锅铲</p>
          <h2 className="text-[3.9vw] font-black leading-[1.2]">
            只补她的
            <span className="whitespace-nowrap text-lantern">记性 · 算盘 · 喇叭</span>
          </h2>
          <p className="mt-[2.5vh] max-w-[38vw] text-[1.35vw] leading-relaxed text-paper/75">
            一个煎饼摊自己的数据，第一次为摊主工作——
            AI 备货预测、熟客口味档案、出摊预告，
            让个体小摊也能「心里有数」。
          </p>

          {/* 实时飞轮数字 */}
          {summary && (
            <div className="mt-[3.5vh] flex gap-[2.5vw]">
              <div>
                <p className="text-[2.6vw] font-black text-scallion">±{summary.errorRecentPct}%</p>
                <p className="text-[1vw] text-paper/60">预测误差（14天收敛）</p>
              </div>
              <div>
                <p className="text-[2.6vw] font-black text-scallion">-{summary.wasteSavedPct}%</p>
                <p className="text-[1vw] text-paper/60">食材浪费</p>
              </div>
              <div>
                <p className="text-[2.6vw] font-black text-scallion">3 端</p>
                <p className="text-[1vw] text-paper/60">顾客 · 阿姨 · 数据飞轮</p>
              </div>
            </div>
          )}
          <p className="mt-[2vh] text-[1.1vw] text-paper/50">今天 · {stallNote}</p>
        </div>

        {/* 右侧轮播卡 */}
        <div className="w-[34vw]">
          <div className="card-paper !border-none bg-night-soft/80 p-[2.5vw] backdrop-blur transition-all">
            <div className="flex min-h-[10vw] flex-col justify-center">
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  className={`transition-opacity duration-700 ${i === fi ? "opacity-100" : "hidden opacity-0"}`}
                >
                  <p className="text-[2.2vw]">{f.emoji}</p>
                  <p className="mt-[1vh] text-[1.9vw] font-bold">{f.title}</p>
                  <p className="mt-[0.8vh] text-[1.3vw] text-lantern">{f.line1}</p>
                  <p className="text-[1.1vw] text-paper/60">{f.line2}</p>
                </div>
              ))}
            </div>
            {/* 轮播进度点 */}
            <div className="mt-[2vh] flex gap-[0.6vw]">
              {FEATURES.map((_, i) => (
                <span
                  key={i}
                  className={`h-[0.5vw] rounded-full transition-all ${i === fi ? "w-[2.4vw] bg-lantern" : "w-[0.9vw] bg-paper/25"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 底部二维码条 */}
      <footer className="flex items-center justify-between px-[4vw] pb-[3.5vh]">
        <p className="text-[1.25vw] text-paper/70">
          📱 拿起手机扫一扫，<span className="font-bold text-lantern">当一回熟客</span>
          <span className="ml-[1vw] text-paper/40">（演示环境 · 不产生真实扣款）</span>
        </p>
        <div className="rounded-2xl bg-paper p-[0.8vw]">
          {qrOk ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/api/qr"
              alt="扫码体验"
              className="h-[10vw] w-[10vw] object-contain"
              onError={() => setQrOk(false)}
            />
          ) : (
            <div className="flex h-[10vw] w-[10vw] items-center justify-center text-center text-[0.9vw] text-ink-soft">
              体验二维码
              <br />
              请刷新页面
            </div>
          )}
        </div>
      </footer>
    </main>
  );
}
