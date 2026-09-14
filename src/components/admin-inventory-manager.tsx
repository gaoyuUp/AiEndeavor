"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, ChevronRight, KeyRound, PackageOpen, Plus, ShieldAlert } from "lucide-react";
import { useAdminToast } from "@/components/admin-toast";

type Variant = {
  id: string;
  nameZh: string;
  sku: string;
  product: { nameZh: string };
  _count: { inventoryItems: number };
};

export function AdminInventoryManager({ variants }: { variants: Variant[] }) {
  const router = useRouter();
  const toast = useAdminToast();
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const selected = variants.find((variant) => variant.id === variantId);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ variantId, content }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "添加失败");
      setContent("");
      setMessage({ type: "success", text: "库存已添加，顾客购买后将自动收到这条内容。" });
      toast.success("库存已添加");
      router.refresh();
    } catch (error) {
      const text = error instanceof Error ? error.message : "添加失败";
      setMessage({ type: "error", text });
      toast.error(text);
    } finally {
      setSubmitting(false);
    }
  }

  if (!variants.length) {
    return (
      <div className="card p-8 text-center">
        <PackageOpen size={30} className="mx-auto text-slate-500" />
        <h2 className="mt-4 font-semibold">暂时没有需要维护库存的套餐</h2>
        <p className="mt-2 text-sm text-slate-500">请先在「商品管理」里创建商品，并把库存模式设为库存池。</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          ["1", "选择商品套餐", "先确认库存要加到哪个套餐"],
          ["2", "填写一条交付内容", "填写卡密、链接或要交付的文本"],
          ["3", "点击添加库存", "售出后系统自动交给顾客"],
        ].map(([step, title, description]) => (
          <div key={step} className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
            <span className="flex size-6 items-center justify-center rounded-full bg-sky-400/10 text-xs font-semibold text-sky-300">{step}</span>
            <strong className="mt-3 block text-sm">{title}</strong>
            <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="card overflow-hidden">
          <div className="border-b border-white/8 p-5">
            <h2 className="text-sm font-semibold">选择要补货的套餐</h2>
            <p className="mt-1 text-xs text-slate-500">点击下面的套餐后，在右侧添加一条库存。</p>
          </div>
          <div className="divide-y divide-white/8">
            {variants.map((variant) => {
              const active = variant.id === variantId;
              return (
                <button key={variant.id} type="button" onClick={() => { setVariantId(variant.id); setMessage(null); }} className={`flex w-full items-center gap-4 p-4 text-left transition ${active ? "bg-sky-400/8" : "hover:bg-white/[0.025]"}`}>
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${active ? "bg-sky-400/15 text-sky-300" : "bg-white/5 text-slate-500"}`}><PackageOpen size={18} /></span>
                  <span className="min-w-0 flex-1">
                    <strong className={`block truncate text-sm ${active ? "text-white" : "text-slate-300"}`}>{variant.product.nameZh}</strong>
                    <span className="mt-1 block truncate text-xs text-slate-500">{variant.nameZh} · {variant.sku}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <strong className={variant._count.inventoryItems <= 3 ? "text-amber-300" : "text-sky-300"}>{variant._count.inventoryItems}</strong>
                    <span className="ml-1 text-xs text-slate-500">条可售</span>
                  </span>
                  <ChevronRight size={15} className={active ? "text-sky-300" : "text-slate-700"} />
                </button>
              );
            })}
          </div>
        </section>

        <form onSubmit={submit} className="card h-fit p-5 xl:sticky xl:top-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300"><KeyRound size={18} /></span>
            <div>
              <h2 className="text-sm font-semibold">添加一条库存</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">{selected ? `${selected.product.nameZh} · ${selected.nameZh}` : "请先选择套餐"}</p>
            </div>
          </div>

          <label className="label mt-5" htmlFor="inventory-content">交付内容</label>
          <textarea id="inventory-content" required rows={5} maxLength={10000} className="field resize-y font-mono text-xs leading-6" value={content} onChange={(event) => setContent(event.target.value)} placeholder="例如：激活码、下载链接或要交付给顾客的文本" />
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300/10 bg-amber-300/5 p-3 text-xs leading-5 text-amber-100/70">
            <ShieldAlert size={14} className="mt-0.5 shrink-0" />
            每次只添加一条。这里的内容会在商品售出后显示给顾客，请勿填写第三方账号密码、验证码等敏感信息。
          </div>

          {message && (
            <p className={`mt-4 flex items-start gap-2 rounded-xl p-3 text-xs leading-5 ${message.type === "success" ? "bg-emerald-400/8 text-emerald-300" : "bg-rose-400/8 text-rose-300"}`}>
              {message.type === "success" && <CheckCircle2 size={14} className="mt-0.5 shrink-0" />}
              {message.text}
            </p>
          )}
          <button disabled={submitting || !variantId || !content.trim()} className="button-primary mt-5 w-full disabled:opacity-50">
            <Plus size={16} />
            {submitting ? "正在添加..." : "添加这条库存"}
          </button>
        </form>
      </div>
    </div>
  );
}
