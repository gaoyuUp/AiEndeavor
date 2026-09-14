import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "微信/支付宝模拟支付已停用，请使用电子收款码或 USDT" }, { status: 410 });
}
