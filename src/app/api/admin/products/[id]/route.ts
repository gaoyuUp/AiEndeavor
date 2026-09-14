import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  categoryId: z.string().min(1).optional(),
  nameZh: z.string().min(1).max(120).optional(),
  nameEn: z.string().min(1).max(120).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  shortDescZh: z.string().min(1).max(500).optional(),
  shortDescEn: z.string().min(1).max(500).optional(),
  descriptionZh: z.string().min(1).optional(),
  descriptionEn: z.string().min(1).optional(),
  purchaseNotice: z.string().min(1).optional(),
  purchaseNoticeEn: z.string().optional(),
  afterSale: z.string().min(1).optional(),
  afterSaleEn: z.string().optional(),
  image: z.string().nullable().optional(),
  badge: z.string().max(30).nullable().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]).optional(),
  featured: z.boolean().optional(),
  sort: z.coerce.number().int().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { id } = await params;
  try {
    const product = await db.product.update({ where: { id }, data: schema.parse(await request.json()) });
    await db.auditLog.create({ data: { adminId: admin.id, action: "UPDATE", entityType: "product", entityId: id } });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "更新失败" }, { status: 422 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { id } = await params;
  const orderCount = await db.orderItem.count({ where: { productId: id } });
  if (orderCount) {
    await db.product.update({ where: { id }, data: { status: "INACTIVE" } });
    return NextResponse.json({ ok: true, archived: true });
  }
  await db.product.delete({ where: { id } });
  await db.auditLog.create({ data: { adminId: admin.id, action: "DELETE", entityType: "product", entityId: id } });
  return NextResponse.json({ ok: true });
}
