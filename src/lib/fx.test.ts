import { describe, expect, it } from "vitest";
import {
  cnyMinorToUsdMinor,
  optionalUsdMinor,
  parseFrankfurterUsdCny,
  parseUsdCnyRate,
  resolveOriginalPrice,
  resolveStorePrice,
  settlementCnyMinor,
  originalUsdtAmount,
  usdtAmountFromCnyMinor,
} from "./fx";

describe("USD/CNY store pricing", () => {
  it("uses a listed USD price when the product has one", () => {
    const price = resolveStorePrice(
      [
        { currency: "CNY", amountMinor: 13800 },
        { currency: "USD", amountMinor: 1999 },
      ],
      "USD",
      7.12,
    );
    expect(price).toEqual({ currency: "USD", amountMinor: 1999, converted: false });
  });

  it("converts from CNY with the site rate when USD is not set", () => {
    const price = resolveStorePrice([{ currency: "CNY", amountMinor: 13800 }], "USD", 7.12);
    expect(price?.converted).toBe(true);
    expect(price?.amountMinor).toBe(cnyMinorToUsdMinor(13800, 7.12));
    expect(price?.amountMinor).toBe(1938);
  });

  it("ignores a zero USD row and falls back to the rate", () => {
    const price = resolveStorePrice(
      [
        { currency: "CNY", amountMinor: 3900 },
        { currency: "USD", amountMinor: 0 },
      ],
      "USD",
      7,
    );
    expect(price).toEqual({ currency: "USD", amountMinor: 557, converted: true });
  });

  it("parses both frankfurter payload shapes", () => {
    expect(parseFrankfurterUsdCny({ base: "USD", date: "2026-09-14", rates: { CNY: 7.12 } })).toEqual({
      rate: 7.12,
      date: "2026-09-14",
    });
    expect(parseFrankfurterUsdCny([{ date: "2026-09-14", base: "USD", quote: "CNY", rate: 6.7058 }])).toEqual({
      rate: 6.7058,
      date: "2026-09-14",
    });
  });

  it("settles QR payment in listed CNY even if the order was stored as USD", () => {
    expect(settlementCnyMinor({ currency: "USD", totalMinor: 1999 }, 13800, 7)).toBe(13800);
    expect(settlementCnyMinor({ currency: "CNY", totalMinor: 13800 }, 13800, 7)).toBe(13800);
  });

  it("converts CNY to USDT with the site rate", () => {
    expect(usdtAmountFromCnyMinor(13800, 7)).toBe(19.71);
  });

  it("treats a blank USD form value as unset", () => {
    expect(optionalUsdMinor("")).toBeNull();
    expect(optionalUsdMinor("19.99")).toBe(1999);
    expect(parseUsdCnyRate("0")).toBe(7);
    expect(parseUsdCnyRate("7.1256")).toBe(7.1256);
  });

  it("hides original price when neither original CNY nor USD is set", () => {
    expect(resolveOriginalPrice({ originalCnyMinor: null, originalUsdMinor: null }, "CNY", 7)).toBeNull();
    expect(resolveOriginalPrice({ originalCnyMinor: 0, originalUsdMinor: 0 }, "USD", 7)).toBeNull();
  });

  it("uses listed original USD when set, otherwise converts original CNY", () => {
    expect(resolveOriginalPrice({ originalCnyMinor: 19800, originalUsdMinor: 2999 }, "USD", 7)).toEqual({
      currency: "USD",
      amountMinor: 2999,
      converted: false,
    });
    const converted = resolveOriginalPrice({ originalCnyMinor: 19800, originalUsdMinor: null }, "USD", 7.12);
    expect(converted?.converted).toBe(true);
    expect(converted?.amountMinor).toBe(cnyMinorToUsdMinor(19800, 7.12));
  });

  it("uses listed original USD for USDT, otherwise converts original CNY", () => {
    expect(originalUsdtAmount({ originalCnyMinor: 19800, originalUsdMinor: 2799 }, 7)).toBe(27.99);
    expect(originalUsdtAmount({ originalCnyMinor: 19800, originalUsdMinor: null }, 7)).toBe(28.29);
    expect(originalUsdtAmount({ originalCnyMinor: null, originalUsdMinor: null }, 7)).toBeNull();
  });
});
