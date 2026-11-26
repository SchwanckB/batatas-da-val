"use client";

import { motion } from "framer-motion";
import { Flame, Plus } from "lucide-react";
import { Spotlight } from "@/components/ui/Spotlight";
import { spring } from "@/components/ui/Press";
import { PRODUCTS } from "@/lib/data";
import { money } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ProductArt } from "./ProductArt";

export function Featured({ onOpen, onQuickAdd }: { onOpen: (p: Product) => void; onQuickAdd: (p: Product, el: HTMLElement) => void }) {
  const items = PRODUCTS.filter((p) => p.featured);
  return (
    <section className="mx-auto mt-8 max-w-6xl">
      <div className="mb-3 flex items-center gap-2 px-4 sm:px-6">
        <Flame className="h-5 w-5 text-rose-400" />
        <h2 className="text-lg font-bold text-white">Mais Pedidos da Noite</h2>
      </div>
      <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:px-6">
        {items.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...spring, delay: 0.1 + i * 0.06 }}
            className="w-[250px] shrink-0 snap-start sm:w-[270px]"
          >
            <Spotlight className="group cursor-pointer" onClick={() => onOpen(p)}>
              <div className="relative z-[1] p-3">
                <div className="relative">
                  <ProductArt product={p} className="h-36 w-full rounded-2xl" big />
                  <span className="absolute left-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-black/55 text-sm font-extrabold text-amber-300 ring-1 ring-amber-400/40 backdrop-blur-md">
                    {i + 1}º
                  </span>
                </div>
                <div className="mt-3 flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{p.name}</p>
                    <p className="text-base font-extrabold text-amber-300">{money(p.price)}</p>
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
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-b from-amber-300 to-amber-500 text-on-brand shadow-[0_6px_20px_-4px_rgba(245,158,11,0.8)]"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                  </motion.button>
                </div>
              </div>
            </Spotlight>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
