import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const sizes = {
  md: "size-14 rounded-[18px]",
  lg: "size-[4.5rem] rounded-[22px]",
};

export function ProductMark({
  src,
  alt,
  size = "md",
}: {
  src: string | null;
  alt: string;
  size?: keyof typeof sizes;
}) {
  return (
    <div
      className={cn(
        "product-mark relative shrink-0 overflow-hidden border border-white/10",
        src
          ? "bg-[#111827] shadow-[0_10px_22px_rgba(0,0,0,0.28)]"
          : "flex items-center justify-center bg-white/5 text-sky-300",
        sizes[size],
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="size-full object-cover" />
      ) : size === "lg" ? (
        <span className="text-2xl font-semibold">AI</span>
      ) : (
        <Sparkles size={21} />
      )}
    </div>
  );
}
