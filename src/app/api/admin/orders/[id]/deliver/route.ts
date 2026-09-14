import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({ content: z.string().min(1).max(10000) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { id } = await params;
  try {
    const { content } = schema.parse(await request.json());
    const order = await db.order.findUnique({ where: { id } });
    if (!order || order.paymentStatus !== "PAID") return NextResponse.json({ error: "订单未支付或不存在" }, { status: 409 });
    await db.$transaction([
      db.deliveryRecord.create({ data: { orderId: id, type: "MANUAL", content, deliveredBy: admin.id } }),
      db.order.update({ where: { id }, data: { orderStatus: "COMPLETED", deliveryStatus: "DELIVERED", completedAt: new Date() } }),
      db.auditLog.create({ data: { adminId: admin.id, action: "DELIVER", entityType: "order", entityId: id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "交付失败" }, { status: 422 });
  }
}
