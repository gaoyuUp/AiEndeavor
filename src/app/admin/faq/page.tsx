import { revalidatePath } from "next/cache";
import { AdminShell } from "@/components/admin-shell";
import { AdminToastForm } from "@/components/admin-toast";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminFaqPage() {
  const admin = await requireAdmin();
  const faqs = await db.faq.findMany({ orderBy: { sort: "asc" } });

  async function create(formData: FormData) {
    "use server";
    const current = await requireAdmin();
    const faq = await db.faq.create({
      data: {
        questionZh: String(formData.get("questionZh")),
        questionEn: String(formData.get("questionEn")),
        answerZh: String(formData.get("answerZh")),
        answerEn: String(formData.get("answerEn")),
      },
    });
    await db.auditLog.create({ data: { adminId: current.id, action: "CREATE", entityType: "faq", entityId: faq.id } });
    revalidatePath("/faq");
    revalidatePath("/admin/faq");
  }

  return (
    <AdminShell admin={admin} title="FAQ 管理">
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <AdminToastForm action={create} success="FAQ 已添加" className="card h-fit space-y-3 p-5">
          <input name="questionZh" required className="field" placeholder="中文问题" />
          <input name="questionEn" required className="field" placeholder="English question" />
          <textarea name="answerZh" required className="field" rows={4} placeholder="中文答案" />
          <textarea name="answerEn" required className="field" rows={4} placeholder="English answer" />
          <button className="button-primary w-full">新增 FAQ</button>
        </AdminToastForm>
        <div className="space-y-3">
          {faqs.map((faq) => <div key={faq.id} className="card p-5"><strong className="text-sm">{faq.questionZh}</strong><p className="mt-2 text-sm leading-6 text-slate-400">{faq.answerZh}</p></div>)}
        </div>
      </div>
    </AdminShell>
  );
}
