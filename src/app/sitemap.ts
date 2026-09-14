import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const products = await db.product.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } });
  const staticRoutes = ["", "/products", "/faq", "/support", "/orders/lookup", "/pages/about", "/pages/refund", "/pages/privacy", "/pages/terms"];
  return [
    ...staticRoutes.map((route) => ({ url: `${baseUrl}${route}`, lastModified: new Date() })),
    ...products.map((product) => ({ url: `${baseUrl}/products/${product.slug}`, lastModified: product.updatedAt })),
  ];
}
