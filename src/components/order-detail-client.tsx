"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { CopyOrderNo } from "@/components/copy-order-no";
import { OrderStatusCard } from "@/components/order-status-card";
import type { PublicOrder } from "@/lib/public-order";

export function OrderDetailClient({ orderNo, locale }: { orderNo: string; locale: "zh" | "en" }) {
  const [password, setPassword] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem(`order-password:${orderNo}`) ?? "";
    Promise.resolve(saved).then(setPassword);
  }, [orderNo]);

  async function fetchOrder(queryPassword: string) {
    const response = await fetch("/api/orders/lookup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier: orderNo, queryPassword }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "查询失败");
    const next = body.orders[0] as PublicOrder | undefined;
    if (!next) throw new Error("查询失败");
    setOrder(next);
    setError("");
    return next;
  }

  useEffect(() => {
    if (!password) return;
    setLoading(true);
    fetchOrder(password)
      .catch((err) => setError(err instanceof Error ? err.message : "查询失败"))
      .finally(() => setLoading(false));
  }, [orderNo, password]);

  function unlock(event: React.FormEvent) {
    event.preventDefault();
    sessionStorage.setItem(`order-password:${orderNo}`, passwordInput);
    setPassword(passwordInput);
  }

  if (!password) {
    return (
      <form onSubmit={unlock} className="card mx-auto max-w-lg p-7">
        <h1 className="text-xl font-semibold">{locale === "zh" ? "查看订单" : "View order"}</h1>
        <div className="mt-3">
          <CopyOrderNo orderNo={orderNo} locale={locale} size="sm" notice />
        </div>
        <input className="field mt-5" type="text" required minLength={6} autoComplete="off" spellCheck={false} value={passwordInput} onChange={(event) => setPasswordInput(event.target.value)} placeholder={locale === "zh" ? "请输入查询密码" : "Lookup password"} />
        <button className="button-primary mt-4 w-full">{locale === "zh" ? "验证并查看" : "Verify and view"}</button>
      </form>
    );
  }

  if (loading && !order) return <div className="flex justify-center py-20 text-slate-400"><LoaderCircle className="animate-spin" /></div>;
  if (error) return <div className="card mx-auto max-w-lg p-8 text-center text-sm text-rose-300">{error}</div>;
  if (!order) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <OrderStatusCard
        order={order}
        queryPassword={password}
        locale={locale}
        onRefresh={() => fetchOrder(password)}
        onProofsUploaded={(proofs) => setOrder({ ...order, proofs, canUploadProof: false })}
      />
    </div>
  );
}
