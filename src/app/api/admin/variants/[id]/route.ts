import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  nameZh: z.string().min(1).max(100),
  nameEn: z.string().min(1).max(100),
  deliveryType: z.enum(["CODE", "TEXT", "LINK", "MANUAL"]),
  stockMode: z.enum(["UNLIMITED", "INVENTORY", "MANUAL"]),
  deliveryContent: z.string().max(10000).optional(),
  priceCny: z.number().int().nonnegative(),
  priceUsd: z.number().int().positive().nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { id } = await params;
  try {
    const input = schema.parse(await request.json());
    await db.$transaction([
      db.productVariant.update({
        where: { id },
        data: {
          nameZh: input.nameZh,
          nameEn: input.nameEn,
          deliveryType: input.deliveryType,
          stockMode: input.stockMode,
          deliveryContent: input.deliveryContent || null,
        },
      }),
      db.variantPrice.upsert({
        where: { variantId_currency: { variantId: id, currency: "CNY" } },
        update: { amountMinor: input.priceCny, active: true },
        create: { variantId: id, currency: "CNY", amountMinor: input.priceCny },
      }),
      input.priceUsd == null
        ? db.variantPrice.deleteMany({ where: { variantId: id, currency: "USD" } })
        : db.variantPrice.upsert({
            where: { variantId_currency: { variantId: id, currency: "USD" } },
            update: { amountMinor: input.priceUsd, active: true },
            create: { variantId: id, currency: "USD", amountMinor: input.priceUsd },
          }),
      db.auditLog.create({ data: { adminId: admin.id, action: "UPDATE", entityType: "variant", entityId: id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "更新失败" }, { status: 422 });
  }
}
