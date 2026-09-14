import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  nameZh: z.string().min(1).max(80).optional(),
  nameEn: z.string().min(1).max(80).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  sort: z.coerce.number().int().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { id } = await params;
  try {
    const category = await db.category.update({ where: { id }, data: schema.parse(await request.json()) });
    await db.auditLog.create({ data: { adminId: admin.id, action: "UPDATE", entityType: "category", entityId: id } });
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "更新失败" }, { status: 422 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { id } = await params;
  if (await db.product.count({ where: { categoryId: id } })) {
    return NextResponse.json({ error: "分类下仍有商品，不能删除" }, { status: 409 });
  }
  await db.category.delete({ where: { id } });
  await db.auditLog.create({ data: { adminId: admin.id, action: "DELETE", entityType: "category", entityId: id } });
  return NextResponse.json({ ok: true });
}
