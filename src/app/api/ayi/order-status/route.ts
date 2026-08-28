import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import type { OrderStatus } from "@/lib/types";

// 阿姨端：推进订单状态（制作中 → 已完成）
export async function POST(req: NextRequest) {
  const { orderId, status } = (await req.json()) as { orderId?: string; status?: OrderStatus };
  const order = store().orders.find((o) => o.id === orderId);
  if (!order) return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  if (status) order.status = status;
  return NextResponse.json({ order });
}
