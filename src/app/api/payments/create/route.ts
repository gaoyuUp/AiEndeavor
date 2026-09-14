import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { listedAmountMinor, parseUsdCnyRate, settlementCnyMinor, usdtAmountFromCnyMinor } from "@/lib/fx";
import { getUsdCnyRate } from "@/lib/fx-server";
import { assertOrderAccess, StoreError } from "@/lib/orders";
import { mockPaymentProvider } from "@/lib/payment";

const schema = z.object({
  orderNo: z.string().min(8),
  queryPassword: z.string().min(6).max(100),
  method: z.enum(["qrcode", "usdt"]),
});

async function getPaymentSettings() {
  const rows = await db.siteSetting.findMany({
    where: { key: { in: ["usdt_wallet_bep20", "usdt_cny_rate", "payment_notice"] } },
  });
  const settings = Object.fromEntries(rows.map((row) => [row.key, typeof row.value === "string" ? row.value : ""]));
  return {
    wallet: settings.usdt_wallet_bep20 || "0xDEMO0000000000000000000000000000BEP20",
    cnyRate: parseUsdCnyRate(settings.usdt_cny_rate),
    notice: settings.payment_notice || "请按订单金额完成支付。电子收款码按人民币收款；USDT 按 USDT 金额转账。电子收款码到账后由管理员人工核对。",
  };
}

async function orderCnyMinor(order: { currency: string; totalMinor: number; items: Array<{ variantId: string }> }) {
  const variantId = order.items[0]?.variantId;
  const prices = variantId
    ? await db.variantPrice.findMany({ where: { variantId, active: true } })
    : [];
  return settlementCnyMinor(order, listedAmountMinor(prices, "CNY"), await getUsdCnyRate());
}

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const order = await assertOrderAccess(input.orderNo, input.queryPassword);
    const productSlug = order.items[0]?.product?.slug ?? "";
    if (order.orderStatus === "EXPIRED" || (order.orderStatus === "PENDING_PAYMENT" && order.expiresAt < new Date())) {
      return NextResponse.json({ error: "支付已超时，请重新下单", expired: true, productSlug }, { status: 410 });
    }
    if (!["PENDING_PAYMENT", "PAYMENT_REVIEW"].includes(order.orderStatus)) {
      throw new StoreError("订单无需再次支付", 409);
    }

    const settings = await getPaymentSettings();
    const amountMinor = await orderCnyMinor(order);
    const usdtAmount = usdtAmountFromCnyMinor(amountMinor, settings.cnyRate);
    const existing = await db.payment.findUnique({ where: { idempotencyKey: `payment:${order.id}` } });
    const payload = {
      wallet: settings.wallet,
      network: "BNB Smart Chain (BEP20)",
      amountMinor,
      currency: "CNY" as const,
      usdtAmount,
      qrImage: "/payments/collection-qr.jpg",
      notice: settings.notice,
      expiresAt: order.expiresAt,
      productSlug,
      proofRequested: order.proofRequested,
    };

    if (existing?.status === "SUBMITTED") {
      return NextResponse.json({
        paymentId: existing.id,
        method: existing.provider,
        status: existing.status,
        ...payload,
      });
    }

    const session = mockPaymentProvider.createSession({
      orderNo: order.orderNo,
      amountMinor,
      currency: "CNY",
      method: input.method,
    });
    const payment = existing
      ? await db.payment.update({
          where: { id: existing.id },
          data: {
            provider: input.method,
            transactionId: session.transactionId,
            status: "PENDING",
            amountMinor,
            currency: "CNY",
          },
        })
      : await db.payment.create({
          data: {
            orderId: order.id,
            provider: input.method,
            transactionId: session.transactionId,
            idempotencyKey: `payment:${order.id}`,
            amountMinor,
            currency: "CNY",
          },
        });

    return NextResponse.json({
      paymentId: payment.id,
      method: input.method,
      status: payment.status,
      transactionId: session.transactionId,
      ...payload,
    }, { status: existing ? 200 : 201 });
  } catch (error) {
    const status = error instanceof StoreError ? error.status : error instanceof z.ZodError ? 422 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "创建支付失败" }, { status });
  }
}
