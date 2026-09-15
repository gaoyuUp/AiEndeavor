import Link from "next/link";
import { ArrowRight, BadgeCheck, Headphones, PackageCheck, ShieldCheck, Zap } from "lucide-react";
import { AiPlatformNav } from "@/components/ai-platform-nav";
import { ProductCard } from "@/components/product-card";
import { StoreShell } from "@/components/store-shell";
import { db } from "@/lib/db";
import { copy, getPreferences } from "@/lib/preferences";
import { getUsdCnyRate } from "@/lib/fx-server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { locale, currency } = await getPreferences();
  const t = copy[locale];
  const [products, categories, announcements, usdCnyRate] = await Promise.all([
    db.product.findMany({
      where: { status: "ACTIVE", featured: true },
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
      take: 8,
    }),
    db.category.findMany({
      where: { status: "ACTIVE" },
      include: { _count: { select: { products: { where: { status: "ACTIVE" } } } } },
      orderBy: { sort: "asc" },
    }),
    db.announcement.findMany({ where: { status: "ACTIVE" }, orderBy: { sort: "asc" }, take: 1 }),
    getUsdCnyRate(),
  ]);

  return (
    <StoreShell>
      {announcements[0] && (
        <div className="border-b border-sky-400/10 bg-sky-400/6">
          <div className="container-shell flex min-h-11 items-center justify-center gap-2 py-2.5 text-center text-[13px] leading-5 text-sky-100">
            <Zap size={13} className="shrink-0 text-sky-300" />
            <span>{locale === "zh" ? announcements[0].contentZh : announcements[0].contentEn}</span>
          </div>
        </div>
      )}

      <section className="container-shell py-10 sm:py-12 lg:py-14">
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-xs text-slate-400">
            <BadgeCheck size={14} className="text-sky-300" />
            {locale === "zh" ? "清晰交付 · 无需注册" : "Clear delivery · No signup"}
          </div>
          <h1 className="max-w-4xl text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
            {locale === "zh" ? <>AI 服务，<span className="text-gradient">从这里开始</span></> : <>AI services, <span className="text-gradient">simplified</span></>}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">{t.heroSubtitle}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/products" className="button-primary">{t.browse}<ArrowRight size={16} /></Link>
            <Link href="/orders/lookup" className="button-secondary">{t.lookup}</Link>
          </div>
          <div className="mt-10 grid w-full max-w-3xl grid-cols-3 overflow-hidden rounded-2xl border border-white/8 bg-white/3 text-left sm:mt-12">
            {[
              [locale === "zh" ? "服务品类" : "Categories", `${categories.length}+`],
              [locale === "zh" ? "交付方式" : "Delivery types", "4"],
              [locale === "zh" ? "订单查询" : "Order lookup", "24/7"],
            ].map(([label, value]) => (
              <div key={label} className="border-r border-white/8 p-4 last:border-0 sm:p-6">
                <p className="text-xl font-semibold text-white sm:text-3xl">{value}</p>
                <p className="mt-1.5 text-[11px] text-slate-500 sm:text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <AiPlatformNav locale={locale} />
      </section>

      <section className="container-shell py-14 sm:py-16">
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-400">{t.featured}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{locale === "zh" ? "为你精选的 AI 服务" : "AI services picked for you"}</h2>
            <p className="mt-3 text-base text-slate-400">{t.featuredSub}</p>
          </div>
          <Link href="/products" className="hidden items-center gap-1 text-sm text-slate-300 hover:text-white sm:flex">
            {t.allProducts}<ArrowRight size={15} />
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
          {products.map((product) => <ProductCard key={product.id} product={product} locale={locale} currency={currency} usdCnyRate={usdCnyRate} />)}
        </div>
      </section>

      <section className="container-shell py-14 sm:py-16">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-400">{t.categories}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <Link key={category.id} href={`/products?category=${category.slug}`} className="card flex items-center gap-5 p-6 hover:border-sky-400/30">
              <span className="flex size-12 items-center justify-center rounded-xl bg-white/5 text-sm font-semibold text-sky-300">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>
                <strong className="block text-base">{locale === "zh" ? category.nameZh : category.nameEn}</strong>
                <span className="mt-1.5 block text-sm text-slate-500">{category._count.products} {locale === "zh" ? "项服务" : "services"}</span>
              </span>
              <ArrowRight size={15} className="ml-auto text-slate-600" />
            </Link>
          ))}
        </div>
      </section>

      <section id="process" className="container-shell py-14 sm:py-16">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-400">{t.process}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{locale === "zh" ? "三步获取服务" : "Get started in three steps"}</h2>
        <p className="mt-3 text-base text-slate-400">
          {locale === "zh" ? "无需创建账户。选择服务、完成支付、在订单页安全获取交付内容。" : "No account needed. Choose, pay, and securely access delivery from your order."}
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            [PackageCheck, "01", locale === "zh" ? "选择服务" : "Choose"],
            [ShieldCheck, "02", locale === "zh" ? "完成支付" : "Pay"],
            [Headphones, "03", locale === "zh" ? "获取与售后" : "Delivery"],
          ].map(([Icon, no, label]) => {
            const StepIcon = Icon as typeof PackageCheck;
            return (
              <div key={String(no)} className="card p-6">
                <StepIcon size={24} className="text-sky-300" />
                <span className="mt-8 block text-xs text-slate-600">{String(no)}</span>
                <strong className="mt-2 block text-base">{String(label)}</strong>
              </div>
            );
          })}
        </div>
      </section>
    </StoreShell>
  );
}
