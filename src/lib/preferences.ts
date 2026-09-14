import { cookies } from "next/headers";

export type Locale = "zh" | "en";
export type Currency = "CNY" | "USD";
export type Theme = "dark" | "light";

export async function getPreferences() {
  const store = await cookies();
  const locale: Locale = store.get("locale")?.value === "en" ? "en" : "zh";
  const currency: Currency = store.get("currency")?.value === "USD" ? "USD" : "CNY";
  const theme: Theme = store.get("theme")?.value === "light" ? "light" : "dark";
  return { locale, currency, theme };
}

export const copy = {
  zh: {
    home: "首页",
    products: "产品中心",
    process: "购买流程",
    lookup: "查订单",
    help: "帮助中心",
    browse: "浏览产品",
    heroTitle: "AI 服务，从这里开始",
    heroSubtitle: "精选可靠的 AI 数字服务。透明价格、清晰交付，购买无需注册。",
    featured: "热门服务",
    featuredSub: "从高频 AI 工具到专业数字服务，按需选择。",
    categories: "服务分类",
    allProducts: "查看全部产品",
    buy: "立即购买",
    stock: "库存",
    available: "有货",
    manual: "人工交付",
    footer: "让优质 AI 服务更简单、更透明。",
  },
  en: {
    home: "Home",
    products: "Products",
    process: "How it works",
    lookup: "Order lookup",
    help: "Help",
    browse: "Browse products",
    heroTitle: "Your AI services, simplified",
    heroSubtitle: "Curated AI digital services with transparent pricing and clear delivery. No account required.",
    featured: "Featured services",
    featuredSub: "Choose from popular AI tools and professional digital services.",
    categories: "Categories",
    allProducts: "View all products",
    buy: "Buy now",
    stock: "Stock",
    available: "Available",
    manual: "Manual delivery",
    footer: "Making quality AI services simple and transparent.",
  },
} as const;
