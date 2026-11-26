"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Spotlight } from "@/components/ui/Spotlight";
import { spring } from "@/components/ui/Press";
import { money } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ProductArt } from "./ProductArt";
import { BadgeChip } from "./Badges";

interface Props {
  product: Product;
  onOpen: (p: Product) => void;
  onQuickAdd: (p: Product, from: HTMLElement) => void;
}

export function ProductCard({ product: p, onOpen, onQuickAdd }: Props) {
  return (
    <Spotlight className="group h-full">
      <div
        role="button"
        tabIndex={0}
        aria-label={`Ver detalhes: ${p.name}`}
        onClick={() => onOpen(p)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen(p))}
        className="relative z-[1] flex h-full cursor-pointer gap-4 p-3.5 outline-none sm:flex-col sm:p-4"
      >
        <ProductArt product={p} className="h-[104px] w-[104px] shrink-0 rounded-2xl sm:h-40 sm:w-full" />
        <div className="flex min-w-0 flex-1 flex-col">
          {p.badges.length > 0 && (
            <div className="mb-1.5 flex flex-wrap gap-1">
              {p.badges.map((b) => (
                <BadgeChip key={b} badge={b} />
              ))}
            </div>
          )}
          <h3 className="text-base font-bold leading-snug text-white sm:text-base">{p.name}</h3>
          <p className="mt-1 line-clamp-2 text-small leading-relaxed text-zinc-400">{p.description}</p>
          <div className="mt-auto flex items-end justify-between gap-2 pt-3">
            <div>
              {p.priceGigante && <p className="text-2xs font-medium uppercase tracking-wider text-zinc-400">a partir de</p>}
              <p className="text-lg font-extrabold tracking-tight text-amber-300">{money(p.price)}</p>
            </div>
            <motion.button
              aria-label={`Adicionar ${p.name}`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.88 }}
              transition={spring}
              onClick={(e) => {
                e.stopPropagation();
                onQuickAdd(p, e.currentTarget);
              }}
              className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-b from-rose-500 to-red-600 text-white shadow-[0_6px_20px_-4px_rgba(225,29,72,0.8),inset_0_1px_0_rgba(255,255,255,0.35)]"
            >
              <Plus className="h-5 w-5" strokeWidth={2.4} />
            </motion.button>
          </div>
        </div>
      </div>
    </Spotlight>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="glass flex gap-4 rounded-3xl p-3.5 sm:flex-col sm:p-4">
      <div className="skeleton h-[104px] w-[104px] shrink-0 rounded-2xl sm:h-40 sm:w-full" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="skeleton h-4 w-20 rounded-full" />
        <div className="skeleton h-4 w-4/5 rounded-lg" />
        <div className="skeleton h-3 w-full rounded-lg" />
        <div className="skeleton h-3 w-2/3 rounded-lg" />
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="skeleton h-6 w-20 rounded-lg" />
          <div className="skeleton h-10 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}
