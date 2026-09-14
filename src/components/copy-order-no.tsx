"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function CopyOrderNo({
  orderNo,
  locale,
  size = "md",
  notice = false,
}: {
  orderNo: string;
  locale: "zh" | "en";
  size?: "sm" | "md";
  notice?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(orderNo);
    } catch {
      const field = document.createElement("textarea");
      field.value = orderNo;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const copyLabel = locale === "zh" ? "复制订单号" : "Copy order number";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("font-mono font-semibold tracking-tight", size === "sm" ? "text-sm" : "text-xl sm:text-2xl")}>
          {orderNo}
        </span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/10 px-2.5 text-xs text-slate-400 transition hover:bg-white/8 hover:text-white"
          aria-label={copyLabel}
          title={copyLabel}
        >
          {copied ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
          {copied ? (locale === "zh" ? "已复制" : "Copied") : (locale === "zh" ? "复制" : "Copy")}
        </button>
      </div>
      {notice ? (
        <p className="order-no-notice mt-2 max-w-md text-xs font-medium leading-5">
          {locale === "zh"
            ? "请提前复制并保存订单号。丢失后将无法查询订单或提交售后。"
            : "Copy and save this order number now. You will need it to look up the order or contact support."}
        </p>
      ) : null}
    </div>
  );
}
