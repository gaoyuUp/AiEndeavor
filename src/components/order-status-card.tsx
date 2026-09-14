"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, PackageCheck, RefreshCw } from "lucide-react";
import { PaymentProofUploader } from "@/components/payment-proof-uploader";
import type { PublicOrder } from "@/lib/public-order";
import { deliveryStatusLabels, paymentMethodLabels, paymentStatusLabels, statusLabel } from "@/lib/status-labels";
import { CopyOrderNo } from "@/components/copy-order-no";
import { formatMoney } from "@/lib/utils";

const statusText: Record<string, [string, string]> = {
  PENDING_PAYMENT: ["待支付", "Awaiting payment"],
  PAYMENT_REVIEW: ["待确认收款", "Payment review"],
  PAID: ["已支付", "Paid"],
  PROCESSING: ["充值/交付中", "Processing"],
  COMPLETED: ["已完成", "Completed"],
  EXPIRED: ["已失效", "Expired"],
  CANCELLED: ["已取消", "Cancelled"],
  REFUNDED: ["已退款", "Refunded"],
  ABNORMAL: ["异常订单", "Abnormal"],
};

function orderFingerprint(order: PublicOrder) {
  return [
    order.orderStatus,
    order.paymentStatus,
    order.deliveryStatus,
    order.proofRequested,
    order.canUploadProof,
    order.proofs.length,
    order.proofRejections.length,
    order.deliveries.length,
    order.paidAt,
    order.submittedAt,
  ].join("|");
}

