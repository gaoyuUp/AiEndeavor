import { StoreShell } from "@/components/store-shell";
import { PaymentPanel } from "@/components/payment-panel";
import { getPreferences } from "@/lib/preferences";

export default async function PayPage({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}) {
  const [{ orderNo }, { locale }] = await Promise.all([params, getPreferences()]);

  return (
    <StoreShell lockCurrency>
      <section className="container-shell py-16">
        <div className="mx-auto mb-8 max-w-lg text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-400">{locale === "zh" ? "安全支付" : "Secure payment"}</p>
          <h1 className="mt-3 text-3xl font-semibold">{locale === "zh" ? "确认你的订单" : "Confirm your order"}</h1>
        </div>
        <PaymentPanel orderNo={orderNo} locale={locale} />
      </section>
    </StoreShell>
  );
}
