import { describe, expect, it } from "vitest";
import { formatMoney, publicId } from "./utils";

describe("money and public identifiers", () => {
  it("formats minor units without floating-point arithmetic", () => {
    expect(formatMoney(13800, "CNY", "zh")).toContain("138.00");
  });

  it("creates non-guessable prefixed identifiers", () => {
    const first = publicId("SD");
    const second = publicId("SD");
    expect(first).toMatch(/^SD\d{8}[A-F0-9]{10}$/);
    expect(first).not.toBe(second);
  });
});
