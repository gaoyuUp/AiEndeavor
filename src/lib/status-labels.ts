export type StatusLocale = "zh" | "en";
type LabelValue = string | [string, string];
type LabelMap = Record<string, LabelValue>;

export const orderStatusLabels: LabelMap = {
  PENDING_PAYMENT: ["待支付", "Awaiting payment"],
  PAYMENT_REVIEW: ["待确认收款", "Payment review"],
  PAID: ["已支付", "Paid"],
  PROCESSING: ["交付处理中", "Processing"],
  COMPLETED: ["已完成", "Completed"],
  EXPIRED: ["已失效", "Expired"],
  CANCELLED: ["已取消", "Cancelled"],
  REFUNDED: ["已退款", "Refunded"],
  ABNORMAL: ["异常订单", "Abnormal"],
};

export const paymentStatusLabels: LabelMap = {
  PENDING: ["待支付", "Awaiting payment"],
  SUBMITTED: ["已提交待确认", "Pending confirmation"],
  PAID: ["已支付", "Paid"],
  FAILED: ["支付失败", "Payment failed"],
  CANCELLED: ["已取消", "Cancelled"],
  REFUNDED: ["已退款", "Refunded"],
};

export const deliveryStatusLabels: LabelMap = {
  PENDING: ["未交付", "Not delivered"],
  PROCESSING: ["待交付", "Pending delivery"],
  DELIVERED: ["已交付", "Delivered"],
  FAILED: ["交付失败", "Delivery failed"],
};

export const publishStatusLabels: LabelMap = {
  DRAFT: "草稿",
  ACTIVE: "已上架",
  INACTIVE: "已下架",
};

export const ticketStatusLabels: LabelMap = {
  OPEN: "待处理",
  PROCESSING: "处理中",
  RESOLVED: "已解决",
  CLOSED: "已关闭",
};

export const paymentMethodLabels: LabelMap = {
  mock: ["模拟支付（旧订单）", "Mock payment (legacy)"],
  wechat: ["微信支付（旧订单）", "WeChat Pay (legacy)"],
  alipay: ["支付宝（旧订单）", "Alipay (legacy)"],
  qrcode: ["电子收款码", "Collection QR"],
  usdt: ["USDT（BEP20）", "USDT (BEP20)"],
};

export function statusLabel(labels: LabelMap, status: string, locale: StatusLocale = "zh") {
  const value = labels[status];
  if (!value) return status;
  if (Array.isArray(value)) return locale === "zh" ? value[0] : value[1];
  return value;
}
