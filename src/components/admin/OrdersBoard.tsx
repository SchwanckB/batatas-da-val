"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Bike, Check, ChefHat, Clock, Inbox, MapPin, PackageCheck, Store, StickyNote } from "lucide-react";
import { Spotlight } from "@/components/ui/Spotlight";
import { Skeleton } from "@/components/ui/Skeleton";
import { spring } from "@/components/ui/Press";
import { extraById, neighborhoodById, SIZES } from "@/lib/data";
import { cn, elapsed, money, timeFmt } from "@/lib/format";
import { useNow, useStore } from "@/lib/store";
import type { Order, OrderStatus } from "@/lib/types";
import { paymentLabel } from "@/lib/whatsapp";

const COLUMNS: { id: OrderStatus; title: string; sub: string; Icon: typeof Inbox; accent: string; dot: string }[] = [
  { id: "novo", title: "Novos Pedidos", sub: "Aceitar e iniciar", Icon: Inbox, accent: "text-rose-300", dot: "bg-rose-400" },
  { id: "preparo", title: "Em Preparo", sub: "O que fazer", Icon: ChefHat, accent: "text-amber-300", dot: "bg-amber-400" },
  { id: "entrega", title: "Em Entrega", sub: "Na rua / balcão", Icon: Bike, accent: "text-sky-300", dot: "bg-sky-400" },
  { id: "concluido", title: "Concluídos", sub: "Turno atual", Icon: PackageCheck, accent: "text-emerald-300", dot: "bg-emerald-400" },
];

function actionLabel(o: Order) {
  const pickup = neighborhoodById(o.neighborhoodId)?.pickup;
  switch (o.status) {
    case "novo":
      return { label: "Iniciar preparo", Icon: ChefHat, cls: "from-amber-300 to-amber-500 text-on-brand" };
    case "preparo":
      return pickup
        ? { label: "Pronto p/ retirada", Icon: Store, cls: "from-orange-300 to-orange-500 text-on-brand" }
        : { label: "Enviar p/ entrega", Icon: Bike, cls: "from-orange-300 to-orange-500 text-on-brand" };
    case "entrega":
      return { label: pickup ? "Retirado" : "Entregue", Icon: Check, cls: "from-emerald-300 to-emerald-500 text-on-success" };
    default:
      return null;
  }
}

