"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CircleDollarSign, ImageIcon, PackageCheck, RotateCcw, X } from "lucide-react";
import { MAX_PROOF_REJECTIONS, proofSrc } from "@/lib/proofs";
import { formatMoney } from "@/lib/utils";
import {
  deliveryStatusLabels, orderStatusLabels, paymentMethodLabels, paymentStatusLabels, statusLabel,
} from "@/lib/status-labels";
import { AdminPagination } from "@/components/admin-pagination";
import { useAdminToast } from "@/components/admin-toast";

type OrderRow = {
  id: string;
  orderNo: string;
  contact: string;
  currency: string;
  totalMinor: number;
  orderStatus: string;
  paymentStatus: string;
  deliveryStatus: string;
  proofRequested: boolean;
  expiresAt: Date;
  createdAt: Date;
  items: Array<{ productNameZh: string; variantNameZh: string; deliveryType: string }>;
  payments: Array<{ provider: string; status: string; submittedAt: Date | null }>;
  paymentProofs: Array<{ id: string; imagePath: string; createdAt: Date }>;
  proofRejections: Array<{ id: string; note: string | null; createdAt: Date }>;
};

export function AdminOrderManager({ orders, page, total, totalPages }: { orders: OrderRow[]; page: number; total: number; totalPages: number }) {
  const router = useRouter();
  const toast = useAdminToast();
  const [active, setActive] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [preview, setPreview] = useState<OrderRow | null>(null);
  const [content, setContent] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [error, setError] = useState("");

  async function deliver(id: string) {
    const response = await fetch(`/api/admin/orders/${id}/deliver`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "交付失败");
      toast.error(body.error ?? "交付失败");
      return;
    }
    setActive(null);
    setContent("");
    toast.success("已完成交付");
    router.refresh();
  }

  async function confirmPayment(id: string) {
    const response = await fetch(`/api/admin/orders/${id}/confirm-payment`, { method: "POST" });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "确认失败");
      toast.error(body.error ?? "确认失败");
      return;
    }
    setError("");
    setPreview(null);
    toast.success("已确认到账");
    router.refresh();
  }

  async function requestProof(id: string) {
    const response = await fetch(`/api/admin/orders/${id}/request-proof`, { method: "POST" });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "操作失败");
      toast.error(body.error ?? "操作失败");
      return;
    }
    setError("");
    toast.success("已要求用户上传凭证");
    router.refresh();
  }

  async function rejectProof(id: string) {
    const response = await fetch(`/api/admin/orders/${id}/reject-proof`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ note: rejectNote.trim() || undefined }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "驳回失败");
      toast.error(body.error ?? "驳回失败");
      return;
    }
    setRejecting(null);
    setRejectNote("");
    setPreview(null);
    setError("");
    toast.success("已驳回凭证");
    router.refresh();
  }

  return (
    <div>
      <div className="card overflow-x-auto">
      <table className="w-full min-w-[1280px] text-center text-sm [&_td]:px-3 [&_td]:py-2.5 [&_th]:px-3 [&_th]:py-2.5">
        <thead className="bg-white/[0.025] text-xs text-slate-500">
          <tr>
            <th className="text-left">订单</th>
            <th className="text-left">商品</th>
            <th className="text-left">联系方式</th>
            <th>金额</th>
            <th>支付方式</th>
            <th>支付状态</th>
            <th>订单状态 / 有效期</th>
            <th>是否已交付</th>
            <th>凭证</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const deliveryLabel = statusLabel(deliveryStatusLabels, order.deliveryStatus);
            const delivered = order.deliveryStatus === "DELIVERED";
            const rejectCount = order.proofRejections.length;
            return (
            <tr key={order.id} className="border-t border-white/8 align-middle transition hover:bg-white/[0.025]">
              <td className="text-left"><span className="font-mono text-xs">{order.orderNo}</span><span className="mt-1 block text-[11px] text-slate-600">{new Date(order.createdAt).toLocaleString("zh-CN")}</span></td>
              <td className="text-left">
                <strong className="block">{order.items[0]?.productNameZh}</strong>
                <span className="mt-1 block text-xs text-slate-500">{order.items[0]?.variantNameZh}</span>
                {order.items[0]?.deliveryType === "MANUAL" && <span className="mt-1 inline-flex rounded-full bg-amber-400/10 px-2 py-0.5 text-[11px] text-amber-200">人工套餐</span>}
              </td>
              <td className="max-w-48 break-all text-left text-slate-400">{order.contact}</td>
              <td>{formatMoney(order.totalMinor, order.currency)}</td>
              <td className="text-slate-300">{order.payments[0] ? statusLabel(paymentMethodLabels, order.payments[0].provider) : "—"}</td>
              <td><span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${order.paymentStatus === "PAID" ? "bg-emerald-400/10 text-emerald-300" : "bg-white/5 text-slate-400"}`}>{statusLabel(paymentStatusLabels, order.paymentStatus)}</span></td>
              <td>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${order.orderStatus === "ABNORMAL" ? "bg-rose-400/10 text-rose-300" : "bg-sky-400/10 text-sky-300"}`}>{statusLabel(orderStatusLabels, order.orderStatus)}</span>
                <span className="mt-1.5 block text-[11px] text-slate-600">
                  {order.orderStatus === "PAYMENT_REVIEW"
                    ? `提交于 ${order.payments[0]?.submittedAt ? new Date(order.payments[0].submittedAt).toLocaleString("zh-CN") : "—"}`
                    : order.orderStatus === "ABNORMAL"
                      ? `已驳回 ${rejectCount} 次`
                      : `有效至 ${new Date(order.expiresAt).toLocaleString("zh-CN")}`}
                </span>
              </td>
              <td>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${delivered ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-200"}`}>{deliveryLabel}</span>
              </td>
              <td>
                {order.paymentProofs.length ? (
                  <button onClick={() => setPreview(order)} className="inline-flex items-center gap-1 text-xs text-sky-300">
                    <ImageIcon size={14} />{order.paymentProofs.length} 张
                  </button>
                ) : rejectCount ? <span className="text-xs text-amber-200">已驳回 {rejectCount} 次</span> : order.proofRequested ? <span className="text-xs text-amber-200">已要求</span> : <span className="text-xs text-slate-600">—</span>}
              </td>
              <td>
                {active === order.id ? (
                  <div className="mx-auto w-64 space-y-2 text-left">
                    <textarea autoFocus className="field min-h-20 text-left text-xs" rows={3} value={content} onChange={(e) => setContent(e.target.value)} placeholder="填写人工交付结果" />
                    {error && <p className="text-xs text-rose-300">{error}</p>}
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => setActive(null)} className="button-secondary button-compact">取消</button>
                      <button onClick={() => deliver(order.id)} className="button-primary button-compact">完成交付</button>
                    </div>
                  </div>
                ) : rejecting === order.id ? (
                  <div className="mx-auto w-64 space-y-2 text-left">
                    <p className="text-xs text-amber-200">
                      将清除当前凭证并记为第 {rejectCount + 1} 次驳回
                      {rejectCount + 1 >= MAX_PROOF_REJECTIONS ? "，订单将标记为异常。" : "，用户可重新上传。"}
                    </p>
                    <textarea className="field min-h-16 text-left text-xs" rows={2} value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="可选：告诉用户为什么被驳回" />
                    {error && <p className="text-xs text-rose-300">{error}</p>}
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => { setRejecting(null); setRejectNote(""); }} className="button-secondary button-compact">取消</button>
                      <button onClick={() => rejectProof(order.id)} className="button-primary button-compact">确认驳回</button>
                    </div>
                  </div>
                ) : order.orderStatus === "PAYMENT_REVIEW" ? (
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <button onClick={() => confirmPayment(order.id)} className="button-primary button-compact"><CircleDollarSign size={13} />确认到账</button>
                    {order.paymentProofs.length > 0 && (
                      <>
                        <button onClick={() => setPreview(order)} className="button-secondary button-compact"><ImageIcon size={13} />查看凭证</button>
                        <button onClick={() => { setRejecting(order.id); setError(""); }} className="button-secondary button-compact"><RotateCcw size={13} />驳回凭证</button>
                      </>
                    )}
                    {!order.proofRequested && <button onClick={() => requestProof(order.id)} className="button-secondary button-compact">要求凭证</button>}
                  </div>
                ) : order.orderStatus === "PROCESSING" ? (
                  <div className="flex justify-end">
                    <button onClick={() => setActive(order.id)} className="button-secondary button-compact"><PackageCheck size={13} />处理交付</button>
                  </div>
                ) : <span className="text-xs text-slate-600">—</span>}
              </td>
            </tr>
            );
          })}
          {!orders.length && <tr><td colSpan={10} className="py-14 text-center text-sm text-slate-500">没有找到符合条件的订单</td></tr>}
        </tbody>
      </table>
      </div>
      <AdminPagination page={page} totalPages={totalPages} total={total} label="笔订单" />

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5" onClick={() => setPreview(null)}>
          <div className="card max-h-[90vh] w-full max-w-3xl overflow-auto p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500">对照账单后确认或驳回</p>
                <h3 className="mt-1 font-mono text-lg">{preview.orderNo}</h3>
                <p className="mt-2 text-sm text-slate-400">{formatMoney(preview.totalMinor, preview.currency)} · {statusLabel(paymentMethodLabels, preview.payments[0]?.provider ?? "")}</p>
                {preview.proofRejections.length > 0 && <p className="mt-1 text-xs text-amber-200">此前已驳回 {preview.proofRejections.length} 次</p>}
              </div>
              <button onClick={() => setPreview(null)} className="button-secondary button-compact" aria-label="关闭"><X size={14} /></button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {preview.paymentProofs.map((proof) => (
                <a key={proof.id} href={proofSrc(proof.imagePath)} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                  <img src={proofSrc(proof.imagePath)} alt="支付凭证" className="h-auto w-full object-contain" />
                </a>
              ))}
            </div>
            {preview.orderStatus === "PAYMENT_REVIEW" && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button onClick={() => confirmPayment(preview.id)} className="button-primary button-compact w-full"><CircleDollarSign size={14} />确认到账</button>
                <button onClick={() => { setRejecting(preview.id); setPreview(null); }} className="button-secondary button-compact w-full"><RotateCcw size={14} />驳回凭证</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
