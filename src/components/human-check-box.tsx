"use client";

import { useEffect, useRef, useState } from "react";
import { Check, LoaderCircle, ShieldCheck } from "lucide-react";
import { HUMAN_CHECK_MIN_DWELL_MS } from "@/lib/human-check-constants";
import { cn } from "@/lib/utils";

type Status = "loading" | "ready" | "checking" | "verified" | "error";

export function HumanCheckBox({
  locale,
  token,
  onToken,
  context = "checkout",
}: {
  locale: "zh" | "en";
  token: string;
  onToken: (token: string) => void;
  context?: "checkout" | "support";
}) {
  const [challengeId, setChallengeId] = useState("");
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const issuedAt = useRef(0);

  async function loadChallenge() {
    setStatus("loading");
    setMessage("");
    onToken("");
    const response = await fetch("/api/orders/human-check");
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? (locale === "zh" ? "人工检测加载失败" : "Human check failed"));
    setChallengeId(result.challengeId);
    issuedAt.current = Date.now();
    setStatus("ready");
  }

  useEffect(() => {
    loadChallenge().catch((error) => {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : locale === "zh" ? "人工检测加载失败" : "Human check failed");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verify() {
    if (status !== "ready" || !challengeId) return;
    setStatus("checking");
    setMessage("");
    try {
      const wait = Math.max(0, issuedAt.current + HUMAN_CHECK_MIN_DWELL_MS - Date.now());
      if (wait) await new Promise((resolve) => window.setTimeout(resolve, wait));
      const response = await fetch("/api/orders/human-check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ challengeId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? (locale === "zh" ? "人工检测失败" : "Human check failed"));
      onToken(result.token);
      setStatus("verified");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : locale === "zh" ? "人工检测失败" : "Human check failed");
    }
  }

  const label =
    status === "verified"
      ? locale === "zh" ? "已通过人工检测" : "Human check passed"
      : status === "checking"
        ? locale === "zh" ? "正在确认" : "Checking"
        : status === "loading"
          ? locale === "zh" ? "正在准备检测" : "Preparing check"
          : locale === "zh" ? "点击确认你是真人" : "Click to confirm you are human";

  return (
    <div className="mt-4">
      <button
        type="button"
        className={cn("human-check", status === "verified" && "human-check-verified")}
        onClick={status === "error" ? () => loadChallenge().catch(() => undefined) : verify}
        disabled={status === "loading" || status === "checking" || (status === "verified" && Boolean(token))}
      >
        <span className="human-check-mark" aria-hidden>
          {status === "checking" || status === "loading" ? <LoaderCircle size={14} className="animate-spin" /> : null}
          {status === "verified" ? <Check size={15} strokeWidth={2.6} /> : null}
        </span>
        <span className="min-w-0 text-left">
          <strong className="block text-sm font-semibold">{status === "error" ? (locale === "zh" ? "重新点击进行人工检测" : "Retry human check") : label}</strong>
          <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">
            {status === "verified"
              ? context === "support"
                ? locale === "zh" ? "可以继续提交工单了。" : "You can submit the ticket now."
                : locale === "zh" ? "可以继续安全下单了。" : "You can continue checkout."
              : context === "support"
                ? locale === "zh" ? "防止刷工单，点一下即可提交。" : "One click to confirm you are human."
                : locale === "zh" ? "防止刷单，点一下即可继续下单。" : "One click to continue checkout."}
          </span>
        </span>
        <ShieldCheck size={16} className="ml-auto shrink-0 text-sky-300" />
      </button>
      {message ? <p className="mt-2 text-xs text-rose-300">{message}</p> : null}
    </div>
  );
}
