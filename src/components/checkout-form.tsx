"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { HumanCheckBox } from "@/components/human-check-box";
import { formatMoney } from "@/lib/utils";

type Variant = {
  id: string;
  name: string;
  stockMode: string;
  stock: number | null;
  price: { currency: string; amountMinor: number } | null;
};

export function CheckoutForm({
  variants,
  locale,
  currency,
}: {
  variants: Variant[];
  locale: "zh" | "en";
  currency: "CNY" | "USD";
}) {
  const router = useRouter();
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [contact, setContact] = useState("");
  const [queryPassword, setQueryPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [humanToken, setHumanToken] = useState("");
  const [checkKey, setCheckKey] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const current = useMemo(() => variants.find((item) => item.id === variantId), [variantId, variants]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!accepted) {
      setError(locale === "zh" ? "请先阅读并同意购买须知" : "Please accept the purchase notice");
      return;
    }
    if (contact.trim().length < 3) {
      setError(locale === "zh" ? "联系方式至少需要 3 个字符" : "Contact must be at least 3 characters");
      return;
    }
    if (queryPassword.length < 6) {
      setError(locale === "zh" ? "查询密码至少需要 6 位" : "Lookup password must be at least 6 characters");
      return;
    }
    if (!humanToken) {
      setError(locale === "zh" ? "请先点击完成人工检测" : "Please complete the human check");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ variantId, contact, queryPassword, currency, quantity: 1, humanToken, website: "" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "创建订单失败");
      sessionStorage.setItem(`order-password:${result.orderNo}`, queryPassword);
      router.push(`/pay/${result.orderNo}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建订单失败");
      setHumanToken("");
      setCheckKey((value) => value + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="card sticky top-24 p-6">
      <h2 className="text-lg font-semibold">{locale === "zh" ? "选择套餐" : "Choose a plan"}</h2>
      <div className="mt-4 grid gap-2">
        {variants.map((variant) => {
          const soldOut = variant.stockMode === "INVENTORY" && !variant.stock;
          return (
            <label key={variant.id} className={`flex items-center justify-between rounded-xl border p-3 ${variantId === variant.id ? "border-sky-400/50 bg-sky-400/8" : "border-white/8"} ${soldOut ? "opacity-45" : ""}`}>
              <span className="flex items-center gap-3">
                <input type="radio" name="variant" value={variant.id} checked={variantId === variant.id} disabled={soldOut} onChange={() => setVariantId(variant.id)} />
                <span>
                  <strong className="block text-sm">{variant.name}</strong>
                  <span className="mt-1 block text-xs text-slate-500">
                    {soldOut ? (locale === "zh" ? "暂时售罄" : "Sold out") : variant.stock === null ? (locale === "zh" ? "有货" : "Available") : `${locale === "zh" ? "库存" : "Stock"} ${variant.stock}`}
                  </span>
                </span>
              </span>
              <strong className="text-sm text-sky-300">{variant.price ? formatMoney(variant.price.amountMinor, variant.price.currency, locale) : "—"}</strong>
            </label>
          );
        })}
      </div>

      <div className="mt-5">
        <label className="label" htmlFor="contact">{locale === "zh" ? "联系方式" : "Contact"}</label>
        <input id="contact" className="field" required minLength={3} maxLength={200} value={contact} onChange={(e) => setContact(e.target.value)} placeholder={locale === "zh" ? "QQ / 微信 / 手机号 / Telegram" : "QQ / WeChat / Phone / Telegram"} />
        <p className="mt-2 text-xs text-slate-500">{locale === "zh" ? "至少 3 个字符，用于查询订单和接收人工服务。" : "At least 3 characters. Used for lookup and manual delivery."}</p>
      </div>
      <div className="mt-4">
        <label className="label" htmlFor="queryPassword">{locale === "zh" ? "查询密码" : "Lookup password"}</label>
        <input id="queryPassword" className="field" type="text" required minLength={6} maxLength={100} autoComplete="off" spellCheck={false} value={queryPassword} onChange={(e) => setQueryPassword(e.target.value)} placeholder={locale === "zh" ? "请设置至少 6 位查询密码" : "At least 6 characters"} />
      </div>
      <label className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-400">
        <input className="mt-1" type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
        <span>{locale === "zh" ? "我已阅读商品说明、购买须知和售后规则，并确认填写信息准确。" : "I have read the product, purchase and after-sales terms."}</span>
      </label>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <HumanCheckBox key={checkKey} locale={locale} token={humanToken} onToken={setHumanToken} />
      {error && <p className="mt-4 rounded-lg bg-rose-400/10 p-3 text-xs text-rose-300">{error}</p>}
      <button className="button-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50" disabled={loading || !current || !humanToken}>
        {loading ? <LoaderCircle size={16} className="animate-spin" /> : <LockKeyhole size={15} />}
        {loading ? (locale === "zh" ? "正在创建订单" : "Creating order") : (locale === "zh" ? "安全下单" : "Secure checkout")}
      </button>
      <p className="mt-3 text-center text-[11px] leading-5 text-slate-500">{locale === "zh" ? "下单后请立即复制并保存订单号。丢失后将无法查询订单或提交售后。" : "Copy and save your order number after checkout. You will need it to look up the order or contact support."}</p>
    </form>
  );
}
