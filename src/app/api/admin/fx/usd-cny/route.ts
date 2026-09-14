import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { FRANKFURTER_USD_CNY_URL, formatUsdCnyRate, parseFrankfurterUsdCny } from "@/lib/fx";

export async function GET() {
  if (!(await getAdmin())) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const response = await fetch(FRANKFURTER_USD_CNY_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("汇率接口暂时不可用");
    const parsed = parseFrankfurterUsdCny(await response.json());
    return NextResponse.json({
      rate: Number(formatUsdCnyRate(parsed.rate)),
      date: parsed.date,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "获取汇率失败" }, { status: 502 });
  }
}
