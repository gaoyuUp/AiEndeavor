"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function AdminPagination({
  page,
  totalPages,
  total,
  label,
}: {
  page: number;
  totalPages: number;
  total: number;
  label: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function href(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    return `${pathname}?${params.toString()}`;
  }

  if (totalPages <= 1) return <p className="mt-4 text-center text-xs text-slate-500">共 {total} {label}</p>;
  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 sm:flex-row">
      <p className="text-xs text-slate-500">共 {total} {label}，第 {page} / {totalPages} 页</p>
      <div className="flex items-center gap-2">
        {page > 1 ? <Link className="button-secondary min-h-8 px-3" href={href(page - 1)}><ChevronLeft size={14} />上一页</Link> : <span className="button-secondary min-h-8 cursor-not-allowed px-3 opacity-40"><ChevronLeft size={14} />上一页</span>}
        {page < totalPages ? <Link className="button-secondary min-h-8 px-3" href={href(page + 1)}>下一页<ChevronRight size={14} /></Link> : <span className="button-secondary min-h-8 cursor-not-allowed px-3 opacity-40">下一页<ChevronRight size={14} /></span>}
      </div>
    </div>
  );
}
