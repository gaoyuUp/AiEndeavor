"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { AdminNav } from "@/components/admin-nav";
import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "admin-nav-collapsed";

export function AdminShell({
  admin,
  title,
  children,
}: {
  admin: { email: string };
  title: string;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="admin-theme min-h-screen bg-[#090d17] md:flex">
      <aside
        className={cn(
          "relative z-30 border-b border-white/8 bg-[#0d1320] p-3 md:sticky md:top-0 md:flex md:h-dvh md:flex-col md:overflow-visible md:border-r md:border-b-0 md:transition-[width] md:duration-200",
          collapsed ? "md:w-[72px] md:px-2" : "md:w-[230px] md:p-4",
        )}
      >
        <div className={cn("flex items-center", collapsed ? "md:flex-col md:gap-2" : "justify-between px-1")}>
          <Link
            href="/admin"
            className={cn("flex items-center gap-2 py-3 font-semibold", collapsed && "md:justify-center")}
            title="灵搜AI 管理后台"
          >
            <BrandMark size={28} />
            <span className={cn(collapsed && "md:hidden")}>灵搜<span className="text-sky-400">AI</span></span>
          </Link>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white md:inline-flex"
            aria-label={collapsed ? "展开菜单" : "收起菜单"}
            title={collapsed ? "展开菜单" : "收起菜单"}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
        <AdminNav collapsed={collapsed} />
      </aside>
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/8 bg-[#090d17]/92 px-5 backdrop-blur md:px-8">
          <h1 className="text-lg font-semibold">{title}</h1>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="hidden sm:inline">{admin.email}</span>
            <form action="/api/admin/auth/logout" method="post">
              <button className="flex size-8 items-center justify-center rounded-full border border-white/10 hover:text-white" aria-label="退出登录"><LogOut size={14} /></button>
            </form>
          </div>
        </header>
        <div className="p-5 md:p-8">{children}</div>
      </main>
    </div>
  );
}
