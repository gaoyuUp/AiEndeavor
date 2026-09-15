import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeFavicon } from "@/components/theme-favicon";
import { getPreferences } from "@/lib/preferences";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const { theme } = await getPreferences();
  const tone = theme === "light" ? "light" : "dark";
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: {
      default: "灵搜AI｜极简 AI 数字服务商城",
      template: "%s｜灵搜AI",
    },
    description: "精选 AI 数字服务，透明价格、清晰交付、可靠售后。",
    keywords: ["AI 服务", "ChatGPT", "Claude", "数字服务", "灵搜AI"],
    icons: {
      icon: [
        { url: `/brand/icon-${tone}-32.png?v=lingsou3`, type: "image/png", sizes: "32x32" },
        { url: `/brand/icon-${tone}.svg?v=lingsou3`, type: "image/svg+xml" },
      ],
      apple: "/brand/apple-touch.png?v=lingsou3",
    },
    openGraph: {
      title: "灵搜AI｜AI 服务，从这里开始",
      description: "精选 AI 数字服务，简单购买，清晰交付。",
      type: "website",
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { theme } = await getPreferences();
  return (
    <html lang="zh-CN" className="h-full antialiased" data-theme={theme}>
      <body className="min-h-full">
        <ThemeFavicon />
        {children}
      </body>
    </html>
  );
}
