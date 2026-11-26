"use client";

import { motion } from "framer-motion";
import { Bike, ChefHat, ClipboardCheck, PackageCheck, Store, XCircle } from "lucide-react";
import { cn, timeFmt } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

const ORDER: OrderStatus[] = ["novo", "preparo", "entrega", "concluido"];

export function trackerSteps(pickup: boolean) {
  return [
    { id: "novo" as const, label: "Recebido", Icon: ClipboardCheck },
    { id: "preparo" as const, label: "Na cozinha", Icon: ChefHat },
    pickup
      ? { id: "entrega" as const, label: "Pronto para retirar", Icon: Store }
      : { id: "entrega" as const, label: "Saiu para entrega", Icon: Bike },
    { id: "concluido" as const, label: pickup ? "Retirado" : "Entregue", Icon: PackageCheck },
  ];
}

export const statusLabel = (status: OrderStatus, pickup: boolean) =>
  status === "cancelado" ? "Cancelado" : (trackerSteps(pickup).find((s) => s.id === status)?.label ?? "Recebido");

/** Andamento do pedido, no mesmo ritmo em que a cozinha avança no painel. */
export function OrderTracker({ order, pickup }: { order: Order; pickup: boolean }) {
  if (order.status === "cancelado") {
    return (
      <div className="flex items-start gap-3 rounded-control border border-brasa/40 bg-brasa/10 p-3.5">
        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-brasa" aria-hidden />
        <div>
          <p className="text-sm font-bold text-white">Pedido cancelado</p>
          <p className="mt-0.5 text-small text-zinc-300">
            {order.cancelReason || "Fale com a loja no WhatsApp para entender o motivo."}
          </p>
        </div>
      </div>
    );
  }

  const steps = trackerSteps(pickup);
  const idx = Math.max(0, ORDER.indexOf(order.status));
  const pct = (idx / (steps.length - 1)) * 100;

  return (
    <div className="relative">
      <div className="absolute left-5.5 right-5.5 top-5.25 h-0.75 rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gold"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 22 }}
        />
      </div>
      <ol className="relative grid grid-cols-4">
        {steps.map((s, i) => {
          const done = i < idx;
          const current = i === idx;
          const at = order.history.find((h) => h.status === s.id)?.at;
          return (
            <li key={s.id} className="flex flex-col items-center gap-2 text-center">
              <motion.span
                animate={current ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={current ? { repeat: Infinity, duration: 1.8 } : undefined}
                className={cn(
                  "relative grid h-11 w-11 place-items-center rounded-full border transition-colors duration-500",
                  done && "border-amber-400/45 bg-amber-400/15 text-amber-300",
                  current && "border-amber-300 bg-gold text-on-brand",
                  !done && !current && "border-line bg-surface text-zinc-500",
                )}
              >
                <s.Icon className="h-5 w-5" aria-hidden />
              </motion.span>
              <span
                className={cn(
                  "text-2xs font-semibold leading-tight",
                  current ? "text-white" : done ? "text-amber-200" : "text-zinc-500",
                )}
              >
                {s.label}
              </span>
              {at && <span className="text-2xs tnum text-zinc-500">{timeFmt(at)}</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
