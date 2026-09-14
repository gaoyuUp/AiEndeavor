"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { publishStatusLabels, statusLabel } from "@/lib/status-labels";
import type { Category } from "@prisma/client";
import { Pencil, Plus, Power, Trash2, X } from "lucide-react";
import { useAdminToast } from "@/components/admin-toast";

export function AdminCategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const toast = useAdminToast();
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = categories.find((category) => category.id === editingId);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "创建失败");
      toast.error(body.error ?? "创建失败");
      return;
    }
    event.currentTarget.reset();
    setError("");
    toast.success("分类已创建");
    router.refresh();
  }

  async function mutate(id: string, method: "PATCH" | "DELETE", body?: object, success = "分类已更新") {
    if (method === "DELETE" && !window.confirm("确定删除这个分类？")) return;
    const response = await fetch(`/api/admin/categories/${id}`, {
      method,
      headers: { "content-type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? "操作失败");
      toast.error(result.error ?? "操作失败");
      return;
    }
    toast.success(method === "DELETE" ? "分类已删除" : success);
    router.refresh();
  }

  async function update(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const response = await fetch(`/api/admin/categories/${editing.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? "更新失败");
      toast.error(result.error ?? "更新失败");
      return;
    }
    setEditingId(null);
    setError("");
    toast.success("分类已保存");
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <form onSubmit={create} className="card h-fit space-y-4 p-5">
        <h2 className="text-sm font-semibold">新增分类</h2>
        <input name="nameZh" className="field" required placeholder="中文名称" />
        <input name="nameEn" className="field" required placeholder="English name" />
        <input name="slug" className="field" required pattern="[a-z0-9-]+" placeholder="URL slug" />
        <input name="sort" className="field" type="number" defaultValue="0" placeholder="排序" />
        {error && <p className="text-xs text-rose-300">{error}</p>}
        <button className="button-primary w-full"><Plus size={15} />新增分类</button>
      </form>
      <div className="card overflow-hidden">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center gap-4 border-b border-white/8 p-4 last:border-0">
            <div className="min-w-0 flex-1">
              <strong className="block text-sm">{category.nameZh}</strong>
              <span className="text-xs text-slate-500">{category.nameEn} · /{category.slug}</span>
            </div>
            <span className="text-xs text-slate-500">{statusLabel(publishStatusLabels, category.status)}</span>
            <button onClick={() => setEditingId(category.id)} className="flex size-8 items-center justify-center rounded-lg border border-white/8 text-slate-400 hover:text-white" aria-label="编辑分类"><Pencil size={14} /></button>
            <button onClick={() => mutate(category.id, "PATCH", { status: category.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }, category.status === "ACTIVE" ? "分类已停用" : "分类已启用")} className="flex size-8 items-center justify-center rounded-lg border border-white/8 text-slate-400 hover:text-white" aria-label="切换状态"><Power size={14} /></button>
            <button onClick={() => mutate(category.id, "DELETE")} className="flex size-8 items-center justify-center rounded-lg border border-white/8 text-slate-400 hover:text-rose-300" aria-label="删除"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="编辑分类">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111827] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <h2 className="font-semibold">编辑分类</h2>
              <button onClick={() => setEditingId(null)} className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white" aria-label="关闭"><X size={17} /></button>
            </div>
            <form onSubmit={update} className="space-y-4 p-5">
              <div><label className="label">中文名称</label><input name="nameZh" className="field" required defaultValue={editing.nameZh} /></div>
              <div><label className="label">英文名称</label><input name="nameEn" className="field" required defaultValue={editing.nameEn} /></div>
              <div><label className="label">URL 标识</label><input name="slug" className="field" required pattern="[a-z0-9-]+" defaultValue={editing.slug} /></div>
              <div><label className="label">排序</label><input name="sort" className="field" type="number" required defaultValue={editing.sort} /></div>
              {error && <p className="text-xs text-rose-300">{error}</p>}
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setEditingId(null)} className="button-secondary">取消</button><button className="button-primary">保存修改</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
