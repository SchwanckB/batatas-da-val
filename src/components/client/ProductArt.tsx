import { TINTS } from "@/lib/data";
import { cn } from "@/lib/format";
import type { Product } from "@/lib/types";
import { DishArt } from "./DishArt";

/**
 * Vitrine do produto: foto, quando houver; senão a ilustração sobre um fundo
 * quente. Moldura escura e cantos curtos — no creme do cardápio ela funciona
 * como a fotinho colada na página.
 */
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
      <div className={cn("relative overflow-hidden border border-line bg-ink-2", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "relative grid place-items-center overflow-hidden border border-line bg-ink-2 bg-linear-to-b",
        TINTS[product.tint]?.cls ?? TINTS.gold.cls,
        className,
      )}
    >
      {!compact && (
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_50%_115%,rgba(245,165,36,0.3),transparent_70%)]" />
      )}
      <DishArt
        spec={product.art}
        steam={!compact}
        className={cn(
          "relative drop-shadow-[0_10px_14px_rgba(0,0,0,0.45)] transition-transform duration-500 ease-out group-hover:-translate-y-0.5 group-hover:scale-[1.04]",
          compact ? "h-[92%] w-[92%]" : big ? "h-[88%] w-[88%]" : "h-[86%] w-[86%]",
        )}
      />
    </div>
  );
}
