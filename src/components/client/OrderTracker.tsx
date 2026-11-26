"use client";

import { motion } from "framer-motion";
import { Bike, ChefHat, ClipboardCheck, PartyPopper, Store } from "lucide-react";
import { neighborhoodById } from "@/lib/data";
import { cn } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

const ORDER: OrderStatus[] = ["novo", "preparo", "entrega", "concluido"];

export function trackerSteps(pickup: boolean) {
  return [
    { id: "novo" as const, label: "Recebido", Icon: ClipboardCheck },
    { id: "preparo" as const, label: "Na Cozinha", Icon: ChefHat },
    pickup
      ? { id: "entrega" as const, label: "Pronto p/ Retirar", Icon: Store }
      : { id: "entrega" as const, label: "Saiu para Entrega", Icon: Bike },
    { id: "concluido" as const, label: pickup ? "Retirado" : "Entregue", Icon: PartyPopper },
  ];
}

/** Barra de progresso do pedido em tempo real (sincronizada com o painel admin). */
export function OrderTracker({ order }: { order: Order }) {
  const pickup = !!neighborhoodById(order.neighborhoodId)?.pickup;
  const steps = trackerSteps(pickup);
  const idx = ORDER.indexOf(order.status);
  const pct = (idx / (steps.length - 1)) * 100;

  return (
    <div className="relative">
      <div className="absolute left-[22px] right-[22px] top-[21px] h-1 rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 shadow-[0_0_14px_rgba(245,158,11,0.7)]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 22 }}
        />
      </div>
      <ol className="relative grid grid-cols-4">
        {steps.map((s, i) => {
          const done = i < idx;
          const current = i === idx;
          return (
            <li key={s.id} className="flex flex-col items-center gap-2 text-center">
              <motion.span
                animate={current ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                transition={current ? { repeat: Infinity, duration: 1.8 } : undefined}
                className={cn(
                  "relative grid h-11 w-11 place-items-center rounded-full ring-1 transition-colors duration-500",
                  done && "bg-amber-400/15 text-amber-300 ring-amber-400/40",
                  current && "bg-gradient-to-b from-amber-300 to-amber-500 text-on-brand ring-amber-200/70 shadow-[0_0_24px_rgba(245,158,11,0.6)]",
                  !done && !current && "bg-surface text-zinc-400 ring-white/10",
                )}
              >
                {current && <span className="absolute inset-0 animate-ping rounded-full bg-amber-400/30" />}
                <s.Icon className="relative h-5 w-5" />
              </motion.span>
              <span className={cn("text-2xs font-semibold leading-tight", current ? "text-white" : done ? "text-amber-200" : "text-zinc-400")}>
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
