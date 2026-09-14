import { AlertTriangle, Banknote, CalendarDays, CalendarRange, ClipboardList, Package, PackageOpen, Wallet } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { expireDueOrders } from "@/lib/orders";
import { orderStatusLabels, statusLabel } from "@/lib/status-labels";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

function startOfChinaDay(daysBack = 0) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return new Date(Date.UTC(value("year"), value("month") - 1, value("day") - daysBack, 0, 0, 0, 0) - 8 * 60 * 60 * 1000);
}

function paidCnyWhere(since?: Date) {
  return {
    paymentStatus: "PAID" as const,
    currency: "CNY",
    ...(since
      ? {
          OR: [
            { paidAt: { gte: since } },
            { paidAt: null, createdAt: { gte: since } },
          ],
        }
      : {}),
  };
}

export default async function AdminDashboard() {
  const admin = await requireAdmin();
  await expireDueOrders();
  const todayStart = startOfChinaDay(0);
  const weekStart = startOfChinaDay(6);
  const monthStart = startOfChinaDay(29);
  const [orderCount, revenue, pending, listedProducts, todayRevenue, weekRevenue, monthRevenue, lowStock, recentOrders] = await Promise.all([
    db.order.count(),
    db.order.aggregate({ where: paidCnyWhere(), _sum: { totalMinor: true } }),
    db.order.count({ where: { orderStatus: "PROCESSING" } }),
    db.product.count({ where: { status: "ACTIVE" } }),
    db.order.aggregate({ where: paidCnyWhere(todayStart), _sum: { totalMinor: true } }),
    db.order.aggregate({ where: paidCnyWhere(weekStart), _sum: { totalMinor: true } }),
    db.order.aggregate({ where: paidCnyWhere(monthStart), _sum: { totalMinor: true } }),
    db.productVariant.findMany({
      where: { stockMode: "INVENTORY", status: "ACTIVE" },
      include: { product: true, _count: { select: { inventoryItems: { where: { status: "AVAILABLE" } } } } },
    }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const alerts = lowStock.filter((item) => item._count.inventoryItems <= 3);
  const cards = [
    ["累计订单", String(orderCount), ClipboardList],
    ["人民币成交额", formatMoney(revenue._sum.totalMinor ?? 0, "CNY"), Banknote],
    ["待人工处理", String(pending), PackageOpen],
    ["库存预警", String(alerts.length), AlertTriangle],
    ["上架商品数量", String(listedProducts), Package],
    ["今日人民币成交额", formatMoney(todayRevenue._sum.totalMinor ?? 0, "CNY"), Wallet],
    ["近一周人民币成交额", formatMoney(weekRevenue._sum.totalMinor ?? 0, "CNY"), CalendarDays],
    ["近一月人民币成交额", formatMoney(monthRevenue._sum.totalMinor ?? 0, "CNY"), CalendarRange],
  ] as const;

  return (
    <AdminShell admin={admin} title="运营概览">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, Icon]) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between text-sm text-slate-400"><span>{label}</span><Icon size={16} /></div>
            <strong className="mt-4 block text-2xl">{value}</strong>
          </div>
        ))}
      </div>
      <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_320px]">
        <section className="card overflow-hidden">
          <h2 className="border-b border-white/8 p-5 text-sm font-semibold">最近订单</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="text-xs text-slate-500"><tr><th className="p-4">订单号</th><th>联系方式</th><th>金额</th><th>状态</th><th>时间</th></tr></thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-t border-white/6">
                    <td className="p-4 font-mono text-xs">{order.orderNo}</td>
                    <td className="text-slate-400">{order.contact}</td>
                    <td>{formatMoney(order.totalMinor, order.currency)}</td>
                    <td className="text-sky-300">{statusLabel(orderStatusLabels, order.orderStatus)}</td>
                    <td className="text-xs text-slate-500">{order.createdAt.toLocaleString("zh-CN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="card p-5">
          <h2 className="text-sm font-semibold">库存预警</h2>
          <div className="mt-4 space-y-3">
            {alerts.length ? alerts.map((item) => (
              <div key={item.id} className="rounded-xl border border-amber-300/10 bg-amber-300/5 p-3">
                <p className="text-sm">{item.product.nameZh} · {item.nameZh}</p>
                <p className="mt-1 text-xs text-amber-300">仅剩 {item._count.inventoryItems} 件</p>
              </div>
            )) : <p className="text-sm text-slate-500">当前无库存预警</p>}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
