import { NextResponse } from "next/server";
import { store } from "@/lib/store";

// 预测面板：历史数据 + 收敛指标（数据飞轮可视化）
export async function GET() {
  const s = store();
  const stats = s.stats.map((d) => ({
    ...d,
    errorPct: Math.round(Math.abs(d.actualUnits - d.predictedUnits * 1.0) / d.predictedUnits * 100),
  }));
  const first5 = stats.slice(0, 5);
  const last5 = stats.slice(-5);
  const avg = (arr: typeof stats) => Math.round(arr.reduce((a, d) => a + d.errorPct, 0) / arr.length);
  const wasteFirst = Math.round(first5.reduce((a, d) => a + d.wasteUnits, 0) / 5);
  const wasteLast = Math.round(last5.reduce((a, d) => a + d.wasteUnits, 0) / 5);
  return NextResponse.json({
    stats,
    simDate: s.simDate.toISOString(),
    summary: {
      errorEarlyPct: avg(first5),
      errorRecentPct: avg(last5),
      wasteEarly: wasteFirst,
      wasteRecent: wasteLast,
      wasteSavedPct: wasteFirst > 0 ? Math.round((1 - wasteLast / wasteFirst) * 100) : 0,
    },
  });
}
