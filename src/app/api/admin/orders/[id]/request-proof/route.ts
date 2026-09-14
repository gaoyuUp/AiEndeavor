import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { StoreError } from "@/lib/orders";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { id } = await params;
  try {
    const order = await db.order.findUnique({
      where: { id },
      include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    if (!order || order.orderStatus !== "PAYMENT_REVIEW") {
      throw new StoreError("只有待确认收款的订单可以要求上传凭证", 409);
    }
    if (order.proofRequested) {
      return NextResponse.json({ ok: true, alreadyRequested: true });
    }
    await db.order.update({ where: { id: order.id }, data: { proofRequested: true } });
    await db.auditLog.create({
      data: { adminId: admin.id, action: "REQUEST_PAYMENT_PROOF", entityType: "order", entityId: order.id },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof StoreError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "操作失败" }, { status });
  }
}
