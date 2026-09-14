import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, Clock3, PackageCheck, RotateCcw } from "lucide-react";
import { CheckoutForm } from "@/components/checkout-form";
import { ProductMark } from "@/components/product-mark";
import { StoreShell } from "@/components/store-shell";
import { db } from "@/lib/db";
import { resolveStorePrice } from "@/lib/fx";
import { getUsdCnyRate } from "@/lib/fx-server";
import { getPreferences } from "@/lib/preferences";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await db.product.findUnique({ where: { slug }, select: { nameZh: true, shortDescZh: true } });
  return product ? { title: product.nameZh, description: product.shortDescZh } : { title: "商品不存在" };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [{ locale, currency }, usdCnyRate] = await Promise.all([getPreferences(), getUsdCnyRate()]);
  const product = await db.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      category: true,
      variants: {
        where: { status: "ACTIVE" },
        orderBy: { sort: "asc" },
        include: {
          prices: { where: { active: true } },
          _count: { select: { inventoryItems: { where: { status: "AVAILABLE" } } } },
        },
      },
    },
  });
  if (!product) notFound();

  const variants = product.variants.map((variant) => ({
    id: variant.id,
    name: locale === "zh" ? variant.nameZh : variant.nameEn,
    stockMode: variant.stockMode,
    stock: variant.stockMode === "INVENTORY" ? variant._count.inventoryItems : null,
    price: resolveStorePrice(variant.prices, currency, usdCnyRate),
  }));

  return (
    <StoreShell>
      <section className="container-shell py-12">
        <div className="text-xs text-slate-500">
          {locale === "zh" ? product.category.nameZh : product.category.nameEn} / {locale === "zh" ? product.nameZh : product.nameEn}
        </div>
        <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_420px]">
          <div>
            <div className="flex items-start gap-5">
              <ProductMark
                src={product.image}
                alt={locale === "zh" ? product.nameZh : product.nameEn}
                size="lg"
              />
              <div>
                {product.badge && <span className="rounded-full bg-sky-400/10 px-2.5 py-1 text-[11px] text-sky-300">{product.badge}</span>}
                <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{locale === "zh" ? product.nameZh : product.nameEn}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">{locale === "zh" ? product.shortDescZh : product.shortDescEn}</p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 overflow-hidden rounded-2xl border border-white/8 bg-white/3">
              {[
                [BadgeCheck, locale === "zh" ? "透明价格" : "Clear price"],
                [PackageCheck, locale === "zh" ? "清晰交付" : "Clear delivery"],
                [Clock3, locale === "zh" ? "订单可查" : "Trackable"],
              ].map(([Icon, label]) => {
                const ItemIcon = Icon as typeof BadgeCheck;
                return <div key={String(label)} className="flex flex-col items-center gap-2 border-r border-white/8 p-4 text-center text-xs text-slate-400 last:border-0"><ItemIcon size={17} className="text-sky-300" />{String(label)}</div>;
              })}
            </div>

            <div className="mt-10 space-y-8">
              <section>
                <h2 className="text-lg font-semibold">{locale === "zh" ? "服务介绍" : "Description"}</h2>
                <div className="prose-copy mt-4 text-sm">{locale === "zh" ? product.descriptionZh : product.descriptionEn}</div>
              </section>
              <section className="card p-6">
                <h2 className="flex items-center gap-2 text-base font-semibold"><PackageCheck size={17} className="text-sky-300" />{locale === "zh" ? "购买须知" : "Purchase notice"}</h2>
                <div className="prose-copy mt-3 text-sm">{locale === "zh" ? product.purchaseNotice : (product.purchaseNoticeEn || product.purchaseNotice)}</div>
              </section>
              <section className="card p-6">
                <h2 className="flex items-center gap-2 text-base font-semibold"><RotateCcw size={17} className="text-sky-300" />{locale === "zh" ? "售后说明" : "After-sales"}</h2>
                <div className="prose-copy mt-3 text-sm">{locale === "zh" ? product.afterSale : (product.afterSaleEn || product.afterSale)}</div>
              </section>
            </div>
          </div>
          <CheckoutForm variants={variants} locale={locale} currency={currency} />
        </div>
      </section>
    </StoreShell>
  );
}
