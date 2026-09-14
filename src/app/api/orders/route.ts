import { NextResponse } from "next/server";
import { z } from "zod";
import { HumanCheckError, consumeHumanToken } from "@/lib/human-check";
import { createOrder, StoreError } from "@/lib/orders";
import { rateLimit, requestIp } from "@/lib/rate-limit";

const schema = z.object({
  variantId: z.string().min(1),
  contact: z.string().trim().min(3).max(200),
  queryPassword: z.string().min(6).max(100),
  currency: z.enum(["CNY", "USD"]).optional(),
  quantity: z.literal(1).default(1),
  humanToken: z.string().min(10).max(200),
  website: z.string().max(80).optional(),
});

export async function POST(request: Request) {
  try {
    if (!rateLimit(`order:${requestIp(request)}`, 6, 60_000).allowed) {
      return NextResponse.json({ error: "操作过于频繁，请稍后再试" }, { status: 429 });
    }
    const input = schema.parse(await request.json());
    if (input.website?.trim()) {
      return NextResponse.json({ error: "请检查联系方式、查询密码和商品信息" }, { status: 422 });
    }
    consumeHumanToken(input.humanToken);
    const { order } = await createOrder({
      variantId: input.variantId,
      contact: input.contact,
      queryPassword: input.queryPassword,
    });
    return NextResponse.json(
      { orderNo: order.orderNo, expiresAt: order.expiresAt },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "请检查联系方式、查询密码和商品信息", details: error.issues }, { status: 422 });
    }
    if (error instanceof HumanCheckError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const status = error instanceof StoreError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "创建订单失败" }, { status });
  }
}
