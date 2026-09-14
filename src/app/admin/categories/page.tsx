import { AdminCategoryManager } from "@/components/admin-category-manager";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const admin = await requireAdmin();
  const categories = await db.category.findMany({ orderBy: { sort: "asc" } });
  return <AdminShell admin={admin} title="分类管理"><AdminCategoryManager categories={categories} /></AdminShell>;
}
