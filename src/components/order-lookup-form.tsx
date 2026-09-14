"use client";

import { useState } from "react";
import { ArrowRight, LoaderCircle, Search } from "lucide-react";
import { OrderStatusCard } from "@/components/order-status-card";
import type { PublicOrder } from "@/lib/public-order";
import { orderStatusLabels, statusLabel } from "@/lib/status-labels";
import { formatMoney } from "@/lib/utils";

export function OrderLookupForm({ locale }: { locale: "zh" | "en" }) {
  const [identifier, setIdentifier] = useState("");
  const [queryPassword, setQueryPassword] = useState("");
  const [orders, setOrders] = useState<PublicOrder[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadOrders(keepExpanded = expanded) {
    const response = await fetch("/api/orders/lookup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier, queryPassword }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "查询失败");
    const nextOrders = body.orders as PublicOrder[];
    setOrders(nextOrders);
    for (const order of nextOrders) sessionStorage.setItem(`order-password:${order.orderNo}`, queryPassword);
    if (keepExpanded && !nextOrders.some((order) => order.orderNo === keepExpanded)) {
      setExpanded(null);
    }
    return nextOrders;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setOrders([]);
    setExpanded(null);
    try {
      await loadOrders(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "查询失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <form onSubmit={submit} className="card p-7">
        <div>
          <label className="label" htmlFor="identifier">{locale === "zh" ? "订单号或联系方式" : "Order number or contact"}</label>
          <input id="identifier" className="field" required minLength={3} value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder={locale === "zh" ? "订单号 / QQ / 微信 / 手机号 / Telegram" : "Order number / contact"} />
        </div>
        <div className="mt-4">
          <label className="label" htmlFor="lookupPassword">{locale === "zh" ? "查询密码" : "Lookup password"}</label>
          <input id="lookupPassword" className="field" type="text" required minLength={6} autoComplete="off" spellCheck={false} value={queryPassword} onChange={(event) => setQueryPassword(event.target.value)} placeholder={locale === "zh" ? "下单时设置的至少 6 位密码" : "Password created at checkout"} />
        </div>
        {error && <p className="mt-4 rounded-xl bg-rose-400/10 p-3 text-sm text-rose-300">{error}</p>}
        <button className="button-primary mt-5 w-full" disabled={loading}>
          {loading ? <LoaderCircle size={16} className="animate-spin" /> : <Search size={16} />}
          {loading ? (locale === "zh" ? "正在查询" : "Searching") : (locale === "zh" ? "查询订单" : "Find orders")}
        </button>
        <p className="mt-4 text-center text-xs leading-5 text-slate-500">{locale === "zh" ? "无论使用订单号还是联系方式，都必须输入查询密码。" : "A lookup password is required for both lookup methods."}</p>
      </form>

      {orders.length > 0 && (
        <div className="mt-5 space-y-3">
          {orders.map((order) => (
            <div key={order.orderNo} className="card overflow-hidden">
              <button
                type="button"
                onClick={() => setExpanded(expanded === order.orderNo ? null : order.orderNo)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left hover:bg-white/[0.02]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{locale === "zh" ? order.items[0]?.productNameZh : order.items[0]?.productNameEn}</span>
                  <span className="mt-1 block font-mono text-xs text-slate-500">{order.orderNo}</span>
                  <span className="mt-2 inline-flex rounded-full bg-sky-400/8 px-2.5 py-1 text-xs text-sky-300">{statusLabel(orderStatusLabels, order.orderStatus, locale)}</span>
                </span>
                <span className="shrink-0 text-right">
                  <strong className="block">{formatMoney(order.totalMinor, order.currency, locale)}</strong>
                  <ArrowRight size={16} className={`mt-3 ml-auto text-slate-500 transition ${expanded === order.orderNo ? "rotate-90" : ""}`} />
                </span>
              </button>
              {expanded === order.orderNo && (
                <div className="border-t border-white/8 p-5">
                  <OrderStatusCard
                    order={order}
                    queryPassword={queryPassword}
                    locale={locale}
                    onRefresh={async () => {
                      const nextOrders = await loadOrders(order.orderNo);
                      const next = nextOrders.find((item) => item.orderNo === order.orderNo);
                      if (!next) throw new Error(locale === "zh" ? "订单不存在或无法刷新" : "Order not found");
                      return next;
                    }}
                    onProofsUploaded={(proofs) => setOrders((current) => current.map((item) => item.orderNo === order.orderNo ? { ...item, proofs, canUploadProof: false } : item))}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
