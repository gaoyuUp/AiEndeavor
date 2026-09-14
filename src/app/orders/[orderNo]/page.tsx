import { OrderDetailClient } from "@/components/order-detail-client";
import { StoreShell } from "@/components/store-shell";
import { getPreferences } from "@/lib/preferences";

export default async function OrderPage({ params }: { params: Promise<{ orderNo: string }> }) {
  const [{ orderNo }, { locale }] = await Promise.all([params, getPreferences()]);
  return (
    <StoreShell>
      <section className="container-shell py-14">
        <OrderDetailClient orderNo={orderNo} locale={locale} />
      </section>
    </StoreShell>
  );
}
