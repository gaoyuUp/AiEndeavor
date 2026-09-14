import { revalidatePath } from "next/cache";
import { AdminShell } from "@/components/admin-shell";
import { AdminToastForm } from "@/components/admin-toast";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const admin = await requireAdmin();
  const announcements = await db.announcement.findMany({ orderBy: [{ sort: "asc" }, { createdAt: "desc" }] });

  async function create(formData: FormData) {
    "use server";
    const current = await requireAdmin();
    const item = await db.announcement.create({
      data: {
        titleZh: String(formData.get("titleZh")),
        titleEn: String(formData.get("titleEn")),
        contentZh: String(formData.get("contentZh")),
        contentEn: String(formData.get("contentEn")),
      },
    });
    await db.auditLog.create({ data: { adminId: current.id, action: "CREATE", entityType: "announcement", entityId: item.id } });
    revalidatePath("/");
    revalidatePath("/admin/announcements");
  }

  async function toggle(formData: FormData) {
    "use server";
    await requireAdmin();
    const id = String(formData.get("id"));
    const status = String(formData.get("status")) === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await db.announcement.update({ where: { id }, data: { status } });
    revalidatePath("/");
    revalidatePath("/admin/announcements");
  }

  return (
    <AdminShell admin={admin} title="公告管理">
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <AdminToastForm action={create} success="公告已发布" className="card h-fit space-y-3 p-5">
          <h2 className="text-sm font-semibold">新增公告</h2>
          <input name="titleZh" required className="field" placeholder="中文标题" />
          <input name="titleEn" required className="field" placeholder="English title" />
          <textarea name="contentZh" required className="field" rows={3} placeholder="首页中文公告内容" />
          <textarea name="contentEn" required className="field" rows={3} placeholder="Homepage English announcement" />
          <button className="button-primary w-full">发布公告</button>
        </AdminToastForm>
        <div className="space-y-3">
          {announcements.map((item) => (
            <div key={item.id} className="card flex items-start justify-between gap-4 p-5">
              <div><strong className="text-sm">{item.titleZh}</strong><p className="mt-2 text-sm text-slate-400">{item.contentZh}</p></div>
              <AdminToastForm action={toggle} success="公告状态已更新"><input type="hidden" name="id" value={item.id} /><input type="hidden" name="status" value={item.status} /><button className="button-secondary min-h-8 px-3">{item.status === "ACTIVE" ? "停用" : "启用"}</button></AdminToastForm>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
