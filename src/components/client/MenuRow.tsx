"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { spring } from "@/components/ui/Press";
import { SIZES } from "@/lib/data";
import { cn, money } from "@/lib/format";
import type { Product } from "@/lib/types";
import { BadgeChip } from "./Badges";
import { ProductArt } from "./ProductArt";

interface Props {
  product: Product;
  onOpen: (p: Product) => void;
  onQuickAdd: (p: Product, from: HTMLElement) => void;
}

/**
 * Linha do cardápio: foto, nome e linha pontilhada até o preço — e, quando o
 * produto tem dois tamanhos, uma linha de preço para cada um, como num
 * cardápio impresso de verdade.
 */
export function MenuRow({ product: p, onOpen, onQuickAdd }: Props) {
  const soldOut = !p.available;
  const sizes = p.priceGigante
    ? [
        { label: SIZES[0].short, weight: SIZES[0].weight, price: p.price },
        { label: SIZES[1].short, weight: SIZES[1].weight, price: p.priceGigante },
      ]
    : null;

  return (
    <li className={cn("group relative border-b border-paper-ink/10", soldOut && "opacity-60")}>
      <div
        role="button"
        tabIndex={soldOut ? -1 : 0}
        aria-label={`Ver ${p.name}`}
        onClick={() => !soldOut && onOpen(p)}
        onKeyDown={(e) => {
          if (soldOut) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen(p);
          }
        }}
        className={cn(
          "flex items-start gap-3 rounded-card px-2 py-4 outline-none transition-colors sm:gap-4 sm:px-3",
          soldOut ? "cursor-not-allowed" : "cursor-pointer hover:bg-paper-ink/[0.04]",
        )}
      >
        <ProductArt
          product={p}
          className={cn("h-16 w-16 shrink-0 rounded-md sm:h-21 sm:w-21", soldOut && "grayscale")}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline">
            <h3 className="text-[15px] font-bold leading-snug text-paper-ink sm:text-base">{p.name}</h3>
            {!sizes && (
              <>
                <span className="guia hidden sm:block" aria-hidden />
                <span className="ml-auto pl-3 text-base font-bold tnum text-paper-ink sm:ml-0 sm:pl-0">
                  {money(p.price)}
                </span>
              </>
            )}
          </div>

          <p className="mt-1 text-small leading-relaxed text-zinc-600">{p.description}</p>

          {sizes && (
            <dl className="mt-2 space-y-1">
              {sizes.map((s) => (
                <div key={s.label} className="flex items-baseline text-small">
                  <dt className="font-medium text-zinc-700">
                    {s.label} <span className="text-zinc-500">{s.weight}</span>
                  </dt>
                  <span className="guia" aria-hidden />
                  <dd className="font-bold tnum text-paper-ink">{money(s.price)}</dd>
                </div>
              ))}
            </dl>
          )}

          {p.badges.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
              {p.badges.map((b) => (
                <BadgeChip key={b} badge={b} onPaper />
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 self-center">
          {soldOut ? (
            <span className="rounded-sm bg-paper-ink/[0.08] px-2 py-1 text-2xs font-bold text-zinc-600">
              Esgotado
            </span>
          ) : (
            <motion.button
              aria-label={`Adicionar ${p.name} à sacola`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.88 }}
              transition={spring}
              onClick={(e) => {
                e.stopPropagation();
                onQuickAdd(p, e.currentTarget);
              }}
              className="btn-gold grid h-11 w-11 place-items-center rounded-full"
            >
              <Plus className="h-5 w-5" strokeWidth={2.6} aria-hidden />
            </motion.button>
          )}
        </div>
      </div>
    </li>
  );
}

export function MenuRowSkeleton() {
  return (
    <li className="flex items-start gap-4 border-b border-paper-ink/10 px-2 py-4 sm:px-3">
      <div className="skeleton h-16 w-16 shrink-0 rounded-md bg-paper-ink/10 sm:h-21 sm:w-21" />
      <div className="flex-1 space-y-2 py-1">
        <div className="skeleton h-4 w-3/5 rounded bg-paper-ink/10" />
        <div className="skeleton h-3 w-full rounded bg-paper-ink/10" />
        <div className="skeleton h-3 w-2/5 rounded bg-paper-ink/10" />
      </div>
      <div className="skeleton h-11 w-11 shrink-0 self-center rounded-full bg-paper-ink/10" />
    </li>
  );
}
