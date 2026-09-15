import type { ReactNode } from "react";
import { getPreferences } from "@/lib/preferences";
import { QqSupport } from "./qq-support";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export async function StoreShell({ children, lockCurrency = false }: { children: ReactNode; lockCurrency?: boolean }) {
  const { locale, currency, theme } = await getPreferences();
  return (
    <div className="store-theme min-h-screen">
      <SiteHeader locale={locale} currency={currency} theme={theme} lockCurrency={lockCurrency} />
      <main>{children}</main>
      <SiteFooter locale={locale} />
      <QqSupport locale={locale} />
    </div>
  );
}
