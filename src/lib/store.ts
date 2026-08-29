// 内存态运行时 —— 黑客松专用：零基础设施，演示可一键重置
// 真实落地时此层替换为数据库（yshop-drink 的 MySQL / 或云开发集合）

import { generateHistory, fmt, MENU, REGULARS, WEEKDAY_BASE, forecastUnits } from "./seed";
import type { CustomerProfile, DailyStat, MorningBrief, Order } from "./types";

interface RuntimeState {
  simDate: Date; // 模拟时钟（支持"时间快进"）
  stats: DailyStat[]; // 历史每日统计
  orders: Order[]; // 今日订单
  customers: CustomerProfile[];
  ledgers: { time: string; text: string; result: string; source: string }[]; // 语音记账流水
  openToday: boolean; // 出摊预告：今天是否出摊
  openNote: string;
  totalOrders: number;
}

// globalThis 防止 dev 热重载丢状态
const g = globalThis as unknown as { __jbStore?: RuntimeState };

function init(): RuntimeState {
  const today = new Date();
  const stats = generateHistory(today, 14);
  return {
    simDate: today,
    stats,
    orders: [],
    customers: REGULARS.map((r) => ({
      ...r,
      lastVisitDate: fmt(new Date(today.getTime() - 86400e3 * 2)),
    })),
    ledgers: [],
    openToday: true,
    openNote: "05:40 出摊 · 07:30 前后是高峰 · 卖完即止",
    totalOrders: 0,
  };
}

export function store(): RuntimeState {
  if (!g.__jbStore) g.__jbStore = init();
  return g.__jbStore;
}

export function resetStore() {
  g.__jbStore = init();
}

// ---------- 晨报：明日备货建议 ----------
export function morningBrief(): MorningBrief {
  const s = store();
  const tomorrow = new Date(s.simDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const base = WEEKDAY_BASE[tomorrow.getDay()];
  // 演示：明日天气取"预报"（用确定性序列）
  const predicted = forecastUnits(base, { condition: "降温", lowC: 16, highC: 23 }, "下周二开学，学生客回流");
  const recent14 = s.stats.slice(-14);
  const recentErr =
    recent14.slice(-5).reduce((a, d) => a + Math.abs(d.actualUnits - d.predictedUnits) / d.predictedUnits, 0) / 5;
  const confidencePct = Math.max(70, Math.round((1 - recentErr) * 100));
  const wdNames = ["日", "一", "二", "三", "四", "五", "六"];
  return {
    date: fmt(tomorrow),
    predictedUnits: predicted,
    confidencePct,
    perItem: [
      { menuItemId: "jb-original", name: "原味煎饼果子", prepUnits: Math.round(predicted * 0.55) },
      { menuItemId: "jb-full", name: "全套煎饼果子", prepUnits: Math.round(predicted * 0.3) },
      { menuItemId: "soy-sweet", name: "甜豆浆", prepUnits: Math.round(predicted * 0.5) },
      { menuItemId: "soy-salty", name: "咸豆浆", prepUnits: Math.round(predicted * 0.15) },
      { menuItemId: "soy-large", name: "现磨豆浆（大杯）", prepUnits: Math.round(predicted * 0.25) },
    ],
    reasons: [
      `明天（周${wdNames[tomorrow.getDay()]}）· 开学季学生客回流，历史同期约 +15%`,
      "预报降温 16-23°C，热豆浆销量历史提升约 12%",
      "近 5 天预测平均误差已收敛到 ±8% 以内",
    ],
  };
}

// ---------- 熟客：今天该等谁 ----------
export function todaysRegulars() {
  const s = store();
  const wd = s.simDate.getDay();
  return s.customers
    .filter((c) => c.visitWeekdays.includes(wd))
    .sort((a, b) => a.preferredTime.localeCompare(b.preferredTime));
}

// ---------- 时间快进：模拟过一天 ----------
export function advanceDay() {
  const s = store();
  s.simDate = new Date(s.simDate.getTime() + 86400e3);
  const d = s.simDate;
  const weather = d.getDate() % 3 === 0 ? { condition: "小雨" as const, lowC: 20, highC: 25 } : { condition: "晴" as const, lowC: 22, highC: 31 };
  const base = WEEKDAY_BASE[d.getDay()];
  const predicted = forecastUnits(base, weather);
  const actual = Math.round(predicted * (1 + (Math.random() * 0.1 - 0.05)));
  s.stats.push({
    date: fmt(d),
    weekday: d.getDay(),
    weather,
    predictedUnits: predicted,
    actualUnits: actual,
    revenue: Math.round(actual * 8.4 + Math.random() * 50),
    wasteUnits: Math.round(Math.abs(predicted - actual) * 0.45),
    itemBreakdown: {
      "jb-original": Math.round(actual * 0.55),
      "jb-full": Math.round(actual * 0.3),
      "soy-sweet": Math.round(actual * 0.5),
      "soy-salty": Math.round(actual * 0.15),
      "soy-large": Math.round(actual * 0.25),
    },
  });
  s.orders = []; // 新的一天
}

export { MENU };
