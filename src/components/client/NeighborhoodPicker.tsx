"use client";

import { motion } from "framer-motion";
import { Bike, Check, Store } from "lucide-react";
import { NEIGHBORHOODS } from "@/lib/data";
import { cn, money } from "@/lib/format";
import { spring } from "@/components/ui/Press";

export function NeighborhoodList({ value, onPick }: { value: string | null; onPick: (id: string) => void }) {
  return (
    <div className="grid gap-2">
      {NEIGHBORHOODS.map((n) => {
        const on = n.id === value;
        const Icon = n.pickup ? Store : Bike;
        return (
          <motion.button
            key={n.id}
            whileTap={{ scale: 0.97 }}
            transition={spring}
            onClick={() => onPick(n.id)}
            className={cn(
              "flex items-center gap-3 rounded-2xl p-3 text-left ring-1 transition-colors",
              on ? "bg-amber-400/10 ring-amber-400/50" : "bg-white/[0.04] ring-white/10 hover:bg-white/[0.07]",
            )}
          >
            <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", on ? "bg-amber-400 text-on-brand" : "bg-white/[0.06] text-amber-300")}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-white">{n.name}</span>
              <span className="block text-xs text-zinc-400">
                {n.hint} • {n.eta}
              </span>
            </span>
            <span className={cn("text-sm font-bold", n.fee ? "text-amber-300" : "text-emerald-300")}>{n.fee ? money(n.fee) : "Grátis"}</span>
            {on && <Check className="h-4 w-4 text-amber-300" />}
          </motion.button>
        );
      })}
    </div>
  );
}
