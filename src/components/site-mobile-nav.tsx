"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SiteNavLinks, type SiteNavItem } from "./site-nav-links";

export function SiteMobileNav({ items, locale }: { items: SiteNavItem[]; locale: "zh" | "en" }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        className="site-nav-action"
        aria-expanded={open}
        aria-controls="site-mobile-nav"
        aria-label={open ? (locale === "zh" ? "关闭导航" : "Close menu") : (locale === "zh" ? "打开导航" : "Open menu")}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
      {open ? (
        <nav id="site-mobile-nav" className="site-nav-menu" aria-label={locale === "zh" ? "移动导航" : "Mobile"} onClick={() => setOpen(false)}>
          <SiteNavLinks items={items} variant="menu" />
        </nav>
      ) : null}
    </div>
  );
}
