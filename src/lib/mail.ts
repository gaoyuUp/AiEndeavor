import nodemailer from "nodemailer";

export type MailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

export function getMailConfig(): MailConfig {
  const host = process.env.SMTP_HOST?.trim() ?? "";
  const user = process.env.SMTP_USER?.trim() ?? "";
  const pass = process.env.SMTP_PASS?.trim() ?? "";
  const from = process.env.SMTP_FROM?.trim() ?? "";
  const port = Number(process.env.SMTP_PORT || 587);
  if (!host || !user || !pass || !from || !Number.isFinite(port) || port <= 0) {
    throw new Error("邮件服务未配置。请在 .env 中设置 SMTP_HOST、SMTP_PORT、SMTP_USER、SMTP_PASS、SMTP_FROM。");
  }
  return { host, port, secure: port === 465, user, pass, from };
}

export function isMailConfigured() {
  try {
    getMailConfig();
    return true;
  } catch {
    return false;
  }
}

function transporter() {
  const config = getMailConfig();
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  });
}

export async function sendMail(options: { to: string; subject: string; text: string; html?: string }) {
  const config = getMailConfig();
  try {
    await transporter().sendMail({
      from: config.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
  } catch (error) {
    throw new Error(formatMailError(error));
  }
}

function formatMailError(error: unknown) {
  const message = error instanceof Error ? error.message : "邮件发送失败";
  if (/unauthorized ip/i.test(message)) {
    return "邮件服务拒绝了当前服务器 IP。请到 Brevo 后台把本机公网 IP 加入 SMTP 授权名单后再试。";
  }
  if (/invalid login/i.test(message)) {
    return `SMTP 登录失败：${message}`;
  }
  return message;
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wrapHtml(title: string, body: string) {
  return `<!doctype html>
<html><body style="margin:0;background:#090d17;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e2e8f0;">
  <div style="max-width:560px;margin:0 auto;background:#111827;border:1px solid rgba(148,163,184,.16);border-radius:16px;padding:24px;">
    <p style="margin:0 0 16px;font-size:13px;letter-spacing:.08em;color:#38bdf8;">LINGSOU AI</p>
    <h1 style="margin:0 0 16px;font-size:20px;color:#f8fafc;">${escapeHtml(title)}</h1>
    ${body}
  </div>
</body></html>`;
}

export async function sendTicketReplyEmail(input: {
  to: string;
  siteName: string;
  ticketNo: string;
  subject: string;
  message: string;
  reply: string;
  orderNo?: string;
}) {
  const orderLine = input.orderNo ? `订单号：${input.orderNo}\n` : "";
  const text = `${input.siteName} 售后回复

工单号：${input.ticketNo}
${orderLine}主题：${input.subject}

你的问题：
${input.message}

处理结果：
${input.reply}

如仍有疑问，请携带工单号再次提交售后工单。`;

  const extra = input.orderNo
    ? `<p style="margin:0 0 12px;font-size:13px;color:#94a3b8;">订单号：${escapeHtml(input.orderNo)}</p>`
    : "";

  await sendMail({
    to: input.to,
    subject: `【${input.siteName}】工单 ${input.ticketNo} 处理结果`,
    text,
    html: wrapHtml("工单处理结果", `
      <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">工单号：${escapeHtml(input.ticketNo)}</p>
      ${extra}
      <p style="margin:0 0 16px;font-size:15px;color:#f8fafc;">${escapeHtml(input.subject)}</p>
      <p style="margin:0 0 6px;font-size:12px;color:#64748b;">你的问题</p>
      <pre style="margin:0 0 16px;white-space:pre-wrap;font:inherit;color:#cbd5e1;">${escapeHtml(input.message)}</pre>
      <p style="margin:0 0 6px;font-size:12px;color:#64748b;">处理结果</p>
      <pre style="margin:0;white-space:pre-wrap;font:inherit;color:#bbf7d0;">${escapeHtml(input.reply)}</pre>
    `),
  });
}

export async function sendMailTest(to: string) {
  await sendMail({
    to,
    subject: "灵搜AI 邮件测试",
    text: "这是一封来自灵搜AI 后台的测试邮件。如果你收到它，说明当前 SMTP 配置可用。",
    html: wrapHtml("邮件测试成功", `<p style="margin:0;line-height:1.7;color:#cbd5e1;">这是一封来自灵搜AI 后台的测试邮件。如果你收到它，说明当前 SMTP 配置可用。</p>`),
  });
}
