import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({ email: z.email(), password: z.string().min(8).max(200) });

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const admin = await db.admin.findUnique({ where: { email: input.email.trim().toLowerCase() } });
    if (!admin || !admin.active || !(await compare(input.password, admin.passwordHash))) {
      return NextResponse.json({ error: "邮箱或密码不正确" }, { status: 401 });
    }
    await createAdminSession(admin.id);
    await db.auditLog.create({ data: { adminId: admin.id, action: "LOGIN", entityType: "admin", entityId: admin.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof z.ZodError ? "请输入有效的邮箱和密码" : "登录失败" }, { status: 422 });
  }
}
