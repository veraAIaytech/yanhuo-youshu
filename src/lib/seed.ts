// 合成营业数据生成器 —— 确定性（同一种子同一结果），演示可重放
// 叙事设计：前 5 天预测"没学会看天气"误差大，之后收敛 —— 数据飞轮可视化

import type {
  CustomerProfile,
  DailyStat,
  MenuItem,
  WeatherInfo,
} from "./types";

// ---------- 确定性伪随机 ----------
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260830);

// ---------- 菜单（煎饼阿姨的摊子） ----------
export const MENU: MenuItem[] = [
  {
    id: "jb-original",
    name: "原味煎饼果子",
    emoji: "🥞",
    category: "主食",
    price: 6,
    description: "现摊绿豆面，薄脆自家炸，酱是阿姨秘方",
    options: [
      { id: "egg", name: "加蛋", priceDelta: 1.5 },
      { id: "sausage", name: "加肠", priceDelta: 2 },
      { id: "double-egg", name: "双蛋", priceDelta: 3 },
      { id: "no-cilantro", name: "不要香菜", priceDelta: 0 },
    ],
    active: true,
  },
  {
    id: "jb-full",
    name: "全套煎饼果子",
    emoji: "🌯",
    category: "主食",
    price: 9,
    description: "加蛋加肠加薄脆，干重活的一套",
    options: [
      { id: "double-egg", name: "双蛋", priceDelta: 3 },
      { id: "no-cilantro", name: "不要香菜", priceDelta: 0 },
    ],
    active: true,
  },
  {
    id: "soy-sweet",
    name: "甜豆浆",
    emoji: "🥛",
    category: "饮品",
    price: 2,
    description: "每天现磨，阿姨自己先喝一碗那种",
    options: [],
    active: true,
  },
  {
    id: "soy-salty",
    name: "咸豆浆",
    emoji: "🍵",
    category: "饮品",
    price: 2.5,
    description: "紫菜虾皮榨菜末，老派吃法",
    options: [],
    active: true,
  },
  {
    id: "soy-large",
    name: "现磨豆浆（大杯）",
    emoji: "🧋",
    category: "饮品",
    price: 4,
    description: "带去办公室，一天元气",
    options: [],
    active: true,
  },
];

// ---------- 常来的星期基础单量（学生+上班族，工作日高） ----------
const WEEKDAY_BASE = [55, 95, 100, 98, 105, 112, 70]; // 周日~周六；周五最高（周末补觉客也来）

function weatherOf(date: Date): WeatherInfo {
  // 简单确定性天气：8月末初秋，偶有降雨降温
  const r = rand();
  if (r < 0.12) return { condition: "大雨", lowC: 19, highC: 24 };
  if (r < 0.3) return { condition: "小雨", lowC: 20, highC: 26 };
  if (r < 0.42) return { condition: "降温", lowC: 16, highC: 23 };
  if (r < 0.68) return { condition: "多云", lowC: 21, highC: 29 };
  return { condition: "晴", lowC: 22, highC: 31 };
}

function eventOf(date: Date): string | undefined {
  const d = date.getDate();
  if (d === 31) return "下周二开学，学生客回流";
  if (date.getDay() === 5) return "周五，加班族早餐刚需";
  if (d === 29) return "附近写字楼团建，人流略减";
  return undefined;
}

// 预测模型：天真版（只看星期）→ 进化版（星期×天气×事件）
function forecast(
  base: number,
  weather: WeatherInfo,
  event?: string,
  withWeather: boolean = true
): number {
  let m = 1;
  if (withWeather) {
    if (weather.condition === "大雨") m *= 0.62;
    else if (weather.condition === "小雨") m *= 0.78;
    else if (weather.condition === "降温") m *= 1.12; // 冷天豆浆煎饼更香
    if (event?.includes("开学")) m *= 1.15;
    if (event?.includes("团建")) m *= 0.9;
  }
  return Math.round(base * m);
}

function actualUnits(
  predicted: number,
  weather: WeatherInfo,
  noiseScale: number
): number {
  const noise = (rand() * 2 - 1) * noiseScale; // 前期 ±30%，后期 ±6%
  let m = 1 + noise;
  // 真实世界天气一定影响销量，无论预测学没学会
  if (weather.condition === "大雨") m *= 0.65;
  else if (weather.condition === "小雨") m *= 0.8;
  else if (weather.condition === "降温") m *= 1.1;
  return Math.max(20, Math.round(predicted * m));
}

export function generateHistory(endDate: Date, days = 14): DailyStat[] {
  const stats: DailyStat[] = [];
  for (let i = days; i >= 1; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    const weather = weatherOf(d);
    const event = eventOf(d);
    const base = WEEKDAY_BASE[d.getDay()];
    // 前5天：天真预测（不看天气）→ 误差自然大
    const withWeather = i <= 5;
    const predicted = forecast(base, weather, event, withWeather);
    const noiseScale = withWeather ? 0.06 : 0.3;
    const actual = actualUnits(predicted, weather, noiseScale);
    const waste = Math.max(
      0,
      Math.round(Math.abs(predicted - actual) * (0.4 + rand() * 0.3))
    );
    stats.push({
      date: fmt(d),
      weekday: d.getDay(),
      weather,
      event,
      predictedUnits: predicted,
      actualUnits: actual,
      revenue: Math.round(actual * 8.2 + rand() * 60),
      wasteUnits: withWeather ? Math.round(waste * 0.5) : waste, // 学会后浪费减半
      itemBreakdown: {
        "jb-original": Math.round(actual * 0.55),
        "jb-full": Math.round(actual * 0.3),
        "soy-sweet": Math.round(actual * 0.5),
        "soy-salty": Math.round(actual * 0.15),
        "soy-large": Math.round(actual * 0.25),
      },
    });
  }
  return stats;
}

// ---------- 熟客档案（深夜食堂的魂） ----------
export const REGULARS: CustomerProfile[] = [
  {
    id: "c1",
    nick: "熟客 · 张叔",
    visitWeekdays: [1, 3, 5],
    preferredTime: "07:20",
    favorite: "双蛋煎饼 · 不要香菜 + 咸豆浆",
    notes: " 构建中：工地早班，风雨无阻；香菜过敏，双蛋是老规矩",
    totalVisits: 47,
    lastVisitDate: "",
  },
  {
    id: "c2",
    nick: "熟客 · 李阿姨",
    visitWeekdays: [2, 4],
    preferredTime: "06:50",
    favorite: "原味煎饼 + 甜豆浆（大杯）",
    notes: "晨练完顺路，总给老伴带一份，豆浆要最烫的",
    totalVisits: 32,
    lastVisitDate: "",
  },
  {
    id: "c3",
    nick: "熟客 · 高中生小王",
    visitWeekdays: [1, 2, 3, 4, 5],
    preferredTime: "07:05",
    favorite: "全套煎饼果子（开学季回归）",
    notes: "暑假回老家刚回来，开学后每天卡点到，赶校车",
    totalVisits: 21,
    lastVisitDate: "",
  },
  {
    id: "c4",
    nick: "熟客 · 程序员小刘",
    visitWeekdays: [1, 2, 3, 4, 5],
    preferredTime: "08:40",
    favorite: "全套煎饼 + 大杯豆浆",
    notes: "加班到最晚，起得最晚；上月连来 19 天，阿姨劝他吃点绿的",
    totalVisits: 38,
    lastVisitDate: "",
  },
];

export function fmt(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export { WEEKDAY_BASE, forecast as forecastUnits };
