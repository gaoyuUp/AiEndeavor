"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, Clock3, Copy, LoaderCircle, QrCode, ShieldCheck, Wallet,
} from "lucide-react";
import { CopyOrderNo } from "@/components/copy-order-no";
import { formatMoney } from "@/lib/utils";

type Method = "qrcode" | "usdt";
type Session = {
  paymentId: string;
  method: Method | string;
  status: string;
  amountMinor: number;
  originalAmountMinor: number | null;
  originalUsdtAmount: number | null;
  currency: string;
  wallet: string;
  network: string;
  usdtAmount: number;
  qrImage: string;
  notice: string;
  expiresAt: string;
  productSlug: string;
};

function Countdown({ expiresAt, locale, onExpire }: { expiresAt: string; locale: "zh" | "en"; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(expiresAt).getTime() - Date.now()));
  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = Math.max(0, new Date(expiresAt).getTime() - Date.now());
      setRemaining(next);
      if (!next) onExpire();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt, onExpire]);
  const minutes = Math.floor(remaining / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${remaining ? "text-amber-300" : "text-rose-300"}`}>
      <Clock3 size={15} />
      {remaining
        ? `${locale === "zh" ? "剩余" : "Remaining"} ${minutes}:${String(seconds).padStart(2, "0")}`
        : (locale === "zh" ? "支付已超时" : "Payment expired")}
    </span>
  );
}

export function PaymentPanel({ orderNo, locale }: { orderNo: string; locale: "zh" | "en" }) {
  const router = useRouter();
  const [queryPassword, setQueryPassword] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [method, setMethod] = useState<Method>("qrcode");
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [expired, setExpired] = useState(false);
  const [productSlug, setProductSlug] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.resolve(sessionStorage.getItem(`order-password:${orderNo}`) ?? "").then(setQueryPassword);
  }, [orderNo]);

  useEffect(() => {
    if (!queryPassword || expired) return;
    fetch("/api/payments/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderNo, queryPassword, method }),
    })
      .then(async (response) => {
        const body = await response.json();
        if (body.productSlug) setProductSlug(body.productSlug);
        if (response.status === 410 || body.expired) {
          setExpired(true);
          throw new Error(body.error ?? "支付已超时，请重新下单");
        }
        if (!response.ok) throw new Error(body.error ?? "创建支付失败");
        setSession(body);
        if (body.status === "SUBMITTED") setMethod(body.method === "usdt" ? "usdt" : "qrcode");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "创建支付失败"));
  }, [expired, method, orderNo, queryPassword]);

  function unlock(event: React.FormEvent) {
    event.preventDefault();
    sessionStorage.setItem(`order-password:${orderNo}`, passwordInput);
    setQueryPassword(passwordInput);
  }

  async function confirmPayment() {
    if (!session || expired) return;
    setLoading(true);
    setError("");
    try {
      const endpoint = method === "usdt" ? "/api/payments/usdt/submit" : "/api/payments/qrcode/submit";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderNo, queryPassword, paymentId: session.paymentId }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "提交失败");
      setSession({ ...session, status: "SUBMITTED" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setLoading(false);
    }
  }

  async function copyWallet() {
    if (!session) return;
    await navigator.clipboard.writeText(session.wallet);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function selectMethod(nextMethod: Method) {
    if (session?.status === "SUBMITTED") return;
    setSession(null);
    setError("");
    setMethod(nextMethod);
  }

  const reorderHref = productSlug ? `/products/${productSlug}` : "/products";

  if (!queryPassword) {
    return (
      <form onSubmit={unlock} className="card mx-auto max-w-lg p-7">
        <ShieldCheck size={28} className="text-sky-300" />
        <h2 className="mt-4 text-xl font-semibold">{locale === "zh" ? "验证订单" : "Verify order"}</h2>
        <p className="mt-2 text-sm text-slate-400">{locale === "zh" ? "请输入下单时设置的查询密码后继续支付。" : "Enter the lookup password created at checkout."}</p>
        <input className="field mt-5" type="text" minLength={6} required autoComplete="off" spellCheck={false} value={passwordInput} onChange={(event) => setPasswordInput(event.target.value)} placeholder={locale === "zh" ? "查询密码" : "Lookup password"} />
        <button className="button-primary mt-4 w-full">{locale === "zh" ? "继续支付" : "Continue"}</button>
      </form>
    );
  }

  if (expired) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <Clock3 size={28} className="mx-auto text-rose-300" />
        <h2 className="mt-4 text-xl font-semibold">{locale === "zh" ? "支付已超时，请重新下单" : "Payment expired. Please reorder."}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">{locale === "zh" ? "未在 20 分钟内确认付款，当前订单已失效。请返回商品页重新填写联系方式和查询密码。" : "This order expired after 20 minutes. Return to the product page and place a new order."}</p>
        <Link href={reorderHref} className="button-primary mt-6">{locale === "zh" ? "返回商品重新下单" : "Reorder this product"}</Link>
      </div>
    );
  }

  if (!session && !error) {
    return (
      <div className="card mx-auto flex max-w-2xl items-center justify-center gap-2 p-16 text-sm text-slate-400">
        <LoaderCircle size={17} className="animate-spin" />
        {locale === "zh" ? "正在创建支付..." : "Creating payment..."}
      </div>
    );
  }

  const submitted = session?.status === "SUBMITTED";

  return (
    <div className="card mx-auto max-w-2xl p-5 sm:p-7">
      <div className="flex flex-col justify-between gap-3 border-b border-white/8 pb-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs text-slate-500">{locale === "zh" ? "订单号" : "Order number"}</p>
          <div className="mt-1">
            <CopyOrderNo orderNo={orderNo} locale={locale} size="sm" notice />
          </div>
        </div>
        {session && !submitted && <Countdown expiresAt={session.expiresAt} locale={locale} onExpire={() => setExpired(true)} />}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {([
          ["qrcode", QrCode, locale === "zh" ? "电子收款码" : "QR payment"],
          ["usdt", Wallet, "USDT"],
        ] as const).map(([item, Icon, label]) => (
          <button
            key={item}
            type="button"
            disabled={submitted}
            onClick={() => selectMethod(item)}
            className={`flex min-h-14 items-center justify-center gap-2 rounded-xl border px-2 text-sm ${method === item ? "pay-tab-active" : "border-white/8 text-slate-400 hover:text-white"}`}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </div>

      {session ? (
        <div className="mt-6">
          <div className="flex items-end justify-between gap-4">
            <span className="text-sm text-slate-400">{locale === "zh" ? "应付金额" : "Amount due"}</span>
            <span className="text-right">
              <strong className="block text-3xl tracking-tight">{method === "usdt" ? `${session.usdtAmount.toFixed(2)} USDT` : formatMoney(session.amountMinor, "CNY", locale)}</strong>
              {method === "usdt"
                ? session.originalUsdtAmount
                  ? <span className="mt-1 block text-sm font-normal text-slate-500 line-through">{`${session.originalUsdtAmount.toFixed(2)} USDT`}</span>
                  : null
                : session.originalAmountMinor
                  ? <span className="mt-1 block text-sm font-normal text-slate-500 line-through">{formatMoney(session.originalAmountMinor, "CNY", locale)}</span>
                  : null}
            </span>
          </div>

          {method === "usdt" ? (
            <div className="mt-6">
              <div className="notice-warning rounded-xl p-4 text-sm leading-6">
                <strong className="block">{locale === "zh" ? "请使用钱包转账 · 仅支持 BNB Smart Chain（BEP20）USDT" : "Transfer USDT on BNB Smart Chain (BEP20) only"}</strong>
                <span className="mt-1 block text-xs opacity-75">{locale === "zh" ? "使用错误网络造成的资产损失无法找回。转账完成后请点击「我已完成转账」。" : "Assets sent on the wrong network cannot be recovered."}</span>
              </div>
              <p className="mt-5 text-xs text-slate-500">{session.network}</p>
              <button type="button" onClick={copyWallet} className="mt-2 flex w-full items-center justify-between gap-3 rounded-xl border border-white/8 bg-black/20 p-4 text-left">
                <span className="wallet-address min-w-0 break-all font-mono text-xs">{session.wallet}</span>
                <span className="shrink-0 text-xs text-slate-400">{copied ? (locale === "zh" ? "已复制" : "Copied") : <Copy size={15} />}</span>
              </button>
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center rounded-2xl border border-white/8 bg-white/3 p-6 sm:p-8">
              <p className="text-xs uppercase tracking-[0.18em] text-sky-400">{locale === "zh" ? "电子收款码" : "Collection QR"}</p>
              <Image
                src={session.qrImage}
                alt={locale === "zh" ? "电子收款码" : "Payment QR code"}
                width={560}
                height={700}
                className="mt-4 w-full max-w-[280px] rounded-2xl border border-white/10 bg-white p-2 shadow-lg"
                priority
              />
              <p className="mt-5 text-sm text-slate-300">{locale === "zh" ? "请按上方金额扫码转账，到账后由管理员核对。" : "Scan and pay the exact amount. An admin will confirm the transfer."}</p>
            </div>
          )}

          <p className="mt-5 rounded-xl bg-white/3 p-4 text-xs leading-5 text-slate-400">{session.notice}</p>
          {submitted ? (
            <div className="notice-success mt-5 rounded-xl p-5 text-center">
              <CheckCircle2 size={24} className="mx-auto" />
              <strong className="mt-3 block text-sm">{locale === "zh" ? "已提交，正在人工核对，订单不会因超时失效。" : "Submitted for review. This order will not expire."}</strong>
              <button onClick={() => router.push(`/orders/${orderNo}`)} className="button-secondary mt-4">{locale === "zh" ? "查看订单状态" : "View order"}</button>
            </div>
          ) : (
            <button onClick={confirmPayment} disabled={loading} className="button-primary mt-5 w-full disabled:opacity-50">
              {loading ? <LoaderCircle size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {method === "usdt" ? (locale === "zh" ? "我已完成转账" : "I have transferred") : (locale === "zh" ? "我已付款" : "I have paid")}
            </button>
          )}
        </div>
      ) : null}
      {error && !expired && <p className="mt-5 rounded-xl bg-rose-400/10 p-4 text-sm text-rose-300">{error}</p>}
    </div>
  );
}
