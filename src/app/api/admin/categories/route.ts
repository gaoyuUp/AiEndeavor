import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  nameZh: z.string().min(1).max(80),
  nameEn: z.string().min(1).max(80),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  sort: z.coerce.number().int().default(0),
});

export async function GET() {
  if (!(await getAdmin())) return NextResponse.json({ error: "未登录" }, { status: 401 });
  return NextResponse.json(await db.category.findMany({ orderBy: { sort: "asc" } }));
}

export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const input = schema.parse(await request.json());
    const category = await db.category.create({ data: input });
    await db.auditLog.create({ data: { adminId: admin.id, action: "CREATE", entityType: "category", entityId: category.id } });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "创建失败" }, { status: 422 });
  }
}
