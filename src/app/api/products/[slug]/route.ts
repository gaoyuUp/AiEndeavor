import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveStorePrice } from "@/lib/fx";
import { getUsdCnyRate } from "@/lib/fx-server";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const usdCnyRate = await getUsdCnyRate();
  const product = await db.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      category: true,
      variants: {
        where: { status: "ACTIVE" },
        select: {
          id: true,
          nameZh: true,
          nameEn: true,
          sku: true,
          deliveryType: true,
          stockMode: true,
          prices: { where: { active: true }, select: { currency: true, amountMinor: true } },
          _count: { select: { inventoryItems: { where: { status: "AVAILABLE" } } } },
        },
        orderBy: { sort: "asc" },
      },
    },
  });
  if (!product) return NextResponse.json({ error: "商品不存在" }, { status: 404 });
  return NextResponse.json({
    ...product,
    variants: product.variants.map((variant) => ({
      ...variant,
      prices: ["CNY", "USD"].flatMap((currency) => {
        const price = resolveStorePrice(variant.prices, currency as "CNY" | "USD", usdCnyRate);
        return price ? [{ currency: price.currency, amountMinor: price.amountMinor }] : [];
      }),
    })),
  });
}
