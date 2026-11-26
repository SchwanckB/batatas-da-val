import { TINTS } from "@/lib/data";
import { cn } from "@/lib/format";
import type { Product } from "@/lib/types";
import { DishArt } from "./DishArt";

/** Vitrine do produto: foto (se houver) ou palco de vidro com luz quente + ilustração vetorial. */
export function ProductArt({
  product,
  className,
  big,
  compact,
}: {
  product: Pick<Product, "art" | "tint" | "image" | "name">;
  className?: string;
  big?: boolean;
  compact?: boolean;
}) {
  if (product.image) {
    return (
      <div className={cn("relative overflow-hidden bg-surface ring-1 ring-inset ring-white/[0.08]", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>
    );
  }
  return (
    <div className={cn("relative grid place-items-center overflow-hidden bg-gradient-to-b ring-1 ring-inset ring-white/[0.08]", TINTS[product.tint]?.cls ?? TINTS.gold.cls, className)}>
      {!compact && (
        <>
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_50%_100%,rgba(251,191,36,0.22),transparent_70%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_40%)]" />
        </>
      )}
      <DishArt
        spec={product.art}
        steam={!compact}
        className={cn(
          "relative drop-shadow-[0_14px_20px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:scale-[1.06]",
          compact ? "h-[92%] w-[92%]" : big ? "h-[88%] w-[88%]" : "h-[86%] w-[86%]",
        )}
      />
    </div>
  );
}
