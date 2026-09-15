import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { StoreShell } from "@/components/store-shell";
import { db } from "@/lib/db";
import { getUsdCnyRate } from "@/lib/fx-server";
import { getPreferences } from "@/lib/preferences";

export const metadata: Metadata = { title: "产品中心" };
export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const { locale, currency } = await getPreferences();
  const [products, categories, usdCnyRate] = await Promise.all([
    db.product.findMany({
      where: {
        status: "ACTIVE",
        ...(params.category ? { category: { slug: params.category } } : {}),
        ...(params.q
          ? {
              OR: [
                { nameZh: { contains: params.q } },
                { nameEn: { contains: params.q } },
                { shortDescZh: { contains: params.q } },
              ],
            }
          : {}),
      },
      include: {
        variants: {
          where: { status: "ACTIVE" },
          orderBy: { sort: "asc" },
          include: {
            prices: { where: { active: true } },
            _count: { select: { inventoryItems: { where: { status: "AVAILABLE" } } } },
          },
        },
      },
      orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
    }),
    db.category.findMany({ where: { status: "ACTIVE" }, orderBy: { sort: "asc" } }),
    getUsdCnyRate(),
  ]);

  return (
    <StoreShell>
      <section className="container-shell py-10 sm:py-14">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-400">
          {locale === "zh" ? "产品中心" : "Catalog"}
        </p>
        <div className="mt-3 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{locale === "zh" ? "找到适合你的 AI 服务" : "Find the right AI service"}</h1>
            <p className="mt-4 text-base text-slate-400">{locale === "zh" ? `共 ${products.length} 项可选服务` : `${products.length} services available`}</p>
          </div>
          <form className="relative w-full md:w-72">
            {params.category && <input type="hidden" name="category" value={params.category} />}
            <Search className="pointer-events-none absolute top-1/2 left-3.5 z-10 -translate-y-1/2 text-slate-500" size={16} />
            <input name="q" defaultValue={params.q} className="field search-field" placeholder={locale === "zh" ? "搜索商品..." : "Search products..."} />
          </form>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <Link href="/products" className={`rounded-full border px-4 py-2 text-xs ${!params.category ? "border-sky-400/40 bg-sky-400/10 text-sky-300" : "border-white/10 text-slate-400"}`}>
            {locale === "zh" ? "全部" : "All"}
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className={`rounded-full border px-4 py-2 text-xs ${params.category === category.slug ? "border-sky-400/40 bg-sky-400/10 text-sky-300" : "border-white/10 text-slate-400 hover:text-white"}`}
            >
              {locale === "zh" ? category.nameZh : category.nameEn}
            </Link>
          ))}
        </div>

        {products.length ? (
          <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
            {products.map((product) => <ProductCard key={product.id} product={product} locale={locale} currency={currency} usdCnyRate={usdCnyRate} />)}
          </div>
        ) : (
          <div className="card mt-8 py-20 text-center text-sm text-slate-400">
            {locale === "zh" ? "没有找到匹配的商品" : "No matching products"}
          </div>
        )}
      </section>
    </StoreShell>
  );
}
