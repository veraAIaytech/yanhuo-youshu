"use client";

// 8 分钟路演幻灯片：自动滑动（默认），支持 ←/→、空格暂停、触屏左右滑
// 用法：iPad/电脑打开 /deck，F 全屏（或 Safari 分享→添加到主屏幕）
// URL 参数：/deck?auto=0 关闭自动播放；?d=45 调整每页秒数

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface Slide {
  kicker: string;
  title: string;
  body?: React.ReactNode;
  seconds: number;
  dark?: boolean; // 深色页（章节感）
}

const D = {
  card: "card-paper p-[2.2vw]",
  h3: "text-[1.7vw] font-bold",
  p: "text-[1.25vw] leading-relaxed text-ink-soft",
};

const buildSlides = (s: { wasteEarly: number; wasteRecent: number; errorEarlyPct: number; errorRecentPct: number } | null): Slide[] => [
  {
    kicker: "软件应用赛道 · 滴水穿石",
    title: "烟火有数",
    seconds: 28,
    dark: true,
    body: (
      <p className="mt-[3vh] text-[2vw] text-paper/85">
        不抢阿姨的锅铲，只补她的<span className="font-bold text-lantern">记性、算盘和喇叭</span>
        <span className="mt-[2vh] block text-[1.1vw] text-paper/50">煎饼摊个体户的 AI 经营副驾</span>
      </p>
    ),
  },
  {
    kicker: "问题洞察 · 20%",
    title: "凌晨四点半，阿姨的三道难题",
    seconds: 45,
    body: (
      <div className="mt-[3vh] grid grid-cols-3 gap-[1.6vw]">
        <div className={D.card}>
          <p className="text-[2.2vw]">🥞</p>
          <p className={`${D.h3} mt-[1vh]`}>备货靠猜</p>
          <p className={`${D.p} mt-[1vh]`}>薄脆放到中午就不脆。备多必浪费，备少必缺货——都是真金白银</p>
        </div>
        <div className={D.card}>
          <p className="text-[2.2vw]">📓</p>
          <p className={`${D.h3} mt-[1vh]`}>熟客靠脑记</p>
          <p className={`${D.p} mt-[1vh]`}>「双蛋不要香菜」记得住三五个，记不住三十个——而熟客就是小摊的全部</p>
        </div>
        <div className={D.card}>
          <p className="text-[2.2vw]">📣</p>
          <p className={`${D.h3} mt-[1vh]`}>顾客跑空</p>
          <p className={`${D.p} mt-[1vh]`}>阿姨家里有事没出摊，老顾客白跑一趟。她欠的不是一天生意，是人情</p>
        </div>
      </div>
    ),
  },
  {
    kicker: "为什么现有方案不管用",
    title: "点餐软件很多，但没有一个是为「她」做的",
    seconds: 38,
    body: (
      <div className="mt-[3vh] space-y-[1.6vh]">
        <p className={`${D.p} text-[1.4vw]`}>
          美团 / 连锁 SaaS 服务的是连锁企业：多门店、对账、营销裂变——个体户要的不是管理软件，是<strong className="text-ink">一个懂她这个摊的助手</strong>
        </p>
        <p className={`${D.p} text-[1.4vw]`}>
          连锁有数据团队做预测；<strong className="text-ink">个体户没有数据团队</strong>——所以我们让 AI 直接当她的数据团队，数据来自她自己的摊
        </p>
        <p className={`${D.p} text-[1.4vw]`}>
          而她最缺的是<strong className="text-ink">录数据的时间</strong>——所以收摊时对手机说一句话就行（AI 原生的冷启动）
        </p>
      </div>
    ),
  },
  {
    kicker: "产品",
    title: "一摊三端，开箱即用",
    seconds: 40,
    body: (
      <div className="mt-[3vh] grid grid-cols-3 gap-[1.6vw]">
        <div className={D.card}>
          <p className="text-[2vw]">🧑‍🤝‍🧑 顾客端</p>
          <p className={`${D.p} mt-[1vh]`}>扫码点餐 · 多规格 · 自提时段 · 出摊预告防跑空</p>
        </div>
        <div className={D.card}>
          <p className="text-[2vw]">🪔 阿姨端</p>
          <p className={`${D.p} mt-[1vh]`}>晨报备货建议 · 熟客时间表 · 收摊语音记账</p>
        </div>
        <div className={D.card}>
          <p className="text-[2vw]">📈 数据飞轮</p>
          <p className={`${D.p} mt-[1vh]`}>预测 vs 实际 · 误差收敛 · 浪费可视化</p>
        </div>
        <p className="col-span-3 text-center text-[1vw] text-ink-soft">（此处路演时切到真机演示：localhost:3000 或线上链接）</p>
      </div>
    ),
  },
  {
    kicker: "创新点一 · 记性",
    title: "熟客档案：AI 替她记住每一个人",
    seconds: 40,
    body: (
      <div className="mt-[3vh] grid grid-cols-2 gap-[1.6vw]">
        <div className={D.card}>
          <p className="text-[1.1vw] text-ink-soft">07:20 · 通常</p>
          <p className="text-[1.8vw] font-bold">熟客 · 张叔</p>
          <p className="mt-[1vh] text-[1.3vw] text-lantern-deep">双蛋煎饼 · 不要香菜 · 咸豆浆</p>
          <p className={`${D.p} mt-[1vh]`}>工地早班，风雨无阻；香菜过敏，双蛋是老规矩</p>
        </div>
        <div className={D.card}>
          <p className={`${D.h3}`}>为什么这算创新</p>
          <p className={`${D.p} mt-[1vh]`}>《深夜食堂》最动人的是老板记得每个熟客的口味——我们把这份记性交给 AI，<strong className="text-ink">只服务这一个摊，数据匿名、不出摊</strong></p>
        </div>
      </div>
    ),
  },
  {
    kicker: "创新点二 · 算盘",
    title: "备货预测：让她自己的流水为她工作",
    seconds: 45,
    body: (
      <div className="mt-[3vh] grid grid-cols-3 gap-[1.6vw]">
        <div className={`${D.card} col-span-2`}>
          <p className={D.h3}>数据飞轮（近 14 天）</p>
          <p className={`${D.p} mt-[1vh]`}>
            预测误差 ±{s?.errorEarlyPct ?? 30}% → <strong className="text-scallion text-[1.6vw]">±{s?.errorRecentPct ?? 8}%</strong>（融合天气 + 开学日历后）
          </p>
          <p className={`${D.p}`}>
            每天浪费约 {s?.wasteEarly ?? "—"} 份 → <strong className="text-scallion text-[1.6vw]">{s ? `${s.wasteRecent} 份` : "减半"}</strong>，一个月省出上百份食材钱
          </p>
          <p className={`${D.p} mt-[1vh]`}>「明天降温又开学，备 132 份」——每个数字都带着理由，阿姨看得懂</p>
        </div>
        <div className={D.card}>
          <p className={D.h3}>冷启动的答案</p>
          <p className={`${D.p} mt-[1vh]`}>收摊时对手机说：<br />「今天卖了八十个，豆浆剩半桶」</p>
          <p className={`${D.p} mt-[1vh]`}>GLM 解析成结构化数据入库——<strong className="text-ink">不新增任何录入负担</strong>，飞轮才转得起来</p>
        </div>
      </div>
    ),
  },
  {
    kicker: "创新点三 · 喇叭",
    title: "出摊预告：AI 帮她把人情传出去",
    seconds: 38,
    body: (
      <div className="mt-[3vh] space-y-[1.6vh] text-[1.35vw]">
        <p className={D.p}>📣 今天出不出摊、几点出摊，订阅即可收到预告——<strong className="text-ink">顾客不再跑空</strong></p>
        <p className={D.p}>🧮 AI 根据预测建议出摊时间：「明天早高峰 7:10 开始，建议 6:45 出摊」</p>
        <p className={D.p}>🌙 预测到单量低的休息日，AI 建议休息——<strong className="text-ink">AI 帮个体户拿到了双休日</strong></p>
      </div>
    ),
  },
  {
    kicker: "技术与实现 · 15%",
    title: "AI 原生，且工程上靠得住",
    seconds: 42,
    body: (
      <div className="mt-[3vh] grid grid-cols-2 gap-[1.6vw]">
        <div className={D.card}>
          <p className={D.h3}>AI 原生</p>
          <p className={`${D.p} mt-[1vh]`}>GLM 语音记账解析（自然语言→结构化）· 晨报理由生成 · 全链路确定性兜底，演示永不掉线</p>
        </div>
        <div className={D.card}>
          <p className={D.h3}>工程可靠性</p>
          <p className={`${D.p} mt-[1vh]`}>支付适配层（Mock→官方只换插件）· 服务端算价 · 幂等防重复提交 · 熟客匿名昵称，数据安全</p>
        </div>
        <p className="col-span-2 text-[1vw] text-ink-soft">Next.js + Tailwind + TypeScript · 合成数据可重放，模型可替换（统计模型→Prophet/GBDT）</p>
      </div>
    ),
  },
  {
    kicker: "后续发展潜力 · 20%",
    title: "赛后第 1 天就能用，第 1 个月就能收款",
    seconds: 45,
    body: (
      <div className="mt-[3vh] space-y-[1.4vh]">
        <div className={`${D.card} flex items-center gap-[1.5vw]`}>
          <p className="text-[1.6vw] font-black text-lantern-deep">阶段 0</p>
          <p className={D.p}>摊位放官方双码收款（≈0 费率），小程序只做预告/预定/预测——<strong className="text-ink">不办资质也马上能用</strong></p>
        </div>
        <div className={`${D.card} flex items-center gap-[1.5vw]`}>
          <p className="text-[1.6vw] font-black text-lantern-deep">阶段 1</p>
          <p className={D.p}>办个体工商户 → 官方商家收款码 → H5 按环境展示对应码 +「我已付款」核销</p>
        </div>
        <div className={`${D.card} flex items-center gap-[1.5vw]`}>
          <p className="text-[1.6vw] font-black text-lantern-deep">阶段 2</p>
          <p className={D.p}>微信支付商户号 + 支付宝当面付，适配层换实现即可；底座 fork 开源 yshop-drink（MIT）</p>
        </div>
      </div>
    ),
  },
  {
    kicker: "商业潜力",
    title: "从一个煎饼摊，到一条街的烟火",
    seconds: 36,
    body: (
      <div className="mt-[3vh] grid grid-cols-3 gap-[1.6vw]">
        <div className={D.card}>
          <p className={D.h3}>可复制</p>
          <p className={`${D.p} mt-[1vh]`}>早餐车、水果摊、夜宵摊——同一个飞轮，换一份菜单</p>
        </div>
        <div className={D.card}>
          <p className={D.h3}>可收费</p>
          <p className={`${D.p} mt-[1vh]`}>单摊年费制（一顿早餐钱/月），比任何 SaaS 都便宜</p>
        </div>
        <div className={D.card}>
          <p className={D.h3}>可生长</p>
          <p className={`${D.p} mt-[1vh]`}>多摊数据互助网络（同商圈客流互相校准），是下一步</p>
        </div>
      </div>
    ),
  },
  {
    kicker: "开发过程",
    title: "人出题，AI 施工，34 小时",
    seconds: 35,
    body: (
      <div className="mt-[3vh] space-y-[1.6vh] text-[1.3vw]">
        <p className={D.p}>🧑‍🍳 人类：定义问题、验收体验、把关「烟火气」——<strong className="text-ink">AI Agent 结对开发</strong></p>
        <p className={D.p}>🤖 AI：架构选型、全栈编码、合成数据、部署流水线</p>
        <p className={D.p}>📌 这正是赛道鼓励的「Agent 协同新范式」的一次实践</p>
      </div>
    ),
  },
  {
    kicker: "烟火有数",
    title: "让每个小摊，被自己的数据照顾",
    seconds: 32,
    dark: true,
    body: (
      <div className="mt-[4vh] flex items-center justify-center gap-[3vw]">
        <div className="rounded-2xl bg-paper p-[1vw]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/api/qr" alt="扫码体验" className="h-[11vw] w-[11vw] object-contain" />
        </div>
        <p className="text-[1.3vw] leading-relaxed text-paper/75">
          扫码，当一回熟客 🥢
          <span className="mt-[1vh] block text-[1vw] text-paper/45">GitHub：topic #shenicest-fission</span>
        </p>
      </div>
    ),
  },
];

