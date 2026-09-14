import { AdminProductManager } from "@/components/admin-product-manager";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const [admin, { page: pageParam }] = await Promise.all([requireAdmin(), searchParams]);
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const [products, categories, total] = await Promise.all([
    db.product.findMany({
      include: { category: true, variants: { include: { prices: true }, orderBy: { sort: "asc" } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.category.findMany({ orderBy: { sort: "asc" } }),
    db.product.count(),
  ]);
  return <AdminShell admin={admin} title="商品管理"><AdminProductManager products={products} categories={categories} page={page} total={total} totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))} /></AdminShell>;
}
