import { MAX_PROOF_REJECTIONS } from "@/lib/proofs";
import { paymentMethodLabels, statusLabel } from "@/lib/status-labels";

type LookupOrder = {
  orderNo: string;
  contact: string;
  currency: string;
  totalMinor: number;
  orderStatus: string;
  paymentStatus: string;
  deliveryStatus: string;
  proofRequested: boolean;
  expiresAt: Date;
  paidAt: Date | null;
  createdAt: Date;
  items: Array<{
    productNameZh: string;
    productNameEn: string;
    variantNameZh: string;
    variantNameEn: string;
    totalMinor: number;
    deliveryType: string;
    product?: { slug: string } | null;
  }>;
  payments: Array<{ provider: string; submittedAt: Date | null }>;
  paymentProofs: Array<{ id: string; imagePath: string; createdAt: Date }>;
  proofRejections: Array<{ id: string; note: string | null; createdAt: Date }>;
  deliveryRecords: Array<{ id: string; type: string; content: string; deliveredAt: Date | null }>;
};

export type PublicOrder = {
  orderNo: string;
  contact: string;
  currency: string;
  totalMinor: number;
  orderStatus: string;
  paymentStatus: string;
  deliveryStatus: string;
  expiresAt: string;
  paidAt: string | null;
  createdAt: string;
  paymentMethod: string | null;
  paymentMethodLabel: string;
  submittedAt: string | null;
  proofRequested: boolean;
  productSlug: string;
  deliveryType: string;
  proofs: Array<{ id: string; url: string; createdAt: string }>;
  proofRejections: Array<{ id: string; note: string | null; createdAt: string }>;
  proofRejectCount: number;
  canUploadProof: boolean;
  items: Array<{
    productNameZh: string;
    productNameEn: string;
    variantNameZh: string;
    variantNameEn: string;
    totalMinor: number;
  }>;
  deliveries: Array<{ id: string; type: string; content: string; deliveredAt: string | null }>;
};

export function serializePublicOrder(order: LookupOrder): PublicOrder {
  const payment = order.payments[0];
  const proofRejectCount = order.proofRejections.length;
  return {
    orderNo: order.orderNo,
    contact: order.contact,
    currency: order.currency,
    totalMinor: order.totalMinor,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    deliveryStatus: order.deliveryStatus,
    expiresAt: order.expiresAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    paymentMethod: payment?.provider ?? null,
    paymentMethodLabel: payment ? statusLabel(paymentMethodLabels, payment.provider) : "—",
    submittedAt: payment?.submittedAt?.toISOString() ?? null,
    proofRequested: order.proofRequested,
    productSlug: order.items[0]?.product?.slug ?? "",
    deliveryType: order.items[0]?.deliveryType ?? "",
    proofs: order.paymentProofs.map((proof) => ({
      id: proof.id,
      url: proof.imagePath,
      createdAt: proof.createdAt.toISOString(),
    })),
    proofRejections: order.proofRejections.map((item) => ({
      id: item.id,
      note: item.note,
      createdAt: item.createdAt.toISOString(),
    })),
    proofRejectCount,
    canUploadProof:
      order.orderStatus === "PAYMENT_REVIEW"
      && order.proofRequested
      && order.paymentProofs.length === 0
      && proofRejectCount < MAX_PROOF_REJECTIONS,
    items: order.items.map((item) => ({
      productNameZh: item.productNameZh,
      productNameEn: item.productNameEn,
      variantNameZh: item.variantNameZh,
      variantNameEn: item.variantNameEn,
      totalMinor: item.totalMinor,
    })),
    deliveries: order.deliveryRecords.map((record) => ({
      id: record.id,
      type: record.type,
      content: record.content,
      deliveredAt: record.deliveredAt?.toISOString() ?? null,
    })),
  };
}
