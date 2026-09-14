import type { Metadata } from "next";
import { LifeBuoy } from "lucide-react";
import { StoreShell } from "@/components/store-shell";
import { SupportForm } from "@/components/support-form";
import { getPreferences } from "@/lib/preferences";

export const metadata: Metadata = { title: "售后支持" };

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ orderNo?: string }> }) {
  const [{ locale }, { orderNo }] = await Promise.all([getPreferences(), searchParams]);
  return (
    <StoreShell>
      <section className="container-shell py-16">
        <div className="mx-auto mb-8 max-w-xl text-center">
          <LifeBuoy size={27} className="mx-auto text-sky-300" />
          <h1 className="mt-4 text-3xl font-semibold">{locale === "zh" ? "售后支持" : "Support"}</h1>
          <p className="mt-3 text-sm text-slate-400">{locale === "zh" ? "请填写订单号并描述问题。我们会通过邮箱与你联系。" : "Enter your order number and describe the issue. We will reply by email."}</p>
        </div>
        <SupportForm locale={locale} defaultOrderNo={orderNo} />
      </section>
    </StoreShell>
  );
}
