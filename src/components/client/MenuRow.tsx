"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { spring } from "@/components/ui/Press";
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
 * Linha do cardápio: foto, nome, linha pontilhada até o preço.
 * É o jeito como um cardápio impresso se lê — e o oposto do grid de cards
 * idênticos que fazia o site parecer template.
 */
export function MenuRow({ product: p, onOpen, onQuickAdd }: Props) {
  const soldOut = !p.available;

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
          "flex items-start gap-3 rounded-card px-2 py-3.5 outline-none transition-colors sm:gap-4 sm:px-3",
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
            <span className="guia hidden sm:block" aria-hidden />
            <span className="ml-auto pl-3 text-base font-bold tnum text-paper-ink sm:ml-0 sm:pl-0">
              {money(p.price)}
            </span>
          </div>

          <p className="mt-1 line-clamp-2 text-small leading-relaxed text-zinc-600">{p.description}</p>

          <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            {p.priceGigante && (
              <span className="rounded-sm bg-paper-ink/[0.06] px-1.5 py-0.5 text-2xs font-semibold tnum text-zinc-600">
                Gigante 800 g {money(p.priceGigante)}
              </span>
            )}
            {p.badges.map((b) => (
              <BadgeChip key={b} badge={b} onPaper />
            ))}
          </div>
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
    <li className="flex items-start gap-4 border-b border-paper-ink/10 px-2 py-3.5 sm:px-3">
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
