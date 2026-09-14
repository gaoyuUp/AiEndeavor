import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { expireDueOrders } from "@/lib/orders";

export async function GET(request: Request) {
  if (!(await getAdmin())) return NextResponse.json({ error: "未登录" }, { status: 401 });
  await expireDueOrders();
  const params = new URL(request.url).searchParams;
  const q = params.get("q") || undefined;
  const status = params.get("status") || undefined;
  const payment = params.get("payment") || undefined;
  const category = params.get("category") || undefined;
  const orders = await db.order.findMany({
    where: {
      ...(q ? { OR: [{ orderNo: { contains: q } }, { contact: { contains: q } }] } : {}),
      ...(status ? { orderStatus: status as never } : {}),
      ...(payment ? { paymentStatus: payment as never } : {}),
      ...(category ? { items: { some: { product: { categoryId: category } } } } : {}),
    },
    include: { items: true, payments: true, deliveryRecords: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(orders);
}
