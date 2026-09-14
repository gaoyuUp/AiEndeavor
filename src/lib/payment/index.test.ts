import { describe, expect, it } from "vitest";
import { signMockPayment, verifyMockPayment } from "./index";

const request = {
  orderNo: "SD20260911TEST",
  amountMinor: 13800,
  currency: "CNY",
  method: "qrcode" as const,
  transactionId: "MOCK-TEST",
};

describe("mock payment signature", () => {
  it("accepts an untampered server signature", () => {
    const signature = signMockPayment(request);
    expect(verifyMockPayment({ ...request, signature })).toBe(true);
  });

  it("rejects a changed amount", () => {
    const signature = signMockPayment(request);
    expect(verifyMockPayment({ ...request, amountMinor: 1, signature })).toBe(false);
  });
});
