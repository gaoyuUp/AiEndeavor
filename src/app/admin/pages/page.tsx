import { revalidatePath } from "next/cache";
import { AdminShell } from "@/components/admin-shell";
import { AdminToastForm } from "@/components/admin-toast";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminContentPages() {
  const admin = await requireAdmin();
  const pages = await db.contentPage.findMany({ orderBy: { slug: "asc" } });

  async function save(formData: FormData) {
    "use server";
    const current = await requireAdmin();
    const slug = String(formData.get("slug"));
    const page = await db.contentPage.upsert({
      where: { slug },
      update: {
        titleZh: String(formData.get("titleZh")),
        titleEn: String(formData.get("titleEn")),
        contentZh: String(formData.get("contentZh")),
        contentEn: String(formData.get("contentEn")),
      },
      create: {
        slug,
        titleZh: String(formData.get("titleZh")),
        titleEn: String(formData.get("titleEn")),
        contentZh: String(formData.get("contentZh")),
        contentEn: String(formData.get("contentEn")),
      },
    });
    await db.auditLog.create({ data: { adminId: current.id, action: "UPDATE", entityType: "content_page", entityId: page.id } });
    revalidatePath(`/pages/${slug}`);
    revalidatePath("/admin/pages");
  }

  return (
    <AdminShell admin={admin} title="内容页管理">
      <div className="space-y-5">
        {pages.map((page) => (
          <AdminToastForm key={page.id} action={save} success="内容已保存" className="card grid gap-3 p-5 md:grid-cols-2">
            <input type="hidden" name="slug" value={page.slug} />
            <div className="md:col-span-2"><span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">/{page.slug}</span></div>
            <input name="titleZh" className="field" defaultValue={page.titleZh} required />
            <input name="titleEn" className="field" defaultValue={page.titleEn} required />
            <textarea name="contentZh" className="field" rows={7} defaultValue={page.contentZh} required />
            <textarea name="contentEn" className="field" rows={7} defaultValue={page.contentEn} required />
            <div className="md:col-span-2"><button className="button-primary">保存内容</button></div>
          </AdminToastForm>
        ))}
      </div>
    </AdminShell>
  );
}
