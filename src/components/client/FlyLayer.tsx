"use client";

import { AnimatePresence, motion } from "framer-motion";
import { findProduct } from "@/lib/data";
import type { Product } from "@/lib/types";
import { DishArt } from "./DishArt";

export interface Flight {
  id: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  productId: string;
}

/** Miniatura do prato voando em curva até a sacola. */
export function FlyLayer({
  flights,
  products,
  onDone,
}: {
  flights: Flight[];
  products: Product[];
  onDone: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[95]">
      <AnimatePresence>
        {flights.map((f) => {
          const midX = (f.x0 + f.x1) / 2;
          const peak = Math.min(f.y0, f.y1) - 140;
          const p = findProduct(products, f.productId);
          return (
            <motion.div
              key={f.id}
              className="absolute left-0 top-0 grid h-11 w-11 place-items-center rounded-full bg-gold shadow-[0_0_24px_rgba(245,165,36,0.75)]"
              initial={{ x: f.x0 - 22, y: f.y0 - 22, scale: 0.4, opacity: 0 }}
              animate={{
                x: [f.x0 - 22, midX - 22, f.x1 - 22],
                y: [f.y0 - 22, peak, f.y1 - 22],
                scale: [0.6, 1.15, 0.35],
                opacity: [1, 1, 0.9],
                rotate: [0, -25, 15],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.75, ease: [0.45, 0, 0.25, 1], times: [0, 0.45, 1] }}
              onAnimationComplete={() => onDone(f.id)}
            >
              {p && <DishArt spec={p.art} steam={false} className="h-8 w-8" />}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
