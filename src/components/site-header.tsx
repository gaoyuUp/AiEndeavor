import Link from "next/link";
import { Search } from "lucide-react";
import { copy, type Currency, type Locale, type Theme } from "@/lib/preferences";
import { BrandMark } from "@/components/brand-mark";
import { PreferenceSwitcher } from "./preference-switcher";
import { SiteMobileNav } from "./site-mobile-nav";
import { SiteNavLinks } from "./site-nav-links";

export function SiteHeader({ locale, currency, theme, lockCurrency = false }: { locale: Locale; currency: Currency; theme: Theme; lockCurrency?: boolean }) {
  const t = copy[locale];
  const items = [
    { href: "/", label: t.home, match: "exact" as const },
    { href: "/products", label: t.products },
    { href: "/#process", label: t.process, match: "none" as const },
    { href: "/orders/lookup", label: t.lookup },
    { href: "/faq", label: t.help },
  ];

  return (
    <header className="site-header sticky top-0 z-40">
      <div className="container-shell py-2 md:py-0">
        <div className="site-nav-bar">
          <Link href="/" className="site-nav-brand">
            <BrandMark size={36} className="size-8 lg:size-9" />
            <span>灵搜<span className="text-sky-400">AI</span></span>
          </Link>

          <nav className="site-nav-links" aria-label={locale === "zh" ? "主导航" : "Primary"}>
            <SiteNavLinks items={items} variant="bar" />
          </nav>

          <div className="site-nav-tools">
            <Link aria-label="搜索产品" href="/products" className="site-nav-action hidden min-[360px]:flex">
              <Search size={16} />
            </Link>
            <PreferenceSwitcher locale={locale} currency={currency} theme={theme} lockCurrency={lockCurrency} />
            <SiteMobileNav items={items} locale={locale} />
          </div>
        </div>
      </div>
    </header>
  );
}
