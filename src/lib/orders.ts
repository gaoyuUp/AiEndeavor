import { Prisma } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import { db } from "@/lib/db";
import { getUsdCnyRate } from "@/lib/fx-server";
import { resolveStorePrice } from "@/lib/fx";
import { MAX_PROOF_REJECTIONS } from "@/lib/proofs";
import { safeTokenEqual } from "@/lib/security";
import { publicId } from "@/lib/utils";

export class StoreError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export function normalizeContact(contact: string) {
  return contact.trim().toLowerCase().replace(/\s+/g, " ");
}

async function expireDueOrdersInTransaction(tx: Prisma.TransactionClient) {
  const expiredOrders = await tx.order.findMany({
    where: { expiresAt: { lt: new Date() }, orderStatus: "PENDING_PAYMENT" },
    select: {
      id: true,
      reservations: { select: { id: true, inventoryItemId: true } },
    },
    take: 100,
  });
  if (!expiredOrders.length) return 0;
  const reservations = expiredOrders.flatMap((order) => order.reservations);
  await tx.inventoryItem.updateMany({
    where: { id: { in: reservations.map((item) => item.inventoryItemId) }, status: "RESERVED" },
    data: { status: "AVAILABLE" },
  });
  await tx.inventoryReservation.deleteMany({ where: { id: { in: reservations.map((item) => item.id) } } });
  await tx.order.updateMany({
    where: { id: { in: expiredOrders.map((item) => item.id) }, orderStatus: "PENDING_PAYMENT" },
    data: { orderStatus: "EXPIRED", paymentStatus: "CANCELLED", cancelledAt: new Date() },
  });
  await tx.payment.updateMany({
    where: { orderId: { in: expiredOrders.map((item) => item.id) }, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
  return expiredOrders.length;
}

export async function expireDueOrders() {
  return db.$transaction((tx) => expireDueOrdersInTransaction(tx));
}

export async function createOrder(input: {
  variantId: string;
  contact: string;
  queryPassword: string;
}) {
  const orderNo = publicId("SD");
  const expiresAt = new Date(Date.now() + 20 * 60 * 1000);
  const queryPasswordHash = await hash(input.queryPassword, 12);
  const usdCnyRate = await getUsdCnyRate();

  const result = await db.$transaction(async (tx) => {
    await expireDueOrdersInTransaction(tx);
    const variant = await tx.productVariant.findFirst({
      where: { id: input.variantId, status: "ACTIVE", product: { status: "ACTIVE" } },
      include: {
        product: true,
        prices: { where: { active: true } },
      },
    });
    if (!variant) throw new StoreError("商品套餐不存在或已下架", 404);
    const price = resolveStorePrice(variant.prices, "CNY", usdCnyRate);
    if (!price) throw new StoreError("该商品尚未设置人民币价格");

    let inventoryItemId: string | undefined;
    if (variant.stockMode === "INVENTORY") {
      const inventory = await tx.inventoryItem.findFirst({
        where: { variantId: variant.id, status: "AVAILABLE" },
        orderBy: { createdAt: "asc" },
      });
      if (!inventory) throw new StoreError("该套餐暂时售罄", 409);
      const claimed = await tx.inventoryItem.updateMany({
        where: { id: inventory.id, status: "AVAILABLE" },
        data: { status: "RESERVED" },
      });
      if (claimed.count !== 1) throw new StoreError("库存刚刚发生变化，请重试", 409);
      inventoryItemId = inventory.id;
    }

    const order = await tx.order.create({
      data: {
        orderNo,
        contact: normalizeContact(input.contact),
        queryPasswordHash,
        currency: "CNY",
        totalMinor: price.amountMinor,
        expiresAt,
        items: {
          create: {
            productId: variant.product.id,
            variantId: variant.id,
            productNameZh: variant.product.nameZh,
            productNameEn: variant.product.nameEn,
            variantNameZh: variant.nameZh,
            variantNameEn: variant.nameEn,
            sku: variant.sku,
            deliveryType: variant.deliveryType,
            unitPriceMinor: price.amountMinor,
            totalMinor: price.amountMinor,
          },
        },
      },
      include: { items: true },
    });

    if (inventoryItemId) {
      await tx.inventoryReservation.create({
        data: { inventoryItemId, orderId: order.id, expiresAt },
      });
    }
    return order;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  return { order: result };
}

async function verifyOrderPassword(password: string, passwordHash: string) {
  if (passwordHash.startsWith("$2")) return compare(password, passwordHash);
  return safeTokenEqual(password, passwordHash);
}

const orderLookupInclude = {
  items: { include: { product: { select: { slug: true } } } },
  payments: { orderBy: { createdAt: "desc" as const }, take: 1 },
  paymentProofs: { orderBy: { createdAt: "asc" as const } },
  proofRejections: { orderBy: { createdAt: "asc" as const } },
  deliveryRecords: { orderBy: { createdAt: "asc" as const } },
};

export async function assertOrderAccess(orderNo: string, password: string) {
  await expireDueOrders();
  const order = await db.order.findUnique({
    where: { orderNo },
    include: orderLookupInclude,
  });
  if (!order || !(await verifyOrderPassword(password, order.queryPasswordHash))) {
    throw new StoreError("订单号或查询密码不正确", 404);
  }
  return order;
}

export async function findOrdersByCredential(identifier: string, password: string) {
  await expireDueOrders();
  const normalized = normalizeContact(identifier);
  const direct = await db.order.findUnique({
    where: { orderNo: identifier.trim().toUpperCase() },
    include: orderLookupInclude,
  });
  if (direct) return (await verifyOrderPassword(password, direct.queryPasswordHash)) ? [direct] : [];

  const candidates = await db.order.findMany({
    where: { contact: normalized },
    include: orderLookupInclude,
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const matched = [];
  for (const order of candidates) {
    if (await verifyOrderPassword(password, order.queryPasswordHash)) matched.push(order);
  }
  return matched;
}

export async function confirmPaidPayment(input: {
  paymentId: string;
  eventKey: string;
  transactionId: string;
  amountMinor: number;
  currency: string;
  payload: Prisma.InputJsonValue;
}) {
  return db.$transaction(async (tx) => {
    const existingEvent = await tx.paymentEvent.findUnique({ where: { eventKey: input.eventKey } });
    if (existingEvent) {
      return tx.order.findFirstOrThrow({ where: { payments: { some: { id: input.paymentId } } } });
    }

    const payment = await tx.payment.findUnique({
      where: { id: input.paymentId },
      include: {
        order: {
          include: {
            items: { include: { variant: true } },
            reservations: { include: { inventoryItem: true } },
          },
        },
      },
    });
    if (!payment) throw new StoreError("支付记录不存在", 404);
    if (payment.amountMinor !== input.amountMinor || payment.currency !== input.currency) {
      throw new StoreError("支付金额或币种校验失败", 422);
    }

    await tx.paymentEvent.create({
      data: {
        paymentId: payment.id,
        eventKey: input.eventKey,
        eventType: "payment.succeeded",
        payload: input.payload,
        processedAt: new Date(),
      },
    });
    if (payment.status === "PAID") return payment.order;
    if (!["PENDING_PAYMENT", "PAYMENT_REVIEW"].includes(payment.order.orderStatus)) {
      throw new StoreError("订单当前状态不可支付", 409);
    }

    const now = new Date();
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "PAID", transactionId: input.transactionId, paidAt: now },
    });
    await tx.order.update({
      where: { id: payment.order.id },
      data: { orderStatus: "PAID", paymentStatus: "PAID", paidAt: now },
    });

    let needsManual = false;
    for (const item of payment.order.items) {
      const reservation = payment.order.reservations.find((entry) => entry.inventoryItem.variantId === item.variantId);
      let content: string | null = null;
      if (reservation) {
        content = reservation.inventoryItem.content;
        await tx.inventoryItem.update({
          where: { id: reservation.inventoryItemId },
          data: { status: "SOLD", orderItemId: item.id, soldAt: now },
        });
        await tx.inventoryReservation.delete({ where: { id: reservation.id } });
      } else if (item.deliveryType === "LINK" || item.deliveryType === "TEXT") {
        content = item.variant.deliveryContent;
      }

      if (item.deliveryType === "MANUAL" || !content) {
        needsManual = true;
      } else {
        await tx.deliveryRecord.create({
          data: { orderId: payment.order.id, type: item.deliveryType, content, status: "DELIVERED" },
        });
      }
    }

    return tx.order.update({
      where: { id: payment.order.id },
      data: needsManual
        ? { orderStatus: "PROCESSING", deliveryStatus: "PROCESSING" }
        : { orderStatus: "COMPLETED", deliveryStatus: "DELIVERED", completedAt: now },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function rejectPaymentProof(orderId: string, adminId: string, note?: string) {
  const result = await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        paymentProofs: true,
        proofRejections: true,
        reservations: { select: { id: true, inventoryItemId: true } },
      },
    });
    if (!order || order.orderStatus !== "PAYMENT_REVIEW") {
      throw new StoreError("只有待确认收款的订单可以驳回凭证", 409);
    }
    if (!order.paymentProofs.length) {
      throw new StoreError("当前没有可驳回的支付凭证", 409);
    }
    if (order.proofRejections.length >= MAX_PROOF_REJECTIONS) {
      throw new StoreError("该订单凭证已达驳回上限", 409);
    }

    const trimmedNote = note?.trim().slice(0, 200) || null;
    await tx.proofRejection.create({ data: { orderId: order.id, note: trimmedNote } });
    await tx.paymentProof.deleteMany({ where: { orderId: order.id } });
    const rejectCount = order.proofRejections.length + 1;
    const abnormal = rejectCount >= MAX_PROOF_REJECTIONS;

    if (abnormal) {
      const reservationIds = order.reservations.map((item) => item.id);
      const inventoryIds = order.reservations.map((item) => item.inventoryItemId);
      if (inventoryIds.length) {
        await tx.inventoryItem.updateMany({
          where: { id: { in: inventoryIds }, status: "RESERVED" },
          data: { status: "AVAILABLE" },
        });
      }
      if (reservationIds.length) {
        await tx.inventoryReservation.deleteMany({ where: { id: { in: reservationIds } } });
      }
      await tx.order.update({
        where: { id: order.id },
        data: { orderStatus: "ABNORMAL", cancelledAt: new Date() },
      });
    } else {
      await tx.order.update({
        where: { id: order.id },
        data: { proofRequested: true },
      });
    }

    await tx.auditLog.create({
      data: {
        adminId,
        action: abnormal ? "REJECT_PROOF_ABNORMAL" : "REJECT_PAYMENT_PROOF",
        entityType: "order",
        entityId: order.id,
        metadata: { rejectCount, note: trimmedNote },
      },
    });
    return { rejectCount, abnormal, imagePaths: order.paymentProofs.map((proof) => proof.imagePath) };
  });
  return result;
}
