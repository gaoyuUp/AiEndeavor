import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { copy, type Currency, type Locale, type Theme } from "@/lib/preferences";
import { BrandMark } from "@/components/brand-mark";
import { PreferenceSwitcher } from "./preference-switcher";

export function SiteHeader({ locale, currency, theme, lockCurrency = false }: { locale: Locale; currency: Currency; theme: Theme; lockCurrency?: boolean }) {
  const t = copy[locale];

  return (
    <header className="site-header sticky top-0 z-40 border-b border-white/8 backdrop-blur-xl">
      <div className="container-shell flex h-16 items-center justify-between gap-4 lg:h-[4.25rem]">
        <Link href="/" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
          <BrandMark size={40} className="size-9 lg:size-10" />
          <span>灵搜<span className="text-sky-400">AI</span></span>
        </Link>

        <nav className="hidden items-center rounded-full border border-white/10 bg-white/4 p-1.5 text-[15px] text-slate-300 md:flex">
          <Link className="rounded-full px-4 py-2 hover:bg-white/8 hover:text-white" href="/">{t.home}</Link>
          <Link className="rounded-full px-4 py-2 hover:bg-white/8 hover:text-white" href="/products">{t.products}</Link>
          <Link className="rounded-full px-4 py-2 hover:bg-white/8 hover:text-white" href="/#process">{t.process}</Link>
          <Link className="rounded-full px-4 py-2 hover:bg-white/8 hover:text-white" href="/orders/lookup">{t.lookup}</Link>
          <Link className="rounded-full px-4 py-2 hover:bg-white/8 hover:text-white" href="/faq">{t.help}</Link>
        </nav>

        <div className="flex items-center gap-1">
          <Link aria-label="搜索产品" href="/products" className="hidden size-10 items-center justify-center rounded-full text-slate-300 hover:bg-white/8 min-[360px]:flex">
            <Search size={18} />
          </Link>
          <PreferenceSwitcher locale={locale} currency={currency} theme={theme} lockCurrency={lockCurrency} />
          <details className="group relative md:hidden">
            <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full text-slate-300 hover:bg-white/8">
              <Menu size={20} />
              <span className="sr-only">打开导航</span>
            </summary>
            <nav className="glass-panel absolute top-12 right-0 flex w-52 flex-col rounded-2xl p-2 text-sm text-slate-200">
              <Link className="rounded-xl px-4 py-3 hover:bg-white/8" href="/">{t.home}</Link>
              <Link className="rounded-xl px-4 py-3 hover:bg-white/8" href="/products">{t.products}</Link>
              <Link className="rounded-xl px-4 py-3 hover:bg-white/8" href="/#process">{t.process}</Link>
              <Link className="rounded-xl px-4 py-3 hover:bg-white/8" href="/orders/lookup">{t.lookup}</Link>
              <Link className="rounded-xl px-4 py-3 hover:bg-white/8" href="/faq">{t.help}</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
