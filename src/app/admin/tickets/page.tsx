import { revalidatePath } from "next/cache";
import { AdminShell } from "@/components/admin-shell";
import { AdminToastForm } from "@/components/admin-toast";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { isMailConfigured, sendMailTest, sendTicketReplyEmail } from "@/lib/mail";
import { statusLabel, ticketStatusLabels } from "@/lib/status-labels";

export const dynamic = "force-dynamic";

async function siteName() {
  const setting = await db.siteSetting.findUnique({ where: { key: "site_name" } });
  return typeof setting?.value === "string" && setting.value.trim() ? setting.value.trim() : "灵搜AI";
}

export default async function AdminTicketsPage() {
  const admin = await requireAdmin();
  const tickets = await db.supportTicket.findMany({ include: { order: true }, orderBy: { createdAt: "desc" } });
  const mailReady = isMailConfigured();

  async function sendTest(formData: FormData) {
    "use server";
    await requireAdmin();
    const to = String(formData.get("to") ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { error: "请填写有效邮箱" };
    try {
      await sendMailTest(to);
    } catch (error) {
      return { error: error instanceof Error ? error.message : "发送失败" };
    }
  }

  async function resolve(formData: FormData) {
    "use server";
    const current = await requireAdmin();
    const id = String(formData.get("id"));
    const reply = String(formData.get("reply") ?? "").trim();
    if (!reply) return { error: "请填写处理结果" };
    const ticket = await db.supportTicket.findUnique({ where: { id }, include: { order: true } });
    if (!ticket) return { error: "工单不存在" };
    if (ticket.status === "RESOLVED") return { error: "工单已解决" };
    try {
      await sendTicketReplyEmail({
        to: ticket.email,
        siteName: await siteName(),
        ticketNo: ticket.ticketNo,
        subject: ticket.subject,
        message: ticket.message,
        reply,
        orderNo: ticket.order?.orderNo,
      });
    } catch (error) {
      return { error: error instanceof Error ? error.message : "邮件发送失败" };
    }
    await db.supportTicket.update({ where: { id }, data: { reply, status: "RESOLVED" } });
    await db.auditLog.create({ data: { adminId: current.id, action: "RESOLVE", entityType: "ticket", entityId: id } });
    revalidatePath("/admin/tickets");
  }

  return (
    <AdminShell admin={admin} title="售后工单">
      <div className="space-y-4">
        <section className="card space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">邮件发送</h2>
              <p className="mt-1 text-xs text-slate-500">
                {mailReady
                  ? "SMTP 已配置。处理工单时会把回复发到用户邮箱；也可以先发一封测试邮件确认通道。"
                  : "尚未配置 SMTP。请在 .env 中填写 SMTP_HOST / SMTP_USER / SMTP_PASS / SMTP_FROM。"}
              </p>
            </div>
            <span className={`text-xs ${mailReady ? "text-emerald-300" : "text-rose-300"}`}>{mailReady ? "已就绪" : "未配置"}</span>
          </div>
          <AdminToastForm action={sendTest} success="测试邮件已发出，请检查收件箱（含垃圾箱）" className="flex flex-col gap-2 sm:flex-row">
            <input name="to" type="email" required defaultValue={admin.email} className="field" placeholder="测试收件邮箱" />
            <button className="button-primary shrink-0" disabled={!mailReady}>发送测试邮件</button>
          </AdminToastForm>
        </section>

        {tickets.length === 0 ? (
          <p className="card p-8 text-center text-sm text-slate-500">当前没有售后工单。</p>
        ) : null}

        {tickets.map((ticket) => (
          <article key={ticket.id} className="card p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <strong className="font-mono text-sm">{ticket.ticketNo}</strong>
                <span className="ml-3 text-xs text-slate-500">{ticket.email}</span>
              </div>
              <span className="text-xs text-sky-300">{statusLabel(ticketStatusLabels, ticket.status)}</span>
            </div>
            <h2 className="mt-4 text-sm font-semibold">{ticket.subject}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">{ticket.message}</p>
            {ticket.order && <p className="mt-2 font-mono text-xs text-slate-600">订单：{ticket.order.orderNo}</p>}
            {ticket.status !== "RESOLVED" ? (
              <AdminToastForm action={resolve} success="回复已发送，工单已标记为已解决" className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input type="hidden" name="id" value={ticket.id} />
                <input name="reply" required className="field" placeholder="填写处理结果，将发送到用户邮箱" />
                <button className="button-primary shrink-0">发送回复并解决</button>
              </AdminToastForm>
            ) : (
              <p className="mt-4 rounded-xl bg-emerald-400/6 p-3 text-sm text-emerald-200">{ticket.reply}</p>
            )}
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
