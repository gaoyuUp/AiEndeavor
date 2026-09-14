import { createHmac, timingSafeEqual } from "node:crypto";

export type PaymentRequest = {
  orderNo: string;
  amountMinor: number;
  currency: string;
  method: "qrcode" | "usdt";
};

export type PaymentSession = {
  provider: string;
  transactionId: string;
  checkoutUrl: string;
  signature: string;
};

const secret = () => process.env.AUTH_SECRET ?? "development-only-secret";

export function signMockPayment(input: PaymentRequest & { transactionId: string }) {
  return createHmac("sha256", secret())
    .update(`${input.orderNo}:${input.amountMinor}:${input.currency}:${input.method}:${input.transactionId}`)
    .digest("hex");
}

export function verifyMockPayment(input: PaymentRequest & { transactionId: string; signature: string }) {
  const expected = Buffer.from(signMockPayment(input), "hex");
  const actual = Buffer.from(input.signature, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export const mockPaymentProvider = {
  createSession(input: PaymentRequest): PaymentSession {
    const transactionId = `MOCK-${crypto.randomUUID()}`;
    const signature = signMockPayment({ ...input, transactionId });
    return {
      provider: input.method,
      transactionId,
      signature,
      checkoutUrl: `/pay/${input.orderNo}`,
    };
  },
};
