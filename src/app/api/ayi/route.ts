import { NextResponse } from "next/server";
import { warmUpReasons } from "@/lib/glm";
import { morningBrief, store, todaysRegulars } from "@/lib/store";

// 阿姨端首页数据：晨报 + 今日熟客 + 订单
export async function GET() {
  const s = store();
  const brief = morningBrief();
  const reasons = await warmUpReasons(brief.reasons); // GLM 润色，失败自动用原文
  return NextResponse.json({
    brief: { ...brief, reasons },
    regulars: todaysRegulars(),
    orders: s.orders,
    ledgers: s.ledgers,
    stall: { openToday: s.openToday, note: s.openNote },
  });
}
