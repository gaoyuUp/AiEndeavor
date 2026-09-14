import { revalidatePath } from "next/cache";
import { AdminShell } from "@/components/admin-shell";
import { FxRateField } from "@/components/fx-rate-field";
import { AdminToastForm } from "@/components/admin-toast";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatUsdCnyRate, parseUsdCnyRate } from "@/lib/fx";

export const dynamic = "force-dynamic";

const fields = [
  ["site_name", "站点名称", "灵搜AI"],
  ["logo_url", "Logo URL", ""],
  ["support_email", "客服邮箱", "support@example.com"],
  ["telegram", "Telegram", ""],
  ["seo_description", "SEO 描述", "精选 AI 数字服务"],
  ["usdt_wallet_bep20", "USDT BEP20 收款地址", "0xDEMO0000000000000000000000000000BEP20"],
  ["usdt_cny_rate", "CNY / USDT 汇率", "7.00"],
  ["payment_notice", "支付页说明", "请按订单金额完成支付。电子收款码到账后由管理员人工核对；USDT 仅支持 BNB Smart Chain（BEP20）。"],
] as const;

function settingText(value: unknown) {
  return typeof value === "string" ? value : "";
}

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();
  const settings = await db.siteSetting.findMany();
  const values = Object.fromEntries(settings.map((item) => [item.key, settingText(item.value)]));

  async function save(formData: FormData) {
    "use server";
    const current = await requireAdmin();
    await db.$transaction(fields.map(([key]) => {
      const raw = String(formData.get(key) ?? "");
      const value = key === "usdt_cny_rate" ? formatUsdCnyRate(parseUsdCnyRate(raw)) : raw;
      return db.siteSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }));
    await db.auditLog.create({ data: { adminId: current.id, action: "UPDATE", entityType: "settings" } });
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/admin/settings");
  }

  return (
    <AdminShell admin={admin} title="站点设置">
      <AdminToastForm action={save} success="设置已保存" className="card max-w-2xl space-y-5 p-6">
        {fields.map(([key, label, placeholder]) => (
          key === "usdt_cny_rate" ? (
            <FxRateField key={values.usdt_cny_rate || "7.00"} defaultValue={values.usdt_cny_rate || "7.00"} />
          ) : (
            <div key={key}>
              <label className="label" htmlFor={key}>{label}</label>
              <input id={key} name={key} className="field" defaultValue={values[key] ?? ""} placeholder={placeholder} />
            </div>
          )
        ))}
        <button className="button-primary">保存设置</button>
      </AdminToastForm>
    </AdminShell>
  );
}
