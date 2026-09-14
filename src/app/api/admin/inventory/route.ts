import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  variantId: z.string().min(1),
  content: z.string().trim().min(1).max(10000).refine((value) => !/[\r\n]/.test(value), "每次只能添加一条库存内容"),
});

export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const input = schema.parse(await request.json());
    const variant = await db.productVariant.findUnique({ where: { id: input.variantId } });
    if (!variant || variant.stockMode !== "INVENTORY") return NextResponse.json({ error: "请选择库存池套餐" }, { status: 422 });
    const item = await db.inventoryItem.create({ data: { variantId: input.variantId, content: input.content } });
    await db.auditLog.create({ data: { adminId: admin.id, action: "CREATE", entityType: "inventory", entityId: item.id } });
    return NextResponse.json({ id: item.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.issues[0]?.message ?? "请检查库存内容"
      : error instanceof Error ? error.message : "添加失败";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
