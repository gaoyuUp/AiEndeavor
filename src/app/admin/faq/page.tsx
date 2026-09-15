import { revalidatePath } from "next/cache";
import { AdminFaqList } from "@/components/admin-faq-manager";
import { AdminShell } from "@/components/admin-shell";
import { AdminToastForm } from "@/components/admin-toast";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function readFaqFields(formData: FormData) {
  const questionZh = String(formData.get("questionZh") ?? "").trim();
  const questionEn = String(formData.get("questionEn") ?? "").trim();
  const answerZh = String(formData.get("answerZh") ?? "").trim();
  const answerEn = String(formData.get("answerEn") ?? "").trim();
  if (!questionZh || !questionEn || !answerZh || !answerEn) {
    return { error: "请填写完整的中英文问答" as const };
  }
  return { questionZh, questionEn, answerZh, answerEn };
}

export default async function AdminFaqPage() {
  const admin = await requireAdmin();
  const faqs = await db.faq.findMany({ orderBy: [{ sort: "asc" }, { createdAt: "asc" }] });

  async function create(formData: FormData) {
    "use server";
    const current = await requireAdmin();
    const fields = readFaqFields(formData);
    if ("error" in fields) return fields;
    const last = await db.faq.aggregate({ _max: { sort: true } });
    const faq = await db.faq.create({
      data: { ...fields, sort: (last._max.sort ?? -1) + 1 },
    });
    await db.auditLog.create({ data: { adminId: current.id, action: "CREATE", entityType: "faq", entityId: faq.id } });
    revalidatePath("/faq");
    revalidatePath("/admin/faq");
  }

  async function update(formData: FormData) {
    "use server";
    const current = await requireAdmin();
    const id = String(formData.get("id") ?? "").trim();
    if (!id) return { error: "FAQ 不存在" };
    const fields = readFaqFields(formData);
    if ("error" in fields) return fields;
    await db.faq.update({ where: { id }, data: fields });
    await db.auditLog.create({ data: { adminId: current.id, action: "UPDATE", entityType: "faq", entityId: id } });
    revalidatePath("/faq");
    revalidatePath("/admin/faq");
  }

  async function remove(formData: FormData) {
    "use server";
    const current = await requireAdmin();
    const id = String(formData.get("id") ?? "").trim();
    if (!id) return { error: "FAQ 不存在" };
    await db.faq.delete({ where: { id } });
    await db.auditLog.create({ data: { adminId: current.id, action: "DELETE", entityType: "faq", entityId: id } });
    revalidatePath("/faq");
    revalidatePath("/admin/faq");
  }

  return (
    <AdminShell admin={admin} title="FAQ 管理">
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <AdminToastForm action={create} success="FAQ 已添加" className="card h-fit space-y-3 p-5">
          <h2 className="text-sm font-semibold">新增 FAQ</h2>
          <input name="questionZh" required className="field" placeholder="中文问题" />
          <input name="questionEn" required className="field" placeholder="English question" />
          <textarea name="answerZh" required className="field" rows={4} placeholder="中文答案" />
          <textarea name="answerEn" required className="field" rows={4} placeholder="English answer" />
          <button className="button-primary w-full">新增 FAQ</button>
        </AdminToastForm>
        <AdminFaqList faqs={faqs} update={update} remove={remove} />
      </div>
    </AdminShell>
  );
}
