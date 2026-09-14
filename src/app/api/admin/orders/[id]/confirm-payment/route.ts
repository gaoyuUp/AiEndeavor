import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { confirmPaidPayment, StoreError } from "@/lib/orders";

const confirmableProviders = new Set(["qrcode", "usdt"]);

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { id } = await params;
  try {
    const order = await db.order.findUnique({
      where: { id },
      include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    const payment = order?.payments[0];
    if (order && payment && confirmableProviders.has(payment.provider) && payment.status === "PAID") {
      return NextResponse.json({ ok: true, orderStatus: order.orderStatus, alreadyConfirmed: true });
    }
    if (!order || order.orderStatus !== "PAYMENT_REVIEW" || !payment || !confirmableProviders.has(payment.provider) || payment.status !== "SUBMITTED") {
      throw new StoreError("该订单不是待确认收款的订单", 409);
    }
    const result = await confirmPaidPayment({
      paymentId: payment.id,
      eventKey: `admin:${payment.provider}:confirmed:${payment.id}`,
      transactionId: payment.transactionId ?? `${payment.provider.toUpperCase()}-${payment.id}`,
      amountMinor: payment.amountMinor,
      currency: payment.currency,
      payload: { confirmedBy: admin.id, provider: payment.provider, confirmedAt: new Date().toISOString() },
    });
    await db.auditLog.create({ data: { adminId: admin.id, action: "CONFIRM_PAYMENT", entityType: "order", entityId: order.id } });
    return NextResponse.json({ ok: true, orderStatus: result.orderStatus });
  } catch (error) {
    const status = error instanceof StoreError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "确认失败" }, { status });
  }
}
