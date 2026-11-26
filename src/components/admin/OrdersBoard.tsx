"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bike,
  Check,
  ChefHat,
  Clock,
  Inbox,
  MapPin,
  PackageCheck,
  Printer,
  Star,
  StickyNote,
  Store,
  Ticket,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Press } from "@/components/ui/Press";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { SIZES, findExtra, findNeighborhood } from "@/lib/data";
import { cn, elapsed, money, timeFmt } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { useAdmin, useAdminActions } from "@/lib/adminStore";
import { useToast } from "@/lib/toast";
import type { Order, OrderStatus } from "@/lib/types";
import { paymentLabel } from "@/lib/whatsapp";
import { Comanda } from "./Comanda";
import { inputCls } from "./kit";

const COLUMNS: { id: OrderStatus; title: string; sub: string; Icon: typeof Inbox; dot: string }[] = [
  { id: "novo", title: "Novos", sub: "aceitar e começar", Icon: Inbox, dot: "bg-brasa" },
  { id: "preparo", title: "Em preparo", sub: "na chapa e na fritura", Icon: ChefHat, dot: "bg-gold" },
  { id: "entrega", title: "Em entrega", sub: "na rua ou no balcão", Icon: Bike, dot: "bg-[#5a9bd8]" },
  { id: "concluido", title: "Concluídos", sub: "turno atual", Icon: PackageCheck, dot: "bg-aberto" },
];

const MOTIVOS = [
  "Cliente desistiu",
  "Sem contato no telefone",
  "Faltou insumo",
  "Endereço fora da área",
  "Pedido duplicado",
];

function actionLabel(o: Order, pickup: boolean) {
  switch (o.status) {
    case "novo":
      return { label: "Iniciar preparo", Icon: ChefHat };
    case "preparo":
      return pickup ? { label: "Pronto para retirada", Icon: Store } : { label: "Enviar para entrega", Icon: Bike };
    case "entrega":
      return { label: pickup ? "Retirado" : "Entregue", Icon: Check };
    default:
      return null;
  }
}

