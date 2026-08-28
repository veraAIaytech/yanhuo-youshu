import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

// 动态体验二维码：看板从哪个地址被访问，二维码就指向哪个地址
// 云端访问 → https://jianbing-demo.vercel.app；摊位局域网访问 → http://192.168.x.x:3000
// 评委扫码永远拿到"当前一定能打开"的那个地址

export async function GET(req: NextRequest) {
  const host = req.headers.get("host") ?? "jianbing-demo.vercel.app";
  const isLocal = /^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
  const target = `${isLocal ? "http" : "https"}://${host}/`;

  const buf = await QRCode.toBuffer(target, {
    width: 640,
    margin: 1,
    color: { dark: "#3d2b1f", light: "#faf5ea" },
    errorCorrectionLevel: "M",
  });

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
