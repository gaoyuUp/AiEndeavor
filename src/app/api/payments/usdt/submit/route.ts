import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertOrderAccess, StoreError } from "@/lib/orders";

const schema = z.object({
  orderNo: z.string().min(8),
  queryPassword: z.string().min(6).max(100),
  paymentId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const order = await assertOrderAccess(input.orderNo, input.queryPassword);
    if (order.expiresAt < new Date() && order.orderStatus === "PENDING_PAYMENT") {
      throw new StoreError("订单已失效，请重新下单", 410);
    }

    await db.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id: input.paymentId } });
      if (!payment || payment.orderId !== order.id || payment.provider !== "usdt") {
        throw new StoreError("USDT 支付记录不存在", 404);
      }
      if (payment.status === "SUBMITTED") return;
      if (payment.status !== "PENDING" || order.orderStatus !== "PENDING_PAYMENT") {
        throw new StoreError("当前订单不可提交转账", 409);
      }
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "SUBMITTED", submittedAt: new Date() },
      });
      await tx.paymentEvent.create({
        data: {
          paymentId: payment.id,
          eventKey: `usdt:submitted:${payment.id}`,
          eventType: "payment.submitted",
          payload: { orderNo: order.orderNo, network: "BEP20" },
          processedAt: new Date(),
        },
      });
      await tx.order.update({
        where: { id: order.id },
        data: { orderStatus: "PAYMENT_REVIEW", paymentStatus: "SUBMITTED" },
      });
    });
    return NextResponse.json({ ok: true, status: "PAYMENT_REVIEW" });
  } catch (error) {
    const status = error instanceof StoreError ? error.status : error instanceof z.ZodError ? 422 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "提交失败" }, { status });
  }
}
