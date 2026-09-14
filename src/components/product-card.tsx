import Link from "next/link";
import { ArrowUpRight, Box } from "lucide-react";
import { ProductMark } from "@/components/product-mark";
import { resolveStorePrice } from "@/lib/fx";
import type { Currency, Locale } from "@/lib/preferences";
import { copy } from "@/lib/preferences";
import { formatMoney } from "@/lib/utils";

export type StoreProduct = {
  id: string;
  slug: string;
  nameZh: string;
  nameEn: string;
  shortDescZh: string;
  shortDescEn: string;
  image: string | null;
  badge: string | null;
  variants: Array<{
    id: string;
    nameZh: string;
    nameEn: string;
    stockMode: string;
    prices: Array<{ currency: string; amountMinor: number }>;
    _count?: { inventoryItems: number };
  }>;
};

export function ProductCard({
  product,
  locale,
  currency,
  usdCnyRate,
}: {
  product: StoreProduct;
  locale: Locale;
  currency: Currency;
  usdCnyRate: number;
}) {
  const t = copy[locale];
  const variant = product.variants[0];
  const price = variant ? resolveStorePrice(variant.prices, currency, usdCnyRate) : null;
  const stock = variant?.stockMode === "INVENTORY" ? variant._count?.inventoryItems ?? 0 : null;

  return (
    <article className="card group flex min-h-72 flex-col p-6 transition hover:-translate-y-1 hover:border-sky-400/30 sm:min-h-[19rem]">
      <div className="flex items-start justify-between gap-3">
        <ProductMark src={product.image} alt={locale === "zh" ? product.nameZh : product.nameEn} />
        {product.badge && (
          <span className="rounded-full bg-sky-400/10 px-2.5 py-1 text-[11px] font-medium text-sky-300">
            {product.badge}
          </span>
        )}
      </div>
      <h3 className="mt-6 text-lg font-semibold leading-6 text-slate-100">
        {locale === "zh" ? product.nameZh : product.nameEn}
      </h3>
      <p className="mt-2.5 line-clamp-2 text-[15px] leading-6 text-slate-400">
        {locale === "zh" ? product.shortDescZh : product.shortDescEn}
      </p>
      <div className="mt-auto flex items-end justify-between gap-3 pt-6">
        <div>
          <p className="text-sm text-slate-500">{variant ? (locale === "zh" ? variant.nameZh : variant.nameEn) : "—"}</p>
          <p className="mt-1.5 text-2xl font-semibold text-white">
            {price ? formatMoney(price.amountMinor, price.currency, locale) : "—"}
          </p>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
            <Box size={11} />
            {stock === null ? t.available : `${t.stock} ${stock}`}
          </p>
        </div>
        <Link
          href={`/products/${product.slug}`}
          aria-label={`${t.buy} ${locale === "zh" ? product.nameZh : product.nameEn}`}
          className="flex size-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition group-hover:border-sky-400/40 group-hover:bg-sky-400 group-hover:text-slate-950"
        >
          <ArrowUpRight size={17} />
        </Link>
      </div>
    </article>
  );
}
