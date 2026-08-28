import { NextRequest, NextResponse } from "next/server";
import { MENU, store } from "@/lib/store";
import type { Order, OrderItem } from "@/lib/types";

const PICKUP_SLOTS = ["06:30 - 06:50", "06:50 - 07:10", "07:10 - 07:30", "07:30 - 08:00", "08:00 - 08:40", "08:40 以后"];

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    orderId?: string;
    items?: OrderItem[];
    pickupSlot?: string;
    note?: string;
    customerNick?: string;
    payMethod?: Order["payMethod"];
  };

  // 幂等：同一 orderId 重复提交直接返回已有订单（防手抖双击）
  const s = store();
  const existed = s.orders.find((o) => o.id === body.orderId);
  if (existed) return NextResponse.json({ order: existed, idempotent: true });

  if (!body.orderId || !body.items?.length) {
    return NextResponse.json({ error: "订单为空" }, { status: 400 });
  }

  // 金额在服务端按菜单重算，不信任前端
  let total = 0;
  for (const it of body.items) {
    const mi = MENU.find((m) => m.id === it.menuItemId);
    if (!mi) return NextResponse.json({ error: "菜单项不存在" }, { status: 400 });
    total += mi.price * it.qty;
    for (const oid of it.optionIds) {
      const op = mi.options.find((o) => o.id === oid);
      if (op) total += op.priceDelta * it.qty;
    }
  }
  total = Math.round(total * 10) / 10;

  const nick = body.customerNick?.trim() || "路人甲";
  const order: Order = {
    id: body.orderId,
    customerNick: nick,
    isRegular: false,
    items: body.items,
    total,
    pickupSlot: PICKUP_SLOTS.includes(body.pickupSlot ?? "") ? body.pickupSlot! : "07:10 - 07:30",
    status: "待支付",
    payMethod: body.payMethod ?? "到店付",
    note: body.note?.slice(0, 50),
    createdAt: s.simDate.toISOString(),
  };
  s.orders.push(order);
  s.totalOrders += 1;
  return NextResponse.json({ order, pickupCode: order.id.slice(0, 4).toUpperCase() });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const order = store().orders.find((o) => o.id === id);
  if (!order) return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  return NextResponse.json({ order, pickupCode: order.id.slice(0, 4).toUpperCase() });
}
