// 统一支付适配层 —— 黑客松只实现 Mock；落地时新增官方 Provider，业务零改动
// 见《支付收款方案规划.md》：createOrder / pay / parseCallback 三方法

import type { Order, PaymentProviderResult } from "./types";

export interface PaymentProvider {
  readonly channel: string;
  createOrder(order: Order): Promise<{ providerOrderId: string }>;
  pay(order: Order): Promise<PaymentProviderResult>;
  parseCallback(payload: unknown): Promise<{ orderId: string; success: boolean }>;
}

/** 演示通道：直接成功，模拟真实收银链路 */
export class MockProvider implements PaymentProvider {
  readonly channel = "mock";
  async createOrder(order: Order) {
    return { providerOrderId: `mock_${order.id.slice(0, 8)}` };
  }
  async pay(order: Order): Promise<PaymentProviderResult> {
    return { orderId: order.id, status: "已支付", channel: "mock" };
  }
  async parseCallback(payload: unknown) {
    const p = payload as { orderId?: string };
    return { orderId: p.orderId ?? "", success: true };
  }
}

// 落地阶段 2 在此追加：
// export class WechatPayProvider implements PaymentProvider { ... }  // JSAPI/Native
// export class AlipayProvider implements PaymentProvider { ... }     // 当面付/手机网站支付

export function providerFor(method: string): PaymentProvider {
  // 黑客松阶段：所有方式统一走 Mock（演示完整链路，不接真实资质）
  return new MockProvider();
}

/** 前端环境检测：微信内 / 支付宝内 / 普通浏览器 */
export function detectEnv(ua: string): "wechat" | "alipay" | "browser" {
  const s = ua.toLowerCase();
  if (s.includes("micromessenger")) return "wechat";
  if (s.includes("alipay")) return "alipay";
  return "browser";
}
