"use client";

import { motion } from "framer-motion";
import { ReceiptText, RotateCcw } from "lucide-react";
import { Press, spring } from "@/components/ui/Press";
import { Sheet } from "@/components/ui/Sheet";
import { findNeighborhood } from "@/lib/data";
import { cn, dateTimeFmt, money } from "@/lib/format";
import { useMenu } from "@/lib/menuStore";
import { useToast } from "@/lib/toast";
import type { Order, OrderStatus } from "@/lib/types";
import { statusLabel } from "./OrderTracker";

const TONE: Record<OrderStatus, string> = {
  novo: "bg-amber-400/15 text-amber-300",
  preparo: "bg-amber-400/15 text-amber-300",
  entrega: "bg-[#2b6cb0]/20 text-[#8fc0ea]",
  concluido: "bg-aberto/15 text-[#7fd79a]",
  cancelado: "bg-brasa/15 text-[#ff8f82]",
};

/** Histórico deste aparelho: acompanhar de novo ou repetir o pedido. */
export function MyOrders({
  open,
  onClose,
  onTrack,
}: {
  open: boolean;
  onClose: () => void;
  onTrack: (order: Order) => void;
}) {
  const { myOrders, menu, reorder } = useMenu();
  const { toast } = useToast();

  return (
    <Sheet open={open} onClose={onClose} side="right" label="Meus pedidos">
      <div className="px-5 pb-3 pt-4 sm:pt-5">
        <h2 className="letreiro pr-10 text-2xl text-white">Meus pedidos</h2>
        <p className="mt-1 text-small text-zinc-400">Guardados neste aparelho, sem precisar de cadastro.</p>
      </div>

      <div className="thin-scroll min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 pb-6">
        {myOrders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full border border-line text-zinc-500">
              <ReceiptText className="h-7 w-7" aria-hidden />
            </span>
            <p className="text-lg font-bold text-white">Nenhum pedido por aqui</p>
            <p className="text-sm text-zinc-400">Quando você pedir, o histórico aparece nesta lista.</p>
          </div>
        ) : (
          myOrders.map((o) => {
            const nb = findNeighborhood(menu.neighborhoods, o.neighborhoodId);
            const label = statusLabel(o.status, !!nb?.pickup);
            return (
              <motion.div
                key={o.token}
                layout
                transition={spring}
                className="rounded-card border border-line bg-surface p-3.5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tnum text-white">#{o.id}</span>
                  <span className={cn("rounded-sm px-1.5 py-0.5 text-2xs font-semibold", TONE[o.status])}>
                    {label}
                  </span>
                  <span className="ml-auto text-sm font-bold tnum text-amber-300">{money(o.total)}</span>
                </div>
                <p className="mt-1.5 text-2xs tnum text-zinc-500">{dateTimeFmt(o.createdAt)}</p>
                <p className="mt-1.5 line-clamp-2 text-small text-zinc-300">
                  {o.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}
                </p>
                <div className="mt-3 flex gap-2">
                  <Press variant="panel" className="h-10 flex-1 text-sm" onClick={() => onTrack(o)}>
                    Acompanhar
                  </Press>
                  <Press
                    variant="outline"
                    className="h-10 flex-1 text-sm"
                    onClick={() => {
                      const added = reorder(o);
                      toast(
                        added
                          ? { title: "Itens na sacola", subtitle: `${added} ${added === 1 ? "item" : "itens"} do pedido #${o.id}` }
                          : { title: "Nada para repetir", subtitle: "Os itens saíram do cardápio", tone: "erro" },
                      );
                      if (added) onClose();
                    }}
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden /> Pedir de novo
                  </Press>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </Sheet>
  );
}
