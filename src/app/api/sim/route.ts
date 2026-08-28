import { NextRequest, NextResponse } from "next/server";
import { advanceDay, resetStore, store } from "@/lib/store";

// 演示模拟器：时间快进 / 一键重置
export async function POST(req: NextRequest) {
  const { action } = (await req.json()) as { action?: "advance" | "reset" };
  if (action === "reset") {
    resetStore();
    return NextResponse.json({ ok: true, action, simDate: store().simDate.toISOString() });
  }
  if (action === "advance") {
    advanceDay();
    return NextResponse.json({ ok: true, action, simDate: store().simDate.toISOString() });
  }
  return NextResponse.json({ error: "未知操作" }, { status: 400 });
}
