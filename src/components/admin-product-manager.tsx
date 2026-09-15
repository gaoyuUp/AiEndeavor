"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { publishStatusLabels, statusLabel } from "@/lib/status-labels";
import { optionalUsdMinor } from "@/lib/fx";
import { ChevronDown, ChevronUp, Pencil, Plus, Power, Star, Trash2, X } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { AdminPagination } from "@/components/admin-pagination";
import { useAdminToast } from "@/components/admin-toast";

type CategoryOption = { id: string; nameZh: string };
type ProductRow = {
  id: string;
  nameZh: string;
  nameEn: string;
  slug: string;
  categoryId: string;
  shortDescZh: string;
  shortDescEn: string;
  descriptionZh: string;
  descriptionEn: string;
  purchaseNotice: string;
  purchaseNoticeEn: string | null;
  afterSale: string;
  afterSaleEn: string | null;
  image: string | null;
  badge: string | null;
  status: string;
  featured: boolean;
  sort: number;
  category: { id: string; nameZh: string };
  variants: Array<{
    id: string;
    nameZh: string;
    nameEn: string;
    sku: string;
    deliveryType: "CODE" | "TEXT" | "LINK" | "MANUAL";
    stockMode: "UNLIMITED" | "INVENTORY" | "MANUAL";
    deliveryContent: string | null;
    prices: Array<{ currency: string; amountMinor: number }>;
  }>;
};

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title}>
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <h2 className="font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white" aria-label="关闭"><X size={16} /></button>
        </div>
        <div className="max-h-[calc(90vh-65px)] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={className}>
      <span className="label">{label}</span>
      {children}
      {hint ? <p className="mt-1.5 text-[11px] leading-4 text-slate-500">{hint}</p> : null}
    </label>
  );
}

const iconActionClass = "button-secondary button-compact size-7 shrink-0 px-0";

