import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amountMinor: number, currency = "CNY", locale = "zh-CN") {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "zh-CN", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "CNY" || currency === "USD" ? 2 : 0,
  }).format(amountMinor / 100);
}

export function publicId(prefix: string) {
  const date = new Date();
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
  return `${prefix}${stamp}${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}

export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
