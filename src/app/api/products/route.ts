import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveStorePrice } from "@/lib/fx";
import { getUsdCnyRate } from "@/lib/fx-server";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const category = params.get("category") || undefined;
  const q = params.get("q") || undefined;
  const usdCnyRate = await getUsdCnyRate();
  const products = await db.product.findMany({
    where: {
      status: "ACTIVE",
      ...(category ? { category: { slug: category } } : {}),
      ...(q ? { OR: [{ nameZh: { contains: q } }, { nameEn: { contains: q } }] } : {}),
    },
    include: {
      category: { select: { slug: true, nameZh: true, nameEn: true } },
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
      },
    },
    orderBy: { sort: "asc" },
  });
  return NextResponse.json(products.map((product) => ({
    ...product,
    variants: product.variants.map((variant) => ({
      ...variant,
      prices: ["CNY", "USD"].flatMap((currency) => {
        const price = resolveStorePrice(variant.prices, currency as "CNY" | "USD", usdCnyRate);
        return price ? [{ currency: price.currency, amountMinor: price.amountMinor }] : [];
      }),
    })),
  })));
}
