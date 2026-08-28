import { NextRequest, NextResponse } from "next/server";
import { parseLedger } from "@/lib/glm";
import { store } from "@/lib/store";

// 收摊语音/文字记账：口述 → 结构化数据入库（冷启动的关键）
export async function POST(req: NextRequest) {
  const { text } = (await req.json()) as { text?: string };
  if (!text?.trim()) return NextResponse.json({ error: "没有收到内容" }, { status: 400 });

  const result = await parseLedger(text.trim());
  const s = store();
  const time = new Date(s.simDate).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  const summary =
    [result.sold != null ? `卖出 ${result.sold} 份` : null, result.leftover != null ? `剩 ${result.leftover} 份` : null, result.soyMilkLeft].filter(Boolean).join(" · ") || "已记录";
  s.ledgers.unshift({ time, text: text.trim(), result: summary, source: result.source });
  return NextResponse.json({ ledger: s.ledgers[0], parsed: result });
}
