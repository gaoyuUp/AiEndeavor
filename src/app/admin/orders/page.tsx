import { AdminOrderManager } from "@/components/admin-order-manager";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { expireDueOrders } from "@/lib/orders";
import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { paymentStatusLabels, statusLabel } from "@/lib/status-labels";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 15;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; payment?: string; category?: string; page?: string }>;
}) {
  const [admin, { q, status, payment, category, page: pageParam }] = await Promise.all([requireAdmin(), searchParams]);
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  await expireDueOrders();
  const validStatus = status && Object.values(OrderStatus).includes(status as OrderStatus) ? status as OrderStatus : undefined;
  const validPayment = payment && Object.values(PaymentStatus).includes(payment as PaymentStatus) ? payment as PaymentStatus : undefined;
  const where: Prisma.OrderWhereInput = {
    ...(q ? { OR: [{ orderNo: { contains: q } }, { contact: { contains: q } }] } : {}),
    ...(validStatus ? { orderStatus: validStatus } : {}),
    ...(validPayment ? { paymentStatus: validPayment } : {}),
    ...(category ? { items: { some: { product: { categoryId: category } } } } : {}),
  };
  const [orders, categories, total] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        items: true,
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
        paymentProofs: { orderBy: { createdAt: "asc" } },
        proofRejections: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.category.findMany({ orderBy: { sort: "asc" } }),
    db.order.count({ where }),
  ]);
  return (
    <AdminShell admin={admin} title="订单与交付">
      <form className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_180px_180px_180px_auto]">
        <input className="field sm:col-span-2 xl:col-span-1" name="q" defaultValue={q} placeholder="搜索订单号或联系方式" />
        <select className="field" name="status" defaultValue={status ?? ""}>
          <option value="">全部订单状态</option>
          <option value="PENDING_PAYMENT">待支付</option>
          <option value="PAYMENT_REVIEW">待确认收款</option>
          <option value="PROCESSING">充值/交付中</option>
          <option value="COMPLETED">已完成</option>
          <option value="EXPIRED">已失效</option>
          <option value="ABNORMAL">异常订单</option>
          <option value="REFUNDED">已退款</option>
        </select>
        <select className="field" name="payment" defaultValue={payment ?? ""}>
          <option value="">全部支付状态</option>
          {Object.values(PaymentStatus).map((value) => (
            <option key={value} value={value}>{statusLabel(paymentStatusLabels, value)}</option>
          ))}
        </select>
        <select className="field" name="category" defaultValue={category ?? ""}>
          <option value="">全部商品分类</option>
          {categories.map((item) => <option key={item.id} value={item.id}>{item.nameZh}</option>)}
        </select>
        <button className="button-primary sm:col-span-2 xl:col-span-1">筛选</button>
      </form>
      <AdminOrderManager orders={orders} page={page} total={total} totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))} />
    </AdminShell>
  );
}
