import { NextResponse } from "next/server";
import { morningBrief, store, todaysRegulars } from "@/lib/store";

// 阿姨端首页数据：晨报 + 今日熟客 + 订单
// 注意：不串行等待 GLM 润色——理由文案本身就是人话，接口毫秒级返回，演示永不白屏
export async function GET() {
  const s = store();
  const brief = morningBrief();
  return NextResponse.json({
    brief,
    regulars: todaysRegulars(),
    orders: s.orders,
    ledgers: s.ledgers,
    stall: { openToday: s.openToday, note: s.openNote },
  });
}
