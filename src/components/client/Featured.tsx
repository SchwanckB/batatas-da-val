"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { spring } from "@/components/ui/Press";
import { money } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ProductArt } from "./ProductArt";

/**
 * Os mais pedidos da noite. A numeração aqui é informação de verdade
 * (é um ranking), por isso ela fica.
 */
export function Featured({
  products,
  onOpen,
  onQuickAdd,
}: {
  products: Product[];
  onOpen: (p: Product) => void;
  onQuickAdd: (p: Product, el: HTMLElement) => void;
}) {
  const items = products.filter((p) => p.featured && p.available).slice(0, 8);
  if (items.length < 2) return null;

  return (
    <section aria-labelledby="mais-pedidos" className="mx-auto mt-12 max-w-6xl sm:mt-14">
      <div className="flex items-end justify-between gap-4 px-4 sm:px-6">
        <h2 id="mais-pedidos" className="letreiro text-2xl text-white sm:text-3xl">
          Os mais pedidos
        </h2>
        <p className="pb-1 text-small text-zinc-400">saem toda noite</p>
      </div>

      <ul className="no-scrollbar mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:px-6">
        {items.map((p, i) => (
          <motion.li
            key={p.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...spring, delay: 0.08 + i * 0.05 }}
            className="w-60 shrink-0 snap-start sm:w-64"
          >
            <div className="group panel h-full rounded-card p-3 transition-colors hover:border-amber-400/40">
              <button
                onClick={() => onOpen(p)}
                className="block w-full text-left"
                aria-label={`Ver ${p.name}`}
              >
                <div className="relative">
                  <ProductArt product={p} className="h-36 w-full rounded-md" big />
                  <span className="letreiro absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-ink text-sm text-amber-300 ring-1 ring-amber-400/40">
                    {i + 1}
                  </span>
                </div>
                <p className="mt-2.5 truncate text-sm font-bold text-white">{p.name}</p>
                <p className="mt-0.5 line-clamp-1 text-2xs text-zinc-400">{p.description}</p>
              </button>

              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-base font-bold tnum text-amber-300">{money(p.price)}</span>
                <motion.button
                  aria-label={`Adicionar ${p.name} à sacola`}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.88 }}
                  transition={spring}
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickAdd(p, e.currentTarget);
                  }}
                  className="btn-gold grid h-10 w-10 shrink-0 place-items-center rounded-full"
                >
                  <Plus className="h-4.5 w-4.5" strokeWidth={2.6} aria-hidden />
                </motion.button>
              </div>
            </div>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
