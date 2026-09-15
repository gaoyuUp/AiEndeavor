import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  categoryId: z.string().min(1),
  nameZh: z.string().min(1).max(120),
  nameEn: z.string().min(1).max(120),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  shortDescZh: z.string().min(1).max(500),
  shortDescEn: z.string().min(1).max(500),
  descriptionZh: z.string().min(1),
  descriptionEn: z.string().min(1),
  purchaseNotice: z.string().min(1),
  purchaseNoticeEn: z.string().min(1),
  afterSale: z.string().min(1),
  afterSaleEn: z.string().min(1),
  image: z.string().optional(),
  badge: z.string().max(30).optional(),
  featured: z.boolean().default(false),
  sort: z.coerce.number().int().default(0),
  variantNameZh: z.string().min(1),
  variantNameEn: z.string().min(1),
  sku: z.string().min(2).max(60),
  deliveryType: z.enum(["CODE", "TEXT", "LINK", "MANUAL"]),
  stockMode: z.enum(["UNLIMITED", "INVENTORY", "MANUAL"]),
  deliveryContent: z.string().optional(),
  priceCny: z.number().int().nonnegative(),
  priceUsd: z.number().int().positive().nullable().optional(),
  originalCny: z.number().int().positive().nullable().optional(),
  originalUsd: z.number().int().positive().nullable().optional(),
});

export async function GET() {
  if (!(await getAdmin())) return NextResponse.json({ error: "未登录" }, { status: 401 });
  return NextResponse.json(await db.product.findMany({ include: { category: true, variants: { include: { prices: true } } }, orderBy: { createdAt: "desc" } }));
}

export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const input = schema.parse(await request.json());
    const product = await db.product.create({
      data: {
        categoryId: input.categoryId,
        nameZh: input.nameZh,
        nameEn: input.nameEn,
        slug: input.slug,
        shortDescZh: input.shortDescZh,
        shortDescEn: input.shortDescEn,
        descriptionZh: input.descriptionZh,
        descriptionEn: input.descriptionEn,
        purchaseNotice: input.purchaseNotice,
        purchaseNoticeEn: input.purchaseNoticeEn,
        afterSale: input.afterSale,
        afterSaleEn: input.afterSaleEn,
        image: input.image || null,
        badge: input.badge || null,
        featured: input.featured,
        sort: input.sort,
        status: "ACTIVE",
        variants: {
          create: {
            nameZh: input.variantNameZh,
            nameEn: input.variantNameEn,
            sku: input.sku,
            deliveryType: input.deliveryType,
            stockMode: input.stockMode,
            deliveryContent: input.deliveryContent || null,
            originalCnyMinor: input.originalCny ?? null,
            originalUsdMinor: input.originalUsd ?? null,
            prices: {
              create: [
                { currency: "CNY", amountMinor: input.priceCny },
                ...(input.priceUsd != null ? [{ currency: "USD", amountMinor: input.priceUsd }] : []),
              ],
            },
          },
        },
      },
    });
    await db.auditLog.create({ data: { adminId: admin.id, action: "CREATE", entityType: "product", entityId: product.id } });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "创建失败" }, { status: 422 });
  }
}
