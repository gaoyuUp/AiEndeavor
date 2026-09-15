import { cn, formatMoney } from "@/lib/utils";

type Amount = { currency: string; amountMinor: number };

export function PriceDisplay({
  price,
  original,
  locale,
  currentClassName,
  originalClassName,
  className,
  layout = "inline",
  reserveOriginal = false,
}: {
  price: Amount | null;
  original?: Amount | null;
  locale: string;
  currentClassName?: string;
  originalClassName?: string;
  className?: string;
  layout?: "inline" | "stack";
  reserveOriginal?: boolean;
}) {
  const showOriginal = Boolean(original && original.amountMinor > 0);
  const originalEl = showOriginal && original ? (
    <span className={cn("font-normal text-slate-400 line-through decoration-slate-500/80", originalClassName)}>
      {formatMoney(original.amountMinor, original.currency, locale)}
    </span>
  ) : reserveOriginal ? (
    <span className={cn("invisible select-none", originalClassName)} aria-hidden="true">0</span>
  ) : null;
  const currentEl = (
    <span className={currentClassName}>
      {price ? formatMoney(price.amountMinor, price.currency, locale) : "—"}
    </span>
  );

  return (
    <span
      className={cn(
        layout === "stack"
          ? "inline-flex flex-col items-start gap-0.5"
          : "inline-flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5",
        className,
      )}
    >
      {layout === "stack" ? (
        <>
          {originalEl}
          {currentEl}
        </>
      ) : (
        <>
          {currentEl}
          {originalEl}
        </>
      )}
    </span>
  );
}
