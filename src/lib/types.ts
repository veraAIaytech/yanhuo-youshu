// 数据模型 —— 烟火有数（煎饼摊 AI 经营副驾）
// 设计原则：与落地版（yshop-drink）字段对齐，黑客松后可平移

export type Category = "主食" | "饮品" | "小料";

export interface MenuOption {
  id: string; // "extra-egg"
  name: string; // "加蛋"
  priceDelta: number; // +1.5
}

export interface MenuItem {
  id: string;
  name: string;
  emoji: string;
  category: Category;
  price: number; // 元
  description: string;
  options: MenuOption[];
  active: boolean;
}

export type OrderStatus = "待支付" | "已支付" | "制作中" | "已完成" | "已取消";

export interface OrderItem {
  menuItemId: string;
  optionIds: string[];
  qty: number;
}

export interface Order {
  id: string; // 客户端生成，用于防重复提交（幂等）
  customerNick: string; // 匿名昵称，如 "熟客 #3"
  isRegular: boolean;
  items: OrderItem[];
  total: number; // 元
  pickupSlot: string; // "07:10 - 07:25"
  status: OrderStatus;
  payMethod: "微信" | "支付宝" | "到店付";
  note?: string;
  createdAt: string; // 模拟时间 ISO
}

export interface CustomerProfile {
  id: string;
  nick: string; // 匿名昵称
  visitWeekdays: number[]; // 0-6，常来的星期
  preferredTime: string; // "07:15"
  favorite: string; // "双蛋煎饼 + 甜豆浆"
  notes: string; // AI 口味档案（人话）
  totalVisits: number;
  lastVisitDate: string;
}

export interface WeatherInfo {
  condition: "晴" | "多云" | "小雨" | "大雨" | "降温";
  lowC: number;
  highC: number;
}

export interface DailyStat {
  date: string; // YYYY-MM-DD
  weekday: number; // 0=周日
  weather: WeatherInfo;
  event?: string; // "开学第一天" 等
  predictedUnits: number; // 当天早晨系统给出的预测
  actualUnits: number; // 实际卖出份数（煎饼）
  revenue: number; // 元
  wasteUnits: number; // 备货没卖完的份数
  itemBreakdown: Record<string, number>; // menuItemId -> 份数
}

export interface MorningBrief {
  date: string;
  predictedUnits: number;
  confidencePct: number; // 预估置信度
  perItem: { menuItemId: string; name: string; prepUnits: number }[];
  reasons: string[]; // 结构化理由（GLM 会改写成阿姨能听懂的人话）
}

export interface PaymentProviderResult {
  orderId: string;
  status: "已支付" | "待支付";
  channel: "mock" | "wechat" | "alipay";
}
