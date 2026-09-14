"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes, ChevronRight, CircleGauge, ClipboardList, FileText, HelpCircle, Megaphone,
  PackageOpen, Settings, ShoppingBag, TicketCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  ["/admin", "运营概览", CircleGauge],
  ["/admin/products", "商品管理", ShoppingBag],
  ["/admin/categories", "分类管理", Boxes],
  ["/admin/inventory", "库存管理", PackageOpen],
  ["/admin/orders", "订单与交付", ClipboardList],
  ["/admin/announcements", "公告管理", Megaphone],
  ["/admin/faq", "FAQ 管理", HelpCircle],
  ["/admin/pages", "内容页管理", FileText],
  ["/admin/tickets", "售后工单", TicketCheck],
  ["/admin/settings", "站点设置", Settings],
] as const;

export function AdminNav({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className={cn("mt-3 grid gap-1", collapsed ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-1")}>
      {nav.map(([href, label, Icon]) => {
        const active = pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            title={label}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center overflow-visible rounded-xl text-sm transition",
              collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
              active
                ? "bg-sky-400/12 font-medium text-sky-200 ring-1 ring-inset ring-sky-400/15"
                : "text-slate-400 hover:bg-white/5 hover:text-white",
            )}
          >
            {active && !collapsed && <span className="absolute inset-y-2 left-0 w-0.5 rounded-r bg-sky-300" />}
            <Icon size={16} className={active ? "text-sky-300" : "text-slate-500 group-hover:text-slate-300"} />
            <span className={cn("truncate", collapsed && "md:hidden")}>{label}</span>
            <ChevronRight size={14} className={cn("ml-auto hidden", !collapsed && "md:block", active ? "text-sky-300" : "text-transparent group-hover:text-slate-600")} />
            {collapsed && (
              <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-[#1e293b] px-2 py-1 text-xs font-medium text-slate-100 shadow-lg ring-1 ring-white/10 md:group-hover:block">
                {label}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
