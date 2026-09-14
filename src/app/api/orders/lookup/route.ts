import { NextResponse } from "next/server";
import { z } from "zod";
import { findOrdersByCredential } from "@/lib/orders";
import { serializePublicOrder } from "@/lib/public-order";
import { rateLimit, requestIp } from "@/lib/rate-limit";

const schema = z.object({
  identifier: z.string().trim().min(3).max(200),
  queryPassword: z.string().min(6).max(100),
});

export async function POST(request: Request) {
  try {
    if (!rateLimit(`lookup:${requestIp(request)}`, 15, 60_000).allowed) {
      return NextResponse.json({ error: "查询过于频繁，请稍后再试" }, { status: 429 });
    }
    const input = schema.parse(await request.json());
    const orders = await findOrdersByCredential(input.identifier, input.queryPassword);
    if (!orders.length) return NextResponse.json({ error: "订单标识或查询密码不正确" }, { status: 404 });
    return NextResponse.json({ orders: orders.map(serializePublicOrder) });
  } catch (error) {
    const status = error instanceof z.ZodError ? 422 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "查询失败" }, { status });
  }
}
