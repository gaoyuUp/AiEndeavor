import { AdminInventoryManager } from "@/components/admin-inventory-manager";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const admin = await requireAdmin();
  const variants = await db.productVariant.findMany({
    where: { stockMode: "INVENTORY" },
    include: { product: true, _count: { select: { inventoryItems: { where: { status: "AVAILABLE" } } } } },
    orderBy: { createdAt: "desc" },
  });
  return <AdminShell admin={admin} title="库存管理"><AdminInventoryManager variants={variants} /></AdminShell>;
}
