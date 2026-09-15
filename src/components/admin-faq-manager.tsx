"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Faq } from "@prisma/client";
import { Pencil, Trash2, X } from "lucide-react";
import { useAdminToast } from "@/components/admin-toast";

type ActionResult = void | { error?: string };

export function AdminFaqList({
  faqs,
  update,
  remove,
}: {
  faqs: Faq[];
  update: (formData: FormData) => Promise<ActionResult>;
  remove: (formData: FormData) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const toast = useAdminToast();
  const [editing, setEditing] = useState<Faq | null>(null);
  const [deleting, setDeleting] = useState<Faq | null>(null);
  const [pending, setPending] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || pending) return;
    setPending(true);
    try {
      const result = await update(new FormData(event.currentTarget));
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("FAQ 已保存");
      setEditing(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setPending(false);
    }
  }

  async function confirmDelete() {
    if (!deleting || pending) return;
    setPending(true);
    try {
      const formData = new FormData();
      formData.set("id", deleting.id);
      const result = await remove(formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("FAQ 已删除");
      setDeleting(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="space-y-3">
        {faqs.length === 0 ? <div className="card p-5 text-sm text-slate-400">还没有 FAQ，先在左侧添加一条。</div> : null}
        {faqs.map((faq) => (
          <div key={faq.id} className="card flex items-start justify-between gap-4 p-5">
            <div className="min-w-0">
              <strong className="text-sm">{faq.questionZh}</strong>
              <p className="mt-2 text-sm leading-6 text-slate-400">{faq.answerZh}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" className="button-secondary button-compact" onClick={() => setEditing(faq)}>
                <Pencil size={12} />
                编辑
              </button>
              <button type="button" className="button-secondary button-compact text-rose-300 hover:text-rose-200" onClick={() => setDeleting(faq)}>
                <Trash2 size={12} />
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="faq-edit-title">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111827] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <h2 id="faq-edit-title" className="font-semibold">编辑 FAQ</h2>
              <button type="button" onClick={() => !pending && setEditing(null)} className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white" aria-label="关闭">
                <X size={17} />
              </button>
            </div>
            <form onSubmit={save} className="space-y-4 p-5">
              <input type="hidden" name="id" value={editing.id} />
              <div>
                <label className="label">中文问题</label>
                <input name="questionZh" className="field" required defaultValue={editing.questionZh} />
              </div>
              <div>
                <label className="label">English question</label>
                <input name="questionEn" className="field" required defaultValue={editing.questionEn} />
              </div>
              <div>
                <label className="label">中文答案</label>
                <textarea name="answerZh" className="field" rows={4} required defaultValue={editing.answerZh} />
              </div>
              <div>
                <label className="label">English answer</label>
                <textarea name="answerEn" className="field" rows={4} required defaultValue={editing.answerEn} />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="button-secondary" disabled={pending} onClick={() => setEditing(null)}>取消</button>
                <button className="button-primary" disabled={pending}>{pending ? "保存中..." : "保存修改"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="faq-delete-title">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111827] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <h2 id="faq-delete-title" className="font-semibold">确认删除</h2>
              <button type="button" onClick={() => !pending && setDeleting(null)} className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white" aria-label="关闭">
                <X size={17} />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <p className="text-sm leading-6 text-slate-300">确定删除「{deleting.questionZh}」吗？删除后前台不再展示，且不可恢复。</p>
              <div className="flex justify-end gap-2">
                <button type="button" className="button-secondary" disabled={pending} onClick={() => setDeleting(null)}>取消</button>
                <button type="button" className="button-primary bg-rose-400 hover:bg-rose-300" disabled={pending} onClick={confirmDelete}>
                  {pending ? "删除中..." : "确认删除"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