export function OrdersBoard() {
  const { state, can } = useAdmin();
  const { advanceOrder, cancelOrder } = useAdminActions();
  const { toast } = useToast();
  const now = useNow(10000);
  const [printing, setPrinting] = useState<Order | null>(null);
  const [canceling, setCanceling] = useState<Order | null>(null);

  const print = (o: Order) => {
    setPrinting(o);
    // Deixa o React pintar a comanda antes de abrir o diálogo de impressão
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrinting(null), 500);
    }, 60);
  };

  const canceled = state.orders.filter((o) => o.status === "cancelado");

  return (
    <div className="space-y-4">
      <div className="thin-scroll -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
        {COLUMNS.map((col) => {
          const list = state.orders
            .filter((o) => o.status === col.id)
            .sort((a, b) => (col.id === "concluido" ? b.updatedAt - a.updatedAt : a.createdAt - b.createdAt));
          return (
            <section
              key={col.id}
              className="panel flex w-[86vw] max-w-90 shrink-0 snap-center flex-col rounded-panel p-2.5 lg:w-auto lg:max-w-none"
            >
              <header className="flex items-center gap-2 px-2 pb-3 pt-1.5">
                <col.Icon className="h-4.5 w-4.5 text-amber-400" aria-hidden />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-white">{col.title}</h3>
                  <p className="text-2xs text-zinc-500">{col.sub}</p>
                </div>
                <motion.span
                  key={list.length}
                  initial={{ scale: 1.4 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="grid h-6 min-w-6 place-items-center rounded-full bg-white/10 px-1.5 text-xs font-bold tnum text-white"
                >
                  {list.length}
                </motion.span>
              </header>
              <div className="thin-scroll flex max-h-[calc(100dvh-16rem)] min-h-35 flex-col gap-2.5 overflow-y-auto pr-0.5">
                <AnimatePresence mode="popLayout">
                  {list.map((o) => (
                    <OrderCard
                      key={o.id}
                      order={o}
                      now={now}
                      dot={col.dot}
                      canAdvance={can("order:advance")}
                      canCancel={can("order:cancel")}
                      onPrint={() => print(o)}
                      onCancel={() => setCanceling(o)}
                      onAdvance={async () => {
                        const pickup = !!findNeighborhood(state.neighborhoods, o.neighborhoodId)?.pickup;
                        const a = actionLabel(o, pickup)!;
                        const err = await advanceOrder(o.id);
                        toast(
                          err
                            ? { title: "Não salvou", subtitle: err, tone: "erro" }
                            : {
                                title: `#${o.id}: ${a.label.toLowerCase()}`,
                                subtitle: o.status === "novo" ? "Insumos baixados do estoque" : o.customer.name,
                                icon: <a.Icon className="h-4.5 w-4.5 text-amber-300" />,
                              },
                        );
                      }}
                    />
                  ))}
                </AnimatePresence>
                {list.length === 0 && (
                  <div className="grid flex-1 place-items-center rounded-card border border-dashed border-line py-8 text-xs text-zinc-600">
                    Nenhum pedido aqui
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {canceled.length > 0 && (
        <section className="panel rounded-card p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <XCircle className="h-4 w-4 text-brasa" aria-hidden /> Cancelados no turno
          </h3>
          <ul className="mt-2.5 space-y-1.5">
            {canceled.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-small text-zinc-400">
                <span className="font-bold tnum text-zinc-300">#{o.id}</span>
                <span className="truncate">{o.customer.name}</span>
                <span className="tnum">{money(o.total)}</span>
                {o.cancelReason && <span className="text-zinc-500">— {o.cancelReason}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Comanda order={printing} />

      <CancelSheet
        order={canceling}
        onClose={() => setCanceling(null)}
        onConfirm={async (reason) => {
          const o = canceling!;
          setCanceling(null);
          const err = await cancelOrder(o.id, reason);
          toast(
            err
              ? { title: "Não salvou", subtitle: err, tone: "erro" }
              : {
                  title: `Pedido #${o.id} cancelado`,
                  subtitle: o.stockDeducted ? "Insumos devolvidos ao estoque" : reason,
                  icon: <XCircle className="h-4.5 w-4.5 text-brasa" />,
                },
          );
        }}
      />
    </div>
  );
}

function OrderCard({
  order: o,
  now,
  dot,
  canAdvance,
  canCancel,
  onAdvance,
  onPrint,
  onCancel,
}: {
  order: Order;
  now: number;
  dot: string;
  canAdvance: boolean;
  canCancel: boolean;
  onAdvance: () => void;
  onPrint: () => void;
  onCancel: () => void;
}) {
  const { state } = useAdmin();
  const nb = findNeighborhood(state.neighborhoods, o.neighborhoodId);
  const pickup = !!nb?.pickup;
  const action = actionLabel(o, pickup);
  const mins = (now - o.createdAt) / 60000;
  const late = o.status !== "concluido" && mins > 35;
  const notes = o.items.filter((i) => i.notes);
  const done = o.status === "concluido";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92, y: -12 }}
      animate={{ opacity: done ? 0.85 : 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      className="spotlight p-3.5"
    >
      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", dot, o.status === "novo" && "animate-pulse")} aria-hidden />
        <span className="text-base font-bold tnum text-white">#{o.id}</span>
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold tnum",
            late ? "bg-brasa/15 text-[#ff8f82]" : "bg-white/[0.06] text-zinc-400",
          )}
        >
          <Clock className="h-3 w-3" aria-hidden /> {done ? timeFmt(o.updatedAt) : elapsed(o.createdAt, now)}
        </span>
      </div>

      <p className="mt-1.5 text-sm font-semibold text-zinc-100">{o.customer.name}</p>
      <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-400">
        {pickup ? (
          <Store className="h-3 w-3 shrink-0 text-amber-400" aria-hidden />
        ) : (
          <MapPin className="h-3 w-3 shrink-0 text-amber-400" aria-hidden />
        )}
        <span className="truncate">{pickup ? "Retirada no local" : `${nb?.name ?? ""} — ${o.customer.address}`}</span>
      </p>
      {!pickup && o.customer.phone && (
        <a href={`tel:${o.customer.phone.replace(/\D/g, "")}`} className="text-xs tnum text-zinc-500 hover:text-amber-300">
          {o.customer.phone}
        </a>
      )}

      {!done && (
        <ul className="mt-3 space-y-1.5 rounded-control bg-ink p-2.5">
          {o.items.map((i) => (
            <li key={i.uid} className="text-small leading-snug">
              <span className="font-bold tnum text-amber-300">{i.qty}x</span>{" "}
              <span className="text-zinc-100">{i.name}</span>
              {i.size && <span className="text-zinc-500"> {SIZES.find((s) => s.id === i.size)?.label}</span>}
              {i.extras.length > 0 && (
                <span className="block pl-5 text-2xs text-[#7fd79a]">
                  + {i.extras.map((e) => findExtra(state.extras, e)?.name ?? e).join(", ")}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {!done && notes.length > 0 && (
        <div className="mt-2 space-y-1 rounded-control border border-amber-400/35 bg-amber-400/10 p-2.5">
          {notes.map((i) => (
            <p key={i.uid} className="flex gap-1.5 text-xs font-semibold leading-snug text-amber-200">
              <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                <span className="text-amber-400">{i.name.replace(/^Batatão de /, "")}:</span> {i.notes}
              </span>
            </p>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 text-xs">
        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-medium tnum text-zinc-300">
          {paymentLabel(o.payment)}
          {o.payment === "dinheiro" && o.changeFor ? `, troco ${money(o.changeFor)}` : ""}
        </span>
        <span className="font-bold tnum text-white">{money(o.total)}</span>
      </div>

      {(o.couponCode || o.rating) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-2xs">
          {o.couponCode && (
            <span className="inline-flex items-center gap-1 rounded-sm bg-aberto/15 px-1.5 py-0.5 font-semibold text-[#7fd79a]">
              <Ticket className="h-3 w-3" aria-hidden /> {o.couponCode}
            </span>
          )}
          {o.rating && (
            <span className="inline-flex items-center gap-1 text-amber-300" title={o.rating.comment}>
              <Star className="h-3 w-3 fill-gold text-gold" aria-hidden /> {o.rating.stars}/5
              {o.rating.comment && <span className="truncate text-zinc-400">“{o.rating.comment}”</span>}
            </span>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center gap-1.5">
        {action && canAdvance && (
          <Press variant="cta" className="h-10 flex-1 text-sm" onClick={onAdvance}>
            <action.Icon className="h-4 w-4" aria-hidden /> {action.label}
          </Press>
        )}
        {!done && (
          <>
            <button
              onClick={onPrint}
              title="Imprimir comanda"
              aria-label={`Imprimir comanda do pedido ${o.id}`}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-control border border-line text-zinc-400 transition-colors hover:border-amber-400/40 hover:text-white"
            >
              <Printer className="h-4 w-4" aria-hidden />
            </button>
            {canCancel && (
              <button
                onClick={onCancel}
                title="Cancelar pedido"
                aria-label={`Cancelar pedido ${o.id}`}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-control border border-line text-zinc-500 transition-colors hover:border-brasa/60 hover:text-brasa"
              >
                <XCircle className="h-4 w-4" aria-hidden />
              </button>
            )}
          </>
        )}
        {done && (
          <button
            onClick={onPrint}
            className="ml-auto inline-flex items-center gap-1.5 text-2xs font-semibold text-zinc-500 hover:text-amber-300"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden /> Reimprimir
          </button>
        )}
      </div>
    </motion.div>
  );
}

function CancelSheet({
  order,
  onClose,
  onConfirm,
}: {
  order: Order | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <Sheet open={!!order} onClose={onClose} label="Cancelar pedido">
      {order && (
        <div className="space-y-4 p-5 pt-4 sm:p-6">
          <div>
            <h2 className="letreiro pr-10 text-2xl text-white">Cancelar #{order.id}</h2>
            <p className="mt-1 text-small text-zinc-400">
              {order.customer.name}, {money(order.total)}.{" "}
              {order.stockDeducted
                ? "Os insumos já baixados voltam para o estoque."
                : "Nenhum insumo foi baixado ainda."}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {MOTIVOS.map((m) => (
              <button
                key={m}
                onClick={() => setReason(m)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  reason === m ? "border-amber-400/60 bg-amber-400/10 text-white" : "border-line text-zinc-400",
                )}
              >
                {m}
              </button>
            ))}
          </div>

          <label className="block">
            <span className="mb-1.5 block text-small font-semibold text-zinc-200">Motivo</span>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={160}
              placeholder="Escreva o motivo do cancelamento"
              className={inputCls}
            />
          </label>

          <div className="flex gap-2">
            <Press variant="ghost" className="h-11 flex-1 text-sm" onClick={onClose}>
              Voltar
            </Press>
            <Press
              variant="danger"
              className="h-11 flex-1 text-sm"
              disabled={reason.trim().length < 3}
              onClick={() => {
                onConfirm(reason.trim());
                setReason("");
              }}
            >
              <XCircle className="h-4 w-4" aria-hidden /> Cancelar pedido
            </Press>
          </div>
        </div>
      )}
    </Sheet>
  );
}

export function BoardSkeleton() {
  return (
    <div className="-mx-4 flex gap-3 overflow-hidden px-4 lg:mx-0 lg:grid lg:grid-cols-4 lg:px-0">
      {[3, 2, 1, 2].map((n, c) => (
        <div key={c} className="panel w-[86vw] max-w-90 shrink-0 rounded-panel p-2.5 lg:w-auto lg:max-w-none">
          <div className="flex items-center gap-2 px-2 pb-3 pt-1.5">
            <Skeleton className="h-5 w-5 rounded-md" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-2.5 w-20" />
            </div>
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
          <div className="space-y-2.5">
            {Array.from({ length: n }).map((_, i) => (
              <div key={i} className="panel space-y-2 rounded-card p-3.5">
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
