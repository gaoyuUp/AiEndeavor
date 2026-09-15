import { ArrowUpRight } from "lucide-react";
import { domesticPlatforms, internationalPlatforms, type AiPlatform } from "@/lib/ai-platforms";
import type { Locale } from "@/lib/preferences";

function PlatformCard({ platform, locale }: { platform: AiPlatform; locale: Locale }) {
  const name = locale === "zh" ? platform.nameZh : platform.nameEn;
  const vendor = locale === "zh" ? platform.vendorZh : platform.vendorEn;
  return (
    <a
      href={platform.href}
      target="_blank"
      rel="noopener noreferrer"
      className="platform-card group"
      aria-label={`${name} · ${vendor}`}
    >
      <span className={`platform-mark${platform.darkMark ? " platform-mark-dark" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={platform.icon} alt="" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold leading-5 text-[var(--foreground)] sm:text-sm">{name}</span>
        <span className="mt-0.5 block truncate text-[11px] leading-4 text-[var(--muted)]">{vendor}</span>
      </span>
      <ArrowUpRight size={14} className="platform-card-arrow" aria-hidden="true" />
    </a>
  );
}

function PlatformGroup({
  title,
  hint,
  platforms,
  locale,
}: {
  title: string;
  hint: string;
  platforms: AiPlatform[];
  locale: Locale;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2.5 sm:mb-4">
        <span className="h-3.5 w-1 rounded-full bg-sky-400" aria-hidden="true" />
        <h3 className="text-sm font-semibold tracking-tight text-[var(--foreground)] sm:text-[15px]">{title}</h3>
        <span className="text-[11px] text-[var(--muted)] sm:text-xs">{hint}</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {platforms.map((platform) => (
          <PlatformCard key={platform.href} platform={platform} locale={locale} />
        ))}
      </div>
    </div>
  );
}

export function AiPlatformNav({ locale }: { locale: Locale }) {
  return (
    <div id="ai-nav" className="mt-10 w-full text-left sm:mt-12">
      <div className="mb-7 sm:mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-sky-400">
          {locale === "zh" ? "官方入口" : "Official links"}
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
          {locale === "zh" ? "AI 平台导航" : "AI platform directory"}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          {locale === "zh" ? "认准官方入口，谨防钓鱼网站。" : "Use official sites only."}
        </p>
      </div>
      <div className="space-y-8 sm:space-y-10">
        <PlatformGroup
          title={locale === "zh" ? "国内平台" : "Domestic"}
          hint={locale === "zh" ? "国产大模型" : "China models"}
          platforms={domesticPlatforms}
          locale={locale}
        />
        <PlatformGroup
          title={locale === "zh" ? "国际平台" : "International"}
          hint={locale === "zh" ? "海外主流 AI" : "Global AI"}
          platforms={internationalPlatforms}
          locale={locale}
        />
      </div>
    </div>
  );
}
