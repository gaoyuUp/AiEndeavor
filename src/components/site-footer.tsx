import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { copy, type Locale } from "@/lib/preferences";

const links = [
  { href: "/faq", zh: "常见问题", en: "FAQ" },
  { href: "/support", zh: "售后支持", en: "Support" },
  { href: "/pages/refund", zh: "退款政策", en: "Refund policy" },
  { href: "/pages/privacy", zh: "隐私政策", en: "Privacy" },
  { href: "/pages/terms", zh: "服务条款", en: "Terms" },
  { href: "/pages/about", zh: "关于我们", en: "About" },
];

export function SiteFooter({ locale }: { locale: Locale }) {
  return (
    <footer className="mt-24 border-t border-white/8 bg-black/10">
      <div className="container-shell grid gap-10 py-12 md:grid-cols-[1fr_auto]">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <BrandMark size={22} />
            灵搜AI
          </div>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">{copy[locale].footer}</p>
        </div>
        <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm text-slate-400 sm:grid-cols-3">
          {links.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-white">
              {locale === "zh" ? item.zh : item.en}
            </Link>
          ))}
        </div>
      </div>
      <div className="border-t border-white/6 py-5 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} 灵搜AI. All rights reserved.
      </div>
    </footer>
  );
}
