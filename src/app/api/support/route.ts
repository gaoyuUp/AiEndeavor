import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { HumanCheckError, consumeHumanToken } from "@/lib/human-check";
import { rateLimit, requestIp } from "@/lib/rate-limit";
import { publicId } from "@/lib/utils";

const schema = z.object({
  orderNo: z.string().trim().min(8).max(40),
  email: z.email(),
  subject: z.string().min(2).max(120),
  message: z.string().min(10).max(5000),
  humanToken: z.string().min(10).max(200),
  website: z.string().max(80).optional(),
  locale: z.enum(["zh", "en"]).optional(),
});

function msg(locale: "zh" | "en", zh: string, en: string) {
  return locale === "en" ? en : zh;
}

export async function POST(request: Request) {
  let locale: "zh" | "en" = "zh";
  try {
    const raw: unknown = await request.json();
    locale = typeof raw === "object" && raw && "locale" in raw && raw.locale === "en" ? "en" : "zh";
    if (!rateLimit(`support:${requestIp(request)}`, 5, 60_000).allowed) {
      return NextResponse.json({ error: msg(locale, "提交过于频繁，请稍后再试", "Too many attempts. Please try again later.") }, { status: 429 });
    }
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: msg(locale, "请填写有效的订单号、邮箱和问题描述", "Please enter a valid order number, email and message.") }, { status: 422 });
    }
    const input = parsed.data;
    if (input.website?.trim()) {
      return NextResponse.json({ error: msg(locale, "请检查订单号和表单内容", "Please check the order number and form details.") }, { status: 422 });
    }
    consumeHumanToken(input.humanToken);
    const orderNo = input.orderNo.replace(/\s+/g, "").toUpperCase();
    const order = await db.order.findUnique({ where: { orderNo } });
    if (!order) {
      return NextResponse.json({ error: msg(locale, "订单号不存在，请核对后再提交", "Order number not found. Please check and try again.") }, { status: 404 });
    }
    const ticket = await db.supportTicket.create({
      data: {
        ticketNo: publicId("TK"),
        orderId: order.id,
        email: input.email.trim().toLowerCase(),
        subject: input.subject,
        message: input.message,
      },
    });
    return NextResponse.json({ ticketNo: ticket.ticketNo }, { status: 201 });
  } catch (error) {
    if (error instanceof HumanCheckError) {
      return NextResponse.json({
        error: msg(locale, error.message, "Please complete the human check first"),
      }, { status: error.status });
    }
    return NextResponse.json({ error: msg(locale, "提交失败", "Could not submit") }, { status: 500 });
  }
}
