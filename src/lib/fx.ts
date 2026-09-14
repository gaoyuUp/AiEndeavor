export const DEFAULT_USD_CNY_RATE = 7;
export const FRANKFURTER_USD_CNY_URL = "https://api.frankfurter.dev/v2/rates?base=USD&quotes=CNY";

export type PricePoint = {
  currency: string;
  amountMinor: number;
  active?: boolean;
};

export type ResolvedPrice = {
  currency: "CNY" | "USD";
  amountMinor: number;
  converted: boolean;
};

export function parseUsdCnyRate(value: unknown, fallback = DEFAULT_USD_CNY_RATE) {
  const raw = typeof value === "number" ? value : Number(typeof value === "string" ? value.trim() : "");
  if (!Number.isFinite(raw) || raw < 0.5 || raw > 50) return fallback;
  return raw;
}

export function formatUsdCnyRate(rate: number) {
  return String(Number(rate.toFixed(4)));
}

export function listedAmountMinor(prices: PricePoint[], currency: "CNY" | "USD") {
  const row = prices.find((price) => price.currency === currency && price.active !== false && price.amountMinor > 0);
  return row?.amountMinor ?? null;
}

export function cnyMinorToUsdMinor(cnyMinor: number, usdCnyRate: number) {
  const rate = parseUsdCnyRate(usdCnyRate, Number.NaN);
  if (!Number.isFinite(rate)) return 0;
  return Math.max(1, Math.round(cnyMinor / rate));
}

export function usdtAmountFromCnyMinor(cnyMinor: number, cnyPerUsdt: number) {
  const rate = parseUsdCnyRate(cnyPerUsdt);
  return Number((cnyMinor / 100 / rate).toFixed(2));
}

export function settlementCnyMinor(
  order: { currency: string; totalMinor: number },
  listedCnyMinor: number | null,
  usdCnyRate: number,
) {
  if (order.currency === "CNY") return order.totalMinor;
  if (listedCnyMinor != null) return listedCnyMinor;
  return Math.round(order.totalMinor * parseUsdCnyRate(usdCnyRate));
}

export function resolveStorePrice(
  prices: PricePoint[],
  currency: "CNY" | "USD",
  usdCnyRate: number,
): ResolvedPrice | null {
  const cnyMinor = listedAmountMinor(prices, "CNY");
  if (currency === "CNY") {
    return cnyMinor != null ? { currency: "CNY", amountMinor: cnyMinor, converted: false } : null;
  }
  const usdMinor = listedAmountMinor(prices, "USD");
  if (usdMinor != null) return { currency: "USD", amountMinor: usdMinor, converted: false };
  if (cnyMinor == null) return null;
  return {
    currency: "USD",
    amountMinor: cnyMinorToUsdMinor(cnyMinor, usdCnyRate),
    converted: true,
  };
}

export function parseFrankfurterUsdCny(payload: unknown): { rate: number; date: string } {
  if (Array.isArray(payload) && payload[0] && typeof payload[0] === "object") {
    const row = payload[0] as { rate?: unknown; date?: unknown; quote?: unknown };
    const rate = Number(row.rate);
    if (Number.isFinite(rate) && rate > 0 && (row.quote == null || row.quote === "CNY")) {
      return { rate, date: typeof row.date === "string" ? row.date : "" };
    }
  }
  if (payload && typeof payload === "object" && "rates" in payload) {
    const body = payload as { base?: unknown; date?: unknown; rates?: { CNY?: unknown } };
    const rate = Number(body.rates?.CNY);
    if (Number.isFinite(rate) && rate > 0) {
      return { rate, date: typeof body.date === "string" ? body.date : "" };
    }
  }
  throw new Error("汇率接口返回格式无效");
}

export function optionalUsdMinor(raw: unknown) {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  const amount = Number(text);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}