export function OrdersBoard() {
  const { shared, advanceOrder, toast } = useStore();
  const now = useNow(10000);

  return (
    <div className="thin-scroll -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
      {COLUMNS.map((col) => {
        const list = shared.orders
          .filter((o) => o.status === col.id)
          .sort((a, b) => (col.id === "concluido" ? b.updatedAt - a.updatedAt : a.createdAt - b.createdAt));
        return (
          <section key={col.id} className="glass flex w-[86vw] max-w-[360px] shrink-0 snap-center flex-col rounded-panel p-2.5 lg:w-auto lg:max-w-none">
            <header className="flex items-center gap-2 px-2 pb-3 pt-1.5">
              <col.Icon className={cn("h-4.5 w-4.5", col.accent)} />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-white">{col.title}</h3>
                <p className="text-2xs text-zinc-400">{col.sub}</p>
              </div>
              <motion.span key={list.length} initial={{ scale: 1.5 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }} className="grid h-6 min-w-6 place-items-center rounded-full bg-white/10 px-1.5 text-xs font-bold text-white">
                {list.length}
              </motion.span>
            </header>
            <div className="thin-scroll flex max-h-[calc(100dvh-260px)] min-h-[140px] flex-col gap-2.5 overflow-y-auto pr-0.5">
              <AnimatePresence mode="popLayout">
                {list.map((o) => (
                  <OrderCard
                    key={o.id}
                    order={o}
                    now={now}
                    dot={col.dot}
                    onAdvance={() => {
                      advanceOrder(o.id);
                      const a = actionLabel(o)!;
                      toast({
                        title: `#${o.id} • ${a.label}`,
                        subtitle: o.status === "novo" ? "Insumos baixados do estoque" : o.customer.name,
                        icon: <a.Icon className="h-4.5 w-4.5 text-amber-300" />,
                      });
                    }}
                  />
                ))}
              </AnimatePresence>
              {list.length === 0 && (
                <div className="grid flex-1 place-items-center rounded-2xl border border-dashed border-white/10 py-8 text-xs text-zinc-500">
                  Nenhum pedido aqui
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function OrderCard({ order: o, now, dot, onAdvance }: { order: Order; now: number; dot: string; onAdvance: () => void }) {
  const nb = neighborhoodById(o.neighborhoodId);
  const action = actionLabel(o);
  const mins = (now - o.createdAt) / 60000;
  const late = o.status !== "concluido" && mins > 35;
  const notes = o.items.filter((i) => i.notes);
  const done = o.status === "concluido";

  return (
    <motion.div
      layout
      layoutId={`order-${o.id}`}
      initial={{ opacity: 0, scale: 0.9, y: -12 }}
      animate={{ opacity: done ? 0.75 : 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
    >
      <Spotlight className="rounded-card">
        <div className="relative z-[1] p-3.5">
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", dot, o.status === "novo" && "animate-pulse")} />
            <span className="text-base font-extrabold tracking-tight text-white">#{o.id}</span>
            <span className={cn("ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold", late ? "bg-rose-500/15 text-rose-300" : "bg-white/[0.06] text-zinc-400")}>
              <Clock className="h-3 w-3" /> {done ? timeFmt(o.updatedAt) : elapsed(o.createdAt, now)}
            </span>
          </div>
          <p className="mt-1.5 text-sm font-semibold text-zinc-100">{o.customer.name}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-400">
            {nb?.pickup ? <Store className="h-3 w-3 text-amber-300" /> : <MapPin className="h-3 w-3 text-amber-300" />}
            <span className="truncate">{nb?.pickup ? "Retirada no local" : `${nb?.name} • ${o.customer.address}`}</span>
          </p>

          {!done && (
            <ul className="mt-3 space-y-1.5 rounded-xl bg-black/25 p-2.5 ring-1 ring-white/5">
              {o.items.map((i) => (
                <li key={i.uid} className="text-small leading-snug">
                  <span className="font-bold text-amber-300">{i.qty}x</span> <span className="text-zinc-100">{i.name}</span>
                  {i.size && <span className="text-zinc-400"> • {SIZES.find((s) => s.id === i.size)?.label}</span>}
                  {i.extras.length > 0 && (
                    <span className="block pl-5 text-2xs text-emerald-300/90">+ {i.extras.map((e) => extraById(e)?.name).join(", ")}</span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {!done && notes.length > 0 && (
            <div className="mt-2 space-y-1 rounded-xl bg-amber-400/10 p-2.5 ring-1 ring-amber-400/30">
              {notes.map((i) => (
                <p key={i.uid} className="flex gap-1.5 text-xs font-semibold leading-snug text-amber-200">
                  <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    <span className="text-amber-400">{i.name.replace(/^Batatão de /, "")}:</span> {i.notes}
                  </span>
                </p>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-medium text-zinc-300">
              {paymentLabel(o.payment)}
              {o.payment === "dinheiro" && o.changeFor ? ` • troco p/ ${money(o.changeFor)}` : ""}
            </span>
            <span className="font-extrabold text-white">{money(o.total)}</span>
          </div>

          {action && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              transition={spring}
              onClick={onAdvance}
              className={cn("mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b text-sm font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]", action.cls)}
            >
              <action.Icon className="h-4 w-4" /> {action.label} <ArrowRight className="h-3.5 w-3.5 opacity-70" />
            </motion.button>
          )}
        </div>
      </Spotlight>
    </motion.div>
  );
}

export function BoardSkeleton() {
  return (
    <div className="-mx-4 flex gap-3 overflow-hidden px-4 lg:mx-0 lg:grid lg:grid-cols-4 lg:px-0">
      {[3, 2, 1, 2].map((n, c) => (
        <div key={c} className="glass w-[86vw] max-w-[360px] shrink-0 rounded-panel p-2.5 lg:w-auto lg:max-w-none">
          <div className="flex items-center gap-2 px-2 pb-3 pt-1.5">
            <Skeleton className="h-5 w-5 rounded-md" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-2.5 w-20" />
            </div>
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
          <div className="space-y-2.5">
            {Array.from({ length: n }).map((_, i) => (
              <div key={i} className="glass space-y-2 rounded-card p-3.5">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-14 rounded-full" />
                </div>
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
