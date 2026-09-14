"use client";

import { useState } from "react";
import { CheckCircle2, Copy, LoaderCircle, Send } from "lucide-react";
import { HumanCheckBox } from "@/components/human-check-box";

const copy = {
  zh: {
    orderNo: "订单号",
    orderHint: "必填。可在支付页或订单详情里复制。",
    email: "联系邮箱",
    subject: "问题主题",
    message: "问题描述",
    submit: "提交工单",
    submitting: "正在提交",
    done: "工单已提交",
    saveTicket: "请保存工单号：",
    copyTicket: "复制工单号",
    copied: "已复制",
    human: "请先点击完成人工检测",
    failed: "提交失败",
    website: "Website",
  },
  en: {
    orderNo: "Order number",
    orderHint: "Required. Copy it from the payment or order page.",
    email: "Email",
    subject: "Subject",
    message: "Message",
    submit: "Submit ticket",
    submitting: "Submitting",
    done: "Ticket submitted",
    saveTicket: "Save your ticket number:",
    copyTicket: "Copy ticket number",
    copied: "Copied",
    human: "Please complete the human check first",
    failed: "Could not submit",
    website: "Website",
  },
} as const;

export function SupportForm({ locale, defaultOrderNo = "" }: { locale: "zh" | "en"; defaultOrderNo?: string }) {
  const t = copy[locale];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ticketNo, setTicketNo] = useState("");
  const [humanToken, setHumanToken] = useState("");
  const [checkKey, setCheckKey] = useState(0);
  const [copied, setCopied] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!humanToken) {
      setError(t.human);
      return;
    }
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(form),
          humanToken,
          locale,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? t.failed);
      setTicketNo(body.ticketNo);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.failed);
      setHumanToken("");
      setCheckKey((value) => value + 1);
    } finally {
      setLoading(false);
    }
  }

  async function copyTicket() {
    try {
      await navigator.clipboard.writeText(ticketNo);
    } catch {
      const field = document.createElement("textarea");
      field.value = ticketNo;
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  if (ticketNo) {
    return (
      <div className="card mx-auto max-w-xl p-8 text-center">
        <CheckCircle2 className="mx-auto text-emerald-400" size={34} />
        <h2 className="mt-4 text-xl font-semibold">{t.done}</h2>
        <p className="mt-2 text-sm text-slate-400">{t.saveTicket}</p>
        <p className="mt-3 font-mono text-sky-300">{ticketNo}</p>
        <button type="button" onClick={copyTicket} className="button-secondary mx-auto mt-4">
          {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
          {copied ? t.copied : t.copyTicket}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card mx-auto max-w-xl space-y-4 p-7">
      <div>
        <label className="label" htmlFor="orderNo">{t.orderNo}</label>
        <input
          id="orderNo"
          name="orderNo"
          required
          minLength={8}
          maxLength={40}
          className="field"
          defaultValue={defaultOrderNo}
          autoComplete="off"
          placeholder={locale === "zh" ? "例如 SD20260914XXXXXXXXXX" : "e.g. SD20260914XXXXXXXXXX"}
        />
        <p className="mt-2 text-xs leading-5 text-slate-500">{t.orderHint}</p>
      </div>
      <div>
        <label className="label" htmlFor="email">{t.email}</label>
        <input id="email" name="email" type="email" required className="field" />
      </div>
      <div>
        <label className="label" htmlFor="subject">{t.subject}</label>
        <input id="subject" name="subject" required minLength={2} className="field" />
      </div>
      <div>
        <label className="label" htmlFor="message">{t.message}</label>
        <textarea id="message" name="message" required minLength={10} rows={6} className="field resize-y" />
      </div>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">{t.website}</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <HumanCheckBox key={checkKey} locale={locale} token={humanToken} onToken={setHumanToken} context="support" />
      {error && <p className="rounded-lg bg-rose-400/10 p-3 text-sm text-rose-300">{error}</p>}
      <button disabled={loading || !humanToken} className="button-primary w-full disabled:cursor-not-allowed disabled:opacity-50">
        {loading ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
        {loading ? t.submitting : t.submit}
      </button>
    </form>
  );
}
