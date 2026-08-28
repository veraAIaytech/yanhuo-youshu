import { NextRequest, NextResponse } from "next/server";
import { providerFor } from "@/lib/pay";
import { store } from "@/lib/store";
import type { Order } from "@/lib/types";

// 收银台：Mock 通道完整走一遍 风控参数→下单→支付→回调 链路
export async function POST(req: NextRequest) {
  const { orderId, method } = (await req.json()) as { orderId?: string; method?: string };
  const s = store();
  const order = s.orders.find((o) => o.id === orderId);
  if (!order) return NextResponse.json({ error: "订单不存在" }, { status: 404 });

  const provider = providerFor(method ?? "mock");
  await provider.createOrder(order);
  const result = await provider.pay(order);

  // 以"回调"作为入账依据（演示中直接成功）
  const cb = await provider.parseCallback({ orderId: order.id, success: true });
  if (cb.success) {
    order.status = "已支付";
    order.payMethod = (method as Order["payMethod"]) ?? "到店付";
  }
  return NextResponse.json({
    ok: true,
    channel: result.channel,
    order,
    pickupCode: order.id.slice(0, 4).toUpperCase(),
  });
}
