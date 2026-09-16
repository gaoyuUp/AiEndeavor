import { cn } from "@/lib/utils";

export function BrandMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <span className={cn("brand-mark", className)} style={{ width: size, height: size }} aria-hidden>
      <img src="/brand/icon-dark.svg" alt="" className="brand-mark-img brand-mark-img-dark" />
      <img src="/brand/icon-light.svg" alt="" className="brand-mark-img brand-mark-img-light" />
    </span>
  );
}
