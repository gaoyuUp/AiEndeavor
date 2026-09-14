import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  productId: z.string().min(1),
  nameZh: z.string().min(1),
  nameEn: z.string().min(1),
  sku: z.string().min(2).max(60),
  deliveryType: z.enum(["CODE", "TEXT", "LINK", "MANUAL"]),
  stockMode: z.enum(["UNLIMITED", "INVENTORY", "MANUAL"]),
  deliveryContent: z.string().optional(),
  priceCny: z.number().int().nonnegative(),
  priceUsd: z.number().int().positive().nullable().optional(),
});

export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const input = schema.parse(await request.json());
    const variant = await db.productVariant.create({
      data: {
        productId: input.productId,
        nameZh: input.nameZh,
        nameEn: input.nameEn,
        sku: input.sku,
        deliveryType: input.deliveryType,
        stockMode: input.stockMode,
        deliveryContent: input.deliveryContent || null,
        prices: {
          create: [
            { currency: "CNY", amountMinor: input.priceCny },
            ...(input.priceUsd != null ? [{ currency: "USD", amountMinor: input.priceUsd }] : []),
          ],
        },
      },
    });
    await db.auditLog.create({ data: { adminId: admin.id, action: "CREATE", entityType: "variant", entityId: variant.id } });
    return NextResponse.json(variant, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "创建失败" }, { status: 422 });
  }
}
