import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { OrderLookupForm } from "@/components/order-lookup-form";
import { StoreShell } from "@/components/store-shell";
import { getPreferences } from "@/lib/preferences";

export const metadata: Metadata = { title: "查询订单" };

export default async function LookupPage() {
  const { locale } = await getPreferences();
  return (
    <StoreShell>
      <section className="container-shell py-16">
        <div className="mx-auto mb-8 max-w-lg text-center">
          <KeyRound size={26} className="mx-auto text-sky-300" />
          <h1 className="mt-4 text-3xl font-semibold">{locale === "zh" ? "查询我的订单" : "Find my order"}</h1>
          <p className="mt-3 text-sm text-slate-400">{locale === "zh" ? "使用订单号或联系方式，加上查询密码查看充值与交付状态。" : "Use an order number or contact together with your lookup password."}</p>
        </div>
        <OrderLookupForm locale={locale} />
      </section>
    </StoreShell>
  );
}