export default function DeckPage() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [auto, setAuto] = useState(true);
  const [rate, setRate] = useState(40);
  const [summary, setSummary] = useState<{ wasteEarly: number; wasteRecent: number; errorEarlyPct: number; errorRecentPct: number } | null>(null);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    fetch("/api/board")
      .then((r) => r.json())
      .then((d) => setSummary(d.summary))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("auto") === "0") {
      setAuto(false);
      setPaused(true);
    }
    const d = parseInt(sp.get("d") ?? "", 10);
    if (!Number.isNaN(d) && d >= 5 && d <= 120) setRate(d);
  }, []);

  const slides = useMemo(() => buildSlides(summary), [summary]);

  const next = useCallback(() => setIdx((i) => Math.min(i + 1, slides.length - 1)), [slides.length]);
  const prev = useCallback(() => setIdx((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") next();
      else if (e.key === "ArrowLeft" || e.key === "PageUp") prev();
      else if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      } else if (e.key.toLowerCase() === "f") {
        document.documentElement.requestFullscreen?.().catch(() => {});
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  useEffect(() => {
    if (!auto || paused) return;
    const duration = (slides[idx].seconds * 1000 * rate) / 40; // rate=40 时按原始时长
    const t = setTimeout(next, duration);
    return () => clearTimeout(t);
  }, [idx, paused, auto, rate, next, slides]);

  const slide = slides[idx];
  const progress = ((idx + 1) / slides.length) * 100;

  return (
    <main
      className="fixed inset-0 flex flex-col overflow-hidden"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (dx < -50) next();
        else if (dx > 50) prev();
        touchX.current = null;
      }}
    >
      <div className={`flex flex-1 flex-col justify-center px-[6vw] ${slide.dark ? "night-panel" : "bg-paper"}`}>
        <p className={`text-[1.1vw] font-semibold tracking-widest ${slide.dark ? "text-lantern" : "text-lantern-deep"}`}>
          {slide.kicker}
        </p>
        <h1 className={`mt-[2vh] text-[3.4vw] font-black leading-tight ${slide.dark ? "" : "text-ink"}`}>
          {slide.title}
        </h1>
        {slide.body && <div className="mt-[1vh]">{slide.body}</div>}
      </div>

      {/* 底部控制条 */}
      <footer className={`flex items-center gap-[1vw] px-[3vw] py-[1.6vh] ${slide.dark ? "bg-night-soft" : "bg-cream"}`}>
        <div className="h-[0.5vw] flex-1 overflow-hidden rounded-full bg-wood/20">
          <div className="h-full rounded-full bg-lantern transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <span className={`text-[0.95vw] ${slide.dark ? "text-paper/60" : "text-ink-soft"}`}>
          {idx + 1} / {slides.length}
        </span>
        <button
          className={`rounded-full px-[1.2vw] py-[0.5vh] text-[0.95vw] font-semibold ${slide.dark ? "bg-paper/15 text-paper" : "bg-wood/15 text-ink"}`}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? "▶ 播放" : "⏸ 暂停"}
        </button>
        <button
          className={`rounded-full px-[1.2vw] py-[0.5vh] text-[0.95vw] font-semibold ${slide.dark ? "bg-paper/15 text-paper" : "bg-wood/15 text-ink"}`}
          onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})}
        >
          ⛶ 全屏
        </button>
      </footer>
    </main>
  );
}
