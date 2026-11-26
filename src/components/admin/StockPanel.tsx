"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Minus, Plus, XOctagon } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spotlight } from "@/components/ui/Spotlight";
import { spring } from "@/components/ui/Press";
import { stockLevel, type StockLevel } from "@/lib/data";
import { cn, qtyFmt } from "@/lib/format";
import { useStore } from "@/lib/store";

const LEVEL: Record<StockLevel, { label: string; bar: string; chip: string; Icon: typeof CheckCircle2 }> = {
  ok: { label: "OK", bar: "from-emerald-300 to-emerald-500", chip: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25", Icon: CheckCircle2 },
  atencao: { label: "Atenção", bar: "from-amber-300 to-amber-500", chip: "bg-amber-400/10 text-amber-300 ring-amber-400/30", Icon: AlertTriangle },
  critico: { label: "Crítico", bar: "from-rose-400 to-red-600", chip: "bg-rose-500/15 text-rose-300 ring-rose-400/40", Icon: XOctagon },
};

export function StockPanel() {
  const { shared, adjustStock } = useStore();
  const counts = shared.stock.reduce(
    (acc, i) => ({ ...acc, [stockLevel(i)]: acc[stockLevel(i)] + 1 }),
    { ok: 0, atencao: 0, critico: 0 } as Record<StockLevel, number>,
  );
  const sorted = [...shared.stock].sort((a, b) => {
    const order = { critico: 0, atencao: 1, ok: 2 };
    return order[stockLevel(a)] - order[stockLevel(b)];
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["critico", "atencao", "ok"] as StockLevel[]).map((l) => {
          const L = LEVEL[l];
          return (
            <span key={l} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset", L.chip)}>
              <L.Icon className="h-3.5 w-3.5" /> {counts[l]} {L.label}
            </span>
          );
        })}
        <span className="ml-auto hidden self-center text-xs text-zinc-400 sm:block">Baixa automática ao iniciar o preparo dos pedidos</span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((i) => {
          const lvl = stockLevel(i);
          const L = LEVEL[lvl];
          const pct = Math.min(100, (i.qty / i.max) * 100);
          const minPct = (i.min / i.max) * 100;
          return (
            <motion.div key={i.id} layout transition={spring}>
              <Spotlight className={cn("p-4", lvl === "critico" && "ring-1 ring-rose-500/40")}>
                <div className="relative z-[1]">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{i.name}</p>
                      <p className="mt-0.5 text-2xs text-zinc-400">
                        Mínimo {qtyFmt(i.min, i.unit)} • Capacidade {qtyFmt(i.max, i.unit)}
                      </p>
                    </div>
                    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-bold ring-1 ring-inset", L.chip, lvl === "critico" && "animate-pulse")}>
                      <L.Icon className="h-3 w-3" /> {L.label}
                    </span>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <motion.p key={i.qty} initial={{ opacity: 0.4, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-extrabold tabular-nums tracking-tight text-white">
                      {qtyFmt(i.qty, i.unit)}
                    </motion.p>
                    <div className="flex items-center gap-1 rounded-full bg-white/[0.06] p-1 ring-1 ring-white/10">
                      <motion.button whileTap={{ scale: 0.85 }} transition={spring} onClick={() => adjustStock(i.id, -i.step)} aria-label={`Diminuir ${i.name}`} className="grid h-8 w-8 place-items-center rounded-full text-zinc-300 hover:bg-white/10">
                        <Minus className="h-4 w-4" />
                      </motion.button>
                      <span className="px-1 text-2xs font-semibold text-zinc-400">
                        {i.step} {i.unit}
                      </span>
                      <motion.button whileTap={{ scale: 0.85 }} transition={spring} onClick={() => adjustStock(i.id, i.step)} aria-label={`Repor ${i.name}`} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white hover:bg-white/15">
                        <Plus className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </div>

                  <div className="relative mt-3 h-2.5 rounded-full bg-white/[0.06]">
                    <motion.div className={cn("h-full rounded-full bg-gradient-to-r", L.bar)} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 110, damping: 20 }} />
                    <span className="absolute -top-1 h-[18px] w-0.5 rounded-full bg-white/50" style={{ left: `${minPct}%` }} title="Estoque mínimo" />
                  </div>
                </div>
              </Spotlight>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function StockSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-full" />
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="glass space-y-3 rounded-3xl p-4">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-44" />
            <div className="flex justify-between">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-9 w-28 rounded-full" />
            </div>
            <Skeleton className="h-2.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
