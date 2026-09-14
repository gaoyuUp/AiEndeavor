import { cn } from "@/lib/utils";

/** Geometric scan reticle — vector only, follows currentColor. */
export function BrandMarkGlyph({ title }: { title?: string } = {}) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden={title ? undefined : true} role={title ? "img" : undefined}>
      {title ? <title>{title}</title> : null}
      <path d="M14 24V14h10" stroke="currentColor" strokeWidth="3.6" strokeLinecap="square" />
      <path d="M50 24V14H40" stroke="currentColor" strokeWidth="3.6" strokeLinecap="square" />
      <path d="M14 40v10h10" stroke="currentColor" strokeWidth="3.6" strokeLinecap="square" />
      <path d="M50 40v10H40" stroke="currentColor" strokeWidth="3.6" strokeLinecap="square" />
      <circle cx="32" cy="32" r="13.25" stroke="currentColor" strokeWidth="3.4" />
      <path d="M32 28.1 35.9 32 32 35.9 28.1 32Z" fill="currentColor" />
    </svg>
  );
}

export function BrandMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <span className={cn("brand-mark", className)} style={{ width: size, height: size }}>
      <BrandMarkGlyph />
    </span>
  );
}
