"use client";

import { motion } from "framer-motion";
import { Bike, Check, Store } from "lucide-react";
import { etaLabel } from "@/lib/data";
import { cn, money } from "@/lib/format";
import { spring } from "@/components/ui/Press";
import type { Neighborhood } from "@/lib/types";

/** Onde o cliente está: define frete e previsão. */
export function NeighborhoodList({
  neighborhoods,
  value,
  onPick,
}: {
  neighborhoods: Neighborhood[];
  value: string | null;
  onPick: (id: string) => void;
}) {
  return (
    <div className="grid gap-2">
      {neighborhoods.map((n) => {
        const on = n.id === value;
        const Icon = n.pickup ? Store : Bike;
        return (
          <motion.button
            key={n.id}
            whileTap={{ scale: 0.97 }}
            transition={spring}
            onClick={() => onPick(n.id)}
            aria-pressed={on}
            className={cn(
              "flex items-center gap-3 rounded-control border p-3 text-left transition-colors",
              on ? "border-amber-400/60 bg-amber-400/10" : "border-line bg-surface hover:border-amber-400/35",
            )}
          >
            <span
              className={cn(
                "grid h-10 w-10 shrink-0 place-items-center rounded-md",
                on ? "bg-gold text-on-brand" : "bg-white/[0.06] text-amber-300",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-white">{n.name}</span>
              <span className="block truncate text-xs text-zinc-400">
                {n.hint ? `${n.hint}, ` : ""}
                <span className="tnum">{etaLabel(n)}</span>
              </span>
            </span>
            <span className={cn("shrink-0 text-sm font-bold tnum", n.fee ? "text-amber-300" : "text-[#7fd79a]")}>
              {n.fee ? money(n.fee) : "Sem taxa"}
            </span>
            {on && <Check className="h-4 w-4 shrink-0 text-amber-300" aria-hidden />}
          </motion.button>
        );
      })}
    </div>
  );
}