export function AdminProductManager({
  products,
  categories,
  page,
  total,
  totalPages,
  categoryId,
  sortDir,
}: {
  products: ProductRow[];
  categories: CategoryOption[];
  page: number;
  total: number;
  totalPages: number;
  categoryId: string;
  sortDir: "asc" | "desc";
}) {
  const router = useRouter();
  const toast = useAdminToast();

  function updateQuery(next: { category?: string; order?: string }) {
    const params = new URLSearchParams();
    const category = next.category ?? categoryId;
    const order = next.order ?? sortDir;
    if (category) params.set("category", category);
    if (order === "desc") params.set("order", "desc");
    const query = params.toString();
    router.push(query ? `/admin/products?${query}` : "/admin/products");
  }
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const editingProduct = products.find((product) => product.id === editingProductId);
  const editingVariant = products.flatMap((product) => product.variants).find((variant) => variant.id === editingVariantId);
  const editingUsdMinor = editingVariant?.prices.find((price) => price.currency === "USD")?.amountMinor ?? 0;

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const payload = {
      ...values,
      featured: values.featured === "on",
      sort: Number(values.sort) || 0,
      image: values.image || undefined,
      priceCny: Math.round(Number(values.priceCny) * 100),
      priceUsd: optionalUsdMinor(values.priceUsd),
    };
    const response = await fetch("/api/admin/products", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "创建失败");
      toast.error(body.error ?? "创建失败");
      return;
    }
    setOpen(false);
    setError("");
    toast.success("商品已创建");
    router.refresh();
  }

  async function mutate(id: string, method: "PATCH" | "DELETE", body?: object, success = "操作成功") {
    if (method === "DELETE" && !window.confirm("确定删除这个商品？删除后不可恢复。")) return;
    const response = await fetch(`/api/admin/products/${id}`, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? "操作失败");
      toast.error(result.error ?? "操作失败");
      return;
    }
    toast.success(success);
    router.refresh();
  }

  async function updateProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingProduct) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch(`/api/admin/products/${editingProduct.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...values,
        image: values.image || null,
        badge: values.badge || null,
        featured: values.featured === "on",
        sort: Number(values.sort) || 0,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? "更新失败");
      toast.error(result.error ?? "更新失败");
      return;
    }
    setEditingProductId(null);
    setError("");
    toast.success("商品已保存");
    router.refresh();
  }

  async function updateVariant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingVariant) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch(`/api/admin/variants/${editingVariant.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...values,
        priceCny: Math.round(Number(values.priceCny) * 100),
        priceUsd: optionalUsdMinor(values.priceUsd),
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? "更新失败");
      toast.error(result.error ?? "更新失败");
      return;
    }
    setEditingVariantId(null);
    setError("");
    toast.success("价格与规格已保存");
    router.refresh();
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <select
          className="field max-w-xs"
          aria-label="按分类筛选"
          value={categoryId}
          onChange={(event) => updateQuery({ category: event.target.value })}
        >
          <option value="">全部分类</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>{item.nameZh}</option>
          ))}
        </select>
        <button className="button-primary" onClick={() => setOpen(!open)}><Plus size={15} />新增商品</button>
      </div>
      {open && (
        <Modal title="新增商品" onClose={() => setOpen(false)}>
          <form onSubmit={create} className="grid gap-4 md:grid-cols-2">
            <Field label="分类">
              <select name="categoryId" className="field" required><option value="">选择分类</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.nameZh}</option>)}</select>
            </Field>
            <Field label="URL slug" hint="仅小写字母、数字和短横线">
              <input name="slug" className="field" required pattern="[a-z0-9-]+" placeholder="chatgpt-plus-service" />
            </Field>
            <Field label="商品中文名"><input name="nameZh" className="field" required placeholder="ChatGPT Plus 会员服务" /></Field>
            <Field label="商品英文名"><input name="nameEn" className="field" required placeholder="ChatGPT Plus Service" /></Field>
            <Field label="中文短描述"><input name="shortDescZh" className="field" required placeholder="一句话介绍商品" /></Field>
            <Field label="英文短描述"><input name="shortDescEn" className="field" required placeholder="One-line product summary" /></Field>
            <Field label="中文详细介绍"><textarea name="descriptionZh" rows={4} className="field" required placeholder="商品详情、适用人群、交付说明" /></Field>
            <Field label="英文详细介绍"><textarea name="descriptionEn" rows={4} className="field" required placeholder="Product details and delivery notes" /></Field>
            <Field label="购买须知（中文）"><textarea name="purchaseNotice" rows={4} className="field" required placeholder="下单前需要用户确认的事项" /></Field>
            <Field label="购买须知（英文）"><textarea name="purchaseNoticeEn" rows={4} className="field" required placeholder="What buyers should confirm before ordering" /></Field>
            <Field label="售后说明（中文）"><textarea name="afterSale" rows={4} className="field" required placeholder="交付后如何售后、处理时效" /></Field>
            <Field label="售后说明（英文）"><textarea name="afterSaleEn" rows={4} className="field" required placeholder="After-sales rules and processing time" /></Field>
            <Field label="规格中文名"><input name="variantNameZh" className="field" required placeholder="如 1个月" /></Field>
            <Field label="规格英文名"><input name="variantNameEn" className="field" required placeholder="e.g. 1 month" /></Field>
            <Field label="SKU"><input name="sku" className="field" required placeholder="GPT-PLUS-1M" /></Field>
            <Field label="标签（选填）"><input name="badge" className="field" placeholder="如 热门" /></Field>
            <Field label="交付方式">
              <select name="deliveryType" className="field"><option value="CODE">卡密 CODE</option><option value="TEXT">文本 TEXT</option><option value="LINK">链接 LINK</option><option value="MANUAL">人工 MANUAL</option></select>
            </Field>
            <Field label="库存模式">
              <select name="stockMode" className="field"><option value="INVENTORY">库存池</option><option value="UNLIMITED">不限库存</option><option value="MANUAL">人工容量</option></select>
            </Field>
            <Field label="人民币价格"><input name="priceCny" className="field" required type="number" min="0" step="0.01" placeholder="0.00" /></Field>
            <Field label="美元价格（选填）" hint="不填则前台 USD 按站点汇率换算">
              <input name="priceUsd" className="field" type="number" min="0" step="0.01" placeholder="0.00" />
            </Field>
            <Field label="商品图片 URL（选填）" hint="可留空，前台会显示默认图标" className="md:col-span-2">
              <input name="image" className="field" placeholder="https://..." />
            </Field>
            <Field label="固定交付内容（选填）" hint="LINK / TEXT 可填写固定内容；库存型请到库存页添加" className="md:col-span-2">
              <textarea name="deliveryContent" rows={3} className="field" placeholder="下载链接或固定文本" />
            </Field>
            <label className="flex items-center gap-2 pt-6 text-sm text-slate-400">
              <input type="checkbox" name="featured" />首页推荐
            </label>
            <Field label="首页排序" hint="数字越小越靠前。仅勾选推荐的商品会出现在首页。">
              <input name="sort" className="field" type="number" defaultValue="10" />
            </Field>
            {error && <p className="text-sm text-rose-300 md:col-span-2">{error}</p>}
            <div className="flex gap-2 md:col-span-2"><button className="button-primary">保存商品</button><button type="button" onClick={() => setOpen(false)} className="button-secondary">取消</button></div>
          </form>
        </Modal>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="text-xs text-slate-500">
            <tr>
              <th className="p-4">商品</th>
              <th>分类</th>
              <th>规格 / SKU</th>
              <th>价格</th>
              <th className="w-[88px]">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-white"
                  onClick={() => updateQuery({ order: sortDir === "asc" ? "desc" : "asc" })}
                  aria-label={sortDir === "asc" ? "当前按排序正序，点击改为倒序" : "当前按排序倒序，点击改为正序"}
                  title={sortDir === "asc" ? "正序：数字从小到大。点击改为倒序" : "倒序：数字从大到小。点击改为正序"}
                >
                  排序
                  {sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </th>
              <th>状态</th>
              <th className="pr-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-sm text-slate-500">没有符合条件的商品</td>
              </tr>
            ) : null}
            {products.map((product) => {
              const variant = product.variants[0];
              const cny = variant?.prices.find((price) => price.currency === "CNY" && price.amountMinor > 0);
              const usd = variant?.prices.find((price) => price.currency === "USD" && price.amountMinor > 0);
              return (
                <tr key={product.id} className="border-t border-white/8">
                  <td className="p-4"><strong className="block">{product.nameZh}</strong><span className="text-xs text-slate-500">/{product.slug}</span></td>
                  <td className="text-slate-400">{product.category.nameZh}</td>
                  <td><span className="block">{variant?.nameZh}</span><span className="text-xs text-slate-500">{variant?.sku}</span></td>
                  <td>
                    <span className="block">{cny ? formatMoney(cny.amountMinor, "CNY") : "—"}</span>
                    <span className="mt-1 block text-xs text-slate-500">{usd ? formatMoney(usd.amountMinor, "USD") : "USD 按汇率"}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => mutate(product.id, "PATCH", { featured: !product.featured }, product.featured ? "已取消首页推荐" : "已设为首页推荐")}
                        className={`${iconActionClass} ${product.featured ? "text-amber-300" : "text-slate-500"}`}
                        title={product.featured ? "取消首页推荐" : "设为首页推荐"}
                        aria-label={product.featured ? "取消首页推荐" : "设为首页推荐"}
                      >
                        <Star size={13} className={product.featured ? "fill-current" : undefined} />
                      </button>
                      <input
                        key={`${product.id}-${product.sort}`}
                        type="number"
                        className="admin-sort-input"
                        defaultValue={product.sort}
                        title="首页排序，数字越小越靠前"
                        aria-label="首页排序"
                        onBlur={(event) => {
                          const sort = Number(event.target.value) || 0;
                          if (sort !== product.sort) mutate(product.id, "PATCH", { sort }, "首页排序已更新");
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") event.currentTarget.blur();
                        }}
                      />
                    </div>
                  </td>
                  <td className="text-xs text-sky-300">{statusLabel(publishStatusLabels, product.status)}</td>
                  <td>
                    <div className="flex items-center justify-end gap-1 pr-4">
                      <button type="button" onClick={() => setEditingProductId(product.id)} className="button-secondary button-compact"><Pencil size={12} />编辑</button>
                      {variant && <button type="button" onClick={() => setEditingVariantId(variant.id)} className="button-secondary button-compact"><Pencil size={12} />价格</button>}
                      <button
                        type="button"
                        onClick={() => mutate(product.id, "PATCH", { status: product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }, product.status === "ACTIVE" ? "商品已下架" : "商品已上架")}
                        className={iconActionClass}
                        title="切换上下架"
                        aria-label="切换上下架"
                      >
                        <Power size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => mutate(product.id, "DELETE", undefined, "商品已删除")}
                        className={`${iconActionClass} hover:text-rose-300`}
                        title="删除"
                        aria-label="删除"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <AdminPagination page={page} totalPages={totalPages} total={total} label="个商品" />
      {editingProduct && (
        <Modal title={`编辑商品：${editingProduct.nameZh}`} onClose={() => setEditingProductId(null)}>
          <form onSubmit={updateProduct} className="grid gap-4 md:grid-cols-2">
            <Field label="分类">
              <select name="categoryId" className="field" required defaultValue={editingProduct.categoryId}><option value="">选择分类</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.nameZh}</option>)}</select>
            </Field>
            <Field label="URL slug">
              <input name="slug" className="field" required pattern="[a-z0-9-]+" defaultValue={editingProduct.slug} />
            </Field>
            <Field label="商品中文名"><input name="nameZh" className="field" required defaultValue={editingProduct.nameZh} /></Field>
            <Field label="商品英文名"><input name="nameEn" className="field" required defaultValue={editingProduct.nameEn} /></Field>
            <Field label="中文短描述"><input name="shortDescZh" className="field" required defaultValue={editingProduct.shortDescZh} /></Field>
            <Field label="英文短描述"><input name="shortDescEn" className="field" required defaultValue={editingProduct.shortDescEn} /></Field>
            <Field label="中文详细介绍"><textarea name="descriptionZh" rows={5} className="field" required defaultValue={editingProduct.descriptionZh} /></Field>
            <Field label="英文详细介绍"><textarea name="descriptionEn" rows={5} className="field" required defaultValue={editingProduct.descriptionEn} /></Field>
            <Field label="购买须知（中文）"><textarea name="purchaseNotice" rows={4} className="field" required defaultValue={editingProduct.purchaseNotice} /></Field>
            <Field label="购买须知（英文）"><textarea name="purchaseNoticeEn" rows={4} className="field" required defaultValue={editingProduct.purchaseNoticeEn ?? ""} /></Field>
            <Field label="售后说明（中文）"><textarea name="afterSale" rows={4} className="field" required defaultValue={editingProduct.afterSale} /></Field>
            <Field label="售后说明（英文）"><textarea name="afterSaleEn" rows={4} className="field" required defaultValue={editingProduct.afterSaleEn ?? ""} /></Field>
            <Field label="商品图片 URL（选填）" hint="可留空，前台会显示默认图标">
              <input name="image" className="field" defaultValue={editingProduct.image ?? ""} placeholder="https://" />
            </Field>
            <Field label="标签（选填）"><input name="badge" className="field" defaultValue={editingProduct.badge ?? ""} placeholder="如 热门" /></Field>
            <label className="flex items-center gap-2 pt-6 text-sm text-slate-400">
              <input type="checkbox" name="featured" defaultChecked={editingProduct.featured} />首页推荐
            </label>
            <Field label="首页排序" hint="数字越小越靠前。仅勾选推荐的商品会出现在首页。">
              <input name="sort" className="field" type="number" defaultValue={editingProduct.sort} />
            </Field>
            {error && <p className="text-sm text-rose-300 md:col-span-2">{error}</p>}
            <div className="flex justify-end gap-2 md:col-span-2"><button type="button" className="button-secondary" onClick={() => setEditingProductId(null)}>取消</button><button className="button-primary">保存商品修改</button></div>
          </form>
        </Modal>
      )}
      {editingVariant && (
        <Modal title={`编辑价格：${editingVariant.sku}`} onClose={() => setEditingVariantId(null)}>
          <form onSubmit={updateVariant} className="grid gap-4 md:grid-cols-2">
            <Field label="规格中文名"><input name="nameZh" className="field" defaultValue={editingVariant.nameZh} required /></Field>
            <Field label="规格英文名"><input name="nameEn" className="field" defaultValue={editingVariant.nameEn} required /></Field>
            <Field label="交付方式">
              <select name="deliveryType" className="field" defaultValue={editingVariant.deliveryType}><option value="CODE">卡密 CODE</option><option value="TEXT">文本 TEXT</option><option value="LINK">链接 LINK</option><option value="MANUAL">人工 MANUAL</option></select>
            </Field>
            <Field label="库存模式">
              <select name="stockMode" className="field" defaultValue={editingVariant.stockMode}><option value="INVENTORY">库存池</option><option value="UNLIMITED">不限库存</option><option value="MANUAL">人工容量</option></select>
            </Field>
            <Field label="人民币价格"><input name="priceCny" className="field" type="number" step="0.01" min="0" defaultValue={(editingVariant.prices.find((p) => p.currency === "CNY")?.amountMinor ?? 0) / 100} required /></Field>
            <Field label="美元价格（选填）" hint="留空则按站点汇率换算美元价">
              <input name="priceUsd" className="field" type="number" step="0.01" min="0" defaultValue={editingUsdMinor > 0 ? editingUsdMinor / 100 : ""} placeholder="0.00" />
            </Field>
            <Field label="固定交付内容（选填）" hint="卡密库存请在库存页添加，这里只填 LINK / TEXT 的固定内容" className="md:col-span-2">
              <textarea name="deliveryContent" className="field" rows={4} defaultValue={editingVariant.deliveryContent ?? ""} />
            </Field>
            {error && <p className="text-sm text-rose-300 md:col-span-2">{error}</p>}
            <div className="flex gap-2 md:col-span-2"><button className="button-primary">保存价格</button><button type="button" className="button-secondary" onClick={() => setEditingVariantId(null)}>取消</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
