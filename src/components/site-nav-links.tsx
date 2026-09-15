"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type SiteNavItem = {
  href: string;
  label: string;
  match?: "prefix" | "exact" | "none";
};

export function SiteNavLinks({
  items,
  variant,
}: {
  items: SiteNavItem[];
  variant: "bar" | "menu";
}) {
  const pathname = usePathname();
  return (
    <>
      {items.map((item) => {
        const active =
          item.match === "none"
            ? false
            : item.match === "exact" || item.href === "/"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={cn(variant === "bar" ? "site-nav-link" : "site-nav-menu-link", active && "is-active")}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