export function OrderStatusCard({
  order,
  queryPassword,
  locale,
  onRefresh,
  onProofsUploaded,
}: {
  order: PublicOrder;
  queryPassword: string;
  locale: "zh" | "en";
  onRefresh: () => Promise<PublicOrder>;
  onProofsUploaded: (proofs: PublicOrder["proofs"]) => void;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshHint, setRefreshHint] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const status = statusText[order.orderStatus] ?? [order.orderStatus, order.orderStatus];
  const showProofPanel = order.proofRequested || order.proofs.length > 0 || order.proofRejections.length > 0;
  const reorderHref = order.productSlug ? `/products/${order.productSlug}` : "/products";

  async function refresh() {
    if (refreshing) return;
    setRefreshing(true);
    setRefreshHint(null);
    try {
      const next = await onRefresh();
      const changed = orderFingerprint(next) !== orderFingerprint(order);
      setRefreshHint({
        kind: "ok",
        text: locale === "zh"
          ? (changed ? "已刷新，订单状态已更新" : "已刷新，当前状态无变化")
          : (changed ? "Refreshed. The order status changed." : "Refreshed. No status change."),
      });
    } catch (err) {
      setRefreshHint({
        kind: "error",
        text: err instanceof Error
          ? err.message
          : (locale === "zh" ? "刷新失败，请稍后重试" : "Refresh failed. Please try again."),
      });
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-sky-400">{locale === "zh" ? "订单详情" : "Order details"}</p>
          <div className="mt-3">
            <CopyOrderNo orderNo={order.orderNo} locale={locale} notice />
          </div>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/8 px-3 py-1.5 text-xs text-sky-300">
          {order.orderStatus === "COMPLETED" ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}
          {locale === "zh" ? status[0] : status[1]}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [locale === "zh" ? "支付方式" : "Payment", order.paymentMethod ? statusLabel(paymentMethodLabels, order.paymentMethod, locale) : "—"],
          [locale === "zh" ? "支付状态" : "Payment status", statusLabel(paymentStatusLabels, order.paymentStatus, locale)],
          [locale === "zh" ? "交付状态" : "Delivery status", statusLabel(deliveryStatusLabels, order.deliveryStatus, locale)],
          [locale === "zh" ? "联系方式" : "Contact", order.contact],
        ].map(([label, value]) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-2 truncate text-sm">{value}</p>
          </div>
        ))}
      </div>

      <div className="card mt-5 overflow-hidden">
        {order.items.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-5 border-b border-white/8 p-5">
            <div>
              <strong className="text-sm">{locale === "zh" ? item.productNameZh : item.productNameEn}</strong>
              <p className="mt-1 text-xs text-slate-500">{locale === "zh" ? item.variantNameZh : item.variantNameEn}</p>
            </div>
            <strong>{formatMoney(item.totalMinor, order.currency, locale)}</strong>
          </div>
        ))}
        <div className="flex justify-between bg-white/2 p-5">
          <span className="text-sm text-slate-400">{locale === "zh" ? "订单总额" : "Total"}</span>
          <strong className="text-xl">{formatMoney(order.totalMinor, order.currency, locale)}</strong>
        </div>
      </div>

      {order.deliveries.length > 0 && (
        <section className="mt-7">
          <h3 className="flex items-center gap-2 text-lg font-semibold"><PackageCheck size={19} className="text-sky-300" />{locale === "zh" ? "交付内容" : "Delivery"}</h3>
          {order.deliveries.map((delivery) => <pre key={delivery.id} className="card mt-3 overflow-auto whitespace-pre-wrap break-all p-5 text-sm leading-6 text-sky-100">{delivery.content}</pre>)}
        </section>
      )}

      {order.orderStatus === "PAYMENT_REVIEW" && (
        <p className="notice-warning mt-5 rounded-xl p-5 text-sm">
          {locale === "zh" ? "付款已提交，正在等待管理员人工核对。该订单不会因超时失效。" : "Payment submitted and awaiting confirmation. This order will not expire."}
        </p>
      )}
      {order.orderStatus === "PROCESSING" && (
        <p className="notice-info mt-5 rounded-xl p-5 text-sm">
          {locale === "zh" ? "付款已确认，订单正在充值或人工交付中。" : "Payment confirmed. Fulfillment is in progress."}
        </p>
      )}
      {order.orderStatus === "EXPIRED" && (
        <div className="notice-danger mt-5 rounded-xl p-5">
          <p className="text-sm">{locale === "zh" ? "支付已超时，请重新下单。" : "Payment expired. Please reorder."}</p>
          <Link href={reorderHref} className="button-primary mt-4">{locale === "zh" ? "返回商品重新下单" : "Reorder this product"}</Link>
        </div>
      )}
      {order.orderStatus === "ABNORMAL" && (
        <div className="notice-danger mt-5 rounded-xl p-5">
          <p className="text-sm">{locale === "zh" ? "当前订单已标记为异常，无法继续操作支付凭证。请联系售后处理。" : "This order is marked abnormal and can no longer be updated. Please contact support."}</p>
          <Link href={`/support?orderNo=${order.orderNo}`} className="button-primary mt-4">{locale === "zh" ? "联系售后" : "Contact support"}</Link>
        </div>
      )}

      {showProofPanel && (
        <PaymentProofUploader
          orderNo={order.orderNo}
          queryPassword={queryPassword}
          proofs={order.proofs}
          rejections={order.proofRejections}
          canUpload={order.canUploadProof}
          orderStatus={order.orderStatus}
          locale={locale}
          onUploaded={onProofsUploaded}
        />
      )}

      {order.orderStatus === "PENDING_PAYMENT" && <Link href={`/pay/${order.orderNo}`} className="button-primary mt-5 w-full">{locale === "zh" ? "继续支付" : "Continue payment"}</Link>}
      {refreshHint ? (
        <p
          role="status"
          className={`mt-4 rounded-xl px-4 py-3 text-center text-sm ${refreshHint.kind === "ok" ? "notice-info" : "notice-danger"}`}
        >
          {refreshHint.text}
        </p>
      ) : null}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <button type="button" onClick={() => void refresh()} disabled={refreshing} className="button-secondary disabled:opacity-60">
          {refreshing ? (
            <RefreshCw size={15} className="animate-spin" />
          ) : refreshHint?.kind === "ok" ? (
            <CheckCircle2 size={15} className="text-sky-300" />
          ) : (
            <RefreshCw size={15} />
          )}
          {refreshing
            ? (locale === "zh" ? "正在刷新" : "Refreshing")
            : refreshHint?.kind === "ok"
              ? (locale === "zh" ? "已刷新" : "Refreshed")
              : (locale === "zh" ? "刷新状态" : "Refresh")}
        </button>
        <Link href={`/support?orderNo=${order.orderNo}`} className="button-secondary">{locale === "zh" ? "售后帮助" : "Support"}</Link>
      </div>
    </div>
  );
}
