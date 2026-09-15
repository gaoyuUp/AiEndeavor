"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { MessageCircle, X } from "lucide-react";
import type { Locale } from "@/lib/preferences";

export const QQ_UIN = "992491441";
export const QQ_CHAT = `https://wpa.qq.com/msgrd?v=3&uin=${QQ_UIN}&site=qq&menu=yes`;

export function QqSupport({ locale }: { locale: Locale }) {
  const [pinned, setPinned] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!pinned) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setPinned(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pinned]);

  function closePanel() {
    setPinned(false);
    setDismissed(true);
  }

  return (
    <div
      className="qq-support"
      data-open={pinned ? "" : undefined}
      data-dismissed={dismissed ? "" : undefined}
      onMouseLeave={() => setDismissed(false)}
    >
      <div className="qq-support-panel" role="tooltip">
        <button type="button" className="qq-support-close" aria-label={locale === "zh" ? "关闭" : "Close"} onClick={closePanel}>
          <X size={14} />
        </button>
        <p className="qq-support-card-title pr-8 text-sm font-medium text-slate-100">{locale === "zh" ? "QQ 客服 · 紊" : "QQ support"}</p>
        <p className="qq-support-card-hint mt-1 text-xs text-slate-400">{locale === "zh" ? "扫码添加好友咨询" : "Scan to add and chat"}</p>
        <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-[#1b1b1b]">
          <Image
            src="/contact/qq-service.jpg"
            alt={locale === "zh" ? `QQ 客服 紊 ${QQ_UIN}` : `QQ support ${QQ_UIN}`}
            width={581}
            height={1024}
            className="h-auto w-full"
          />
        </div>
        <a
          href={QQ_CHAT}
          target="_blank"
          rel="noopener noreferrer"
          className="qq-support-card-link mt-3 inline-flex text-sm text-sky-300 hover:text-sky-200"
        >
          QQ {QQ_UIN}
        </a>
      </div>
      <button
        type="button"
        className="qq-support-trigger"
        aria-label={locale === "zh" ? "QQ 客服" : "QQ support"}
        aria-expanded={pinned}
        onClick={() => {
          setDismissed(false);
          setPinned((open) => !open);
        }}
      >
        <MessageCircle size={18} />
        <span>{locale === "zh" ? "QQ 客服" : "QQ"}</span>
      </button>
    </div>
  );
}
