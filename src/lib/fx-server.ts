import { cache } from "react";
import { db } from "@/lib/db";
import { parseUsdCnyRate } from "@/lib/fx";

export const getUsdCnyRate = cache(async () => {
  const row = await db.siteSetting.findUnique({ where: { key: "usdt_cny_rate" } });
  return parseUsdCnyRate(row?.value);
});
