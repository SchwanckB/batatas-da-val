"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  QrCode,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Press, spring } from "@/components/ui/Press";
import { Sheet } from "@/components/ui/Sheet";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { extraById, findProduct, neighborhoodById, SIZES } from "@/lib/data";
import { ProductArt } from "./ProductArt";
import { cn, money, STORE } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { PaymentMethod } from "@/lib/types";
import { paymentLabel, whatsappLink } from "@/lib/whatsapp";
import { AnimatedPrice } from "./AnimatedPrice";
import { NeighborhoodList } from "./NeighborhoodPicker";
import { OrderTracker } from "./OrderTracker";
import { QtyStepper } from "./QtyStepper";

export type CartView = "cart" | "checkout" | "done";

const slide = {
  initial: (dir: number) => ({ x: dir * 40, opacity: 0, filter: "blur(4px)" }),
  animate: { x: 0, opacity: 1, filter: "blur(0px)" },
  exit: (dir: number) => ({ x: dir * -40, opacity: 0, filter: "blur(4px)" }),
};

const PAYMENTS: { id: PaymentMethod; label: string; Icon: typeof QrCode }[] = [
  { id: "pix", label: "Pix", Icon: QrCode },
  { id: "cartao", label: "Cartão na Entrega", Icon: CreditCard },
  { id: "dinheiro", label: "Dinheiro", Icon: Banknote },
];

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
};

interface Props {
  open: boolean;
  view: CartView;
  setView: (v: CartView) => void;
  onClose: () => void;
}

export function CartDrawer({ open, view, setView, onClose }: Props) {
  const store = useStore();
  const { client, shared, setQty, setNeighborhood, setCustomer, placeOrder, toast, clearTracking } = store;
  const [payment, setPayment] = useState<PaymentMethod>("pix");
  const [changeFor, setChangeFor] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const dirRef = useRef(1);

  const nb = neighborhoodById(client.neighborhoodId);
  const subtotal = useMemo(() => client.cart.reduce((s, i) => s + i.unitPrice * i.qty, 0), [client.cart]);
  const fee = nb?.fee ?? 0;
  const total = subtotal + fee;
  const tracked = shared.orders.find((o) => o.id === client.trackedOrderId);

  const go = (v: CartView, dir = 1) => {
    dirRef.current = dir;
    setView(v);
  };

  useEffect(() => {
    if (!open) setErrors({});
  }, [open]);

  const submit = () => {
    const e: Record<string, string> = {};
    if (client.customer.name.trim().length < 2) e.name = "Informe seu nome";
    if (client.customer.phone.replace(/\D/g, "").length < 10) e.phone = "Telefone inválido";
    if (!nb) e.nb = "Escolha o bairro ou retirada";
    if (nb && !nb.pickup && client.customer.address.trim().length < 5) e.address = "Informe o endereço";
    const troco = Number(changeFor.replace(",", "."));
    if (payment === "dinheiro" && changeFor && (isNaN(troco) || troco < total)) e.change = "Troco deve ser maior que o total";
    setErrors(e);
    if (Object.keys(e).length) return;
    setSubmitting(true);
    setTimeout(() => {
      const o = placeOrder(payment, payment === "dinheiro" && changeFor ? troco : undefined);
      setSubmitting(false);
      if (o) {
        toast({ title: `Pedido #${o.id} enviado!`, subtitle: "A cozinha já recebeu seu pedido", icon: <CheckCircle2 className="h-4.5 w-4.5 text-emerald-300" /> });
        go("done");
      }
    }, 650);
  };

  const field = (k: string) =>
    cn(
      "w-full rounded-2xl bg-white/[0.04] px-4 py-3 text-white ring-1 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition",
      errors[k] ? "ring-rose-500/60 focus:ring-rose-500/60" : "ring-white/10 focus:ring-amber-400/40",
    );

  const title = view === "cart" ? "Seu pedido" : view === "checkout" ? "Finalizar pedido" : "Acompanhe seu pedido";

  return (
    <Sheet open={open} onClose={onClose} side="right" label={title}>
      <div className="flex shrink-0 items-center gap-3 px-5 pb-3 pt-4 sm:pt-5">
        {view === "checkout" && (
          <button onClick={() => go("cart", -1)} aria-label="Voltar" className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.08] ring-1 ring-white/10 hover:bg-white/15">
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <h2 className="text-xl font-extrabold tracking-tight text-white">{title}</h2>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <AnimatePresence mode="wait" custom={dirRef.current} initial={false}>
          {view === "cart" && (
            <motion.div key="cart" custom={dirRef.current} variants={slide} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.22 }} className="flex min-h-0 flex-1 flex-col">
              {client.cart.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-16 text-center">
                  <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }} className="grid h-20 w-20 place-items-center rounded-full bg-amber-400/10 text-4xl ring-1 ring-amber-400/25">
                    🍟
                  </motion.div>
                  <p className="text-lg font-bold text-white">Sua sacola está vazia</p>
                  <p className="text-sm text-zinc-400">Que tal um Batatão da Val bem cremoso pra hoje?</p>
                  {tracked && (
                    <Press variant="glass" className="mt-2 px-4 py-2.5 text-sm" onClick={() => go("done")}>
                      Acompanhar pedido #{tracked.id}
                    </Press>
                  )}
                </div>
              ) : (
                <>
                  <ul className="thin-scroll flex-1 space-y-2 overflow-y-auto px-4 pb-4">
                    <AnimatePresence initial={false}>
                      {client.cart.map((i) => (
                        <motion.li
                          key={i.uid}
                          layout
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0, x: 80, transition: { duration: 0.25 } }}
                          transition={spring}
                          className="overflow-hidden"
                        >
                          <div className="glass flex gap-3 rounded-2xl p-3">
                            {(() => { const p = findProduct(shared.products, i.productId); return p ? <ProductArt product={p} compact className="h-14 w-14 shrink-0 rounded-control" /> : null; })()}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold leading-snug text-white">{i.name}</p>
                              <p className="mt-0.5 text-xs text-zinc-400">
                                {i.size && SIZES.find((s) => s.id === i.size)?.label}
                                {i.extras.length > 0 && ` • + ${i.extras.map((e) => extraById(e)?.name).join(", ")}`}
                              </p>
                              {i.notes && <p className="mt-1 text-xs italic text-amber-300/90">“{i.notes}”</p>}
                              <div className="mt-2 flex items-center justify-between">
                                <QtyStepper size="sm" value={i.qty} onChange={(v) => setQty(i.uid, v)} trashAtMin min={0} />
                                <span className="text-sm font-bold text-amber-300">{money(i.unitPrice * i.qty)}</span>
                              </div>
                            </div>
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                  <div className="shrink-0 space-y-3 border-t border-white/10 bg-black/20 p-4">
                    <Totals subtotal={subtotal} fee={fee} nbName={nb?.name} total={total} />
                    <Press variant="cta" className="h-12 w-full text-base" onClick={() => go("checkout")}>
                      Continuar • <AnimatedPrice value={total} />
                    </Press>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {view === "checkout" && (
            <motion.div key="checkout" custom={dirRef.current} variants={slide} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.22 }} className="flex min-h-0 flex-1 flex-col">
              <div className="thin-scroll flex-1 space-y-5 overflow-y-auto px-5 pb-5">
                <section className="space-y-2.5">
                  <Label>Seus dados</Label>
                  <input className={field("name")} placeholder="Seu nome" value={client.customer.name} onChange={(e) => setCustomer({ name: e.target.value })} autoComplete="name" />
                  <Err msg={errors.name} />
                  <input className={field("phone")} placeholder="(51) 99999-9999" inputMode="tel" value={client.customer.phone} onChange={(e) => setCustomer({ phone: maskPhone(e.target.value) })} autoComplete="tel" />
                  <Err msg={errors.phone} />
                </section>

                <section className="space-y-2.5">
                  <Label>Entrega em Três Cachoeiras</Label>
                  <NeighborhoodList value={client.neighborhoodId} onPick={setNeighborhood} />
                  <Err msg={errors.nb} />
                  <AnimatePresence initial={false}>
                    {nb && !nb.pickup && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <textarea rows={2} className={cn(field("address"), "resize-none")} placeholder="Rua, número e ponto de referência" value={client.customer.address} onChange={(e) => setCustomer({ address: e.target.value })} autoComplete="street-address" />
                        <Err msg={errors.address} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>

                <section className="space-y-2.5">
                  <Label>Forma de pagamento</Label>
                  <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-white/[0.04] p-1.5 ring-1 ring-white/10">
                    {PAYMENTS.map((p) => (
                      <button key={p.id} onClick={() => setPayment(p.id)} className={cn("relative flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-2xs font-semibold transition-colors", payment === p.id ? "text-white" : "text-zinc-400")}>
                        {payment === p.id && <motion.span layoutId="pay-pill" transition={{ type: "spring", stiffness: 420, damping: 34 }} className="absolute inset-0 rounded-xl bg-gradient-to-b from-amber-300/25 to-amber-500/10 ring-1 ring-amber-400/50" />}
                        <p.Icon className={cn("relative h-5 w-5", payment === p.id && "text-amber-300")} />
                        <span className="relative text-center leading-tight">{p.label}</span>
                      </button>
                    ))}
                  </div>
                  <AnimatePresence initial={false} mode="wait">
                    {payment === "dinheiro" && (
                      <motion.div key="troco" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className={cn(field("change"), "flex items-center gap-2")}>
                          <span className="text-zinc-400">Troco para R$</span>
                          <input inputMode="decimal" className="min-w-0 flex-1 bg-transparent focus:outline-none" placeholder="Ex.: 100 (opcional)" value={changeFor} onChange={(e) => setChangeFor(e.target.value.replace(/[^\d,.]/g, ""))} />
                        </div>
                        <Err msg={errors.change} />
                      </motion.div>
                    )}
                    {payment === "pix" && (
                      <motion.p key="pix" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden rounded-xl bg-emerald-400/[0.07] px-3 py-2 text-xs text-emerald-200 ring-1 ring-emerald-400/20">
                        Chave Pix (celular): <b>{STORE.phone}</b> — envie o comprovante pelo WhatsApp.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </section>
              </div>
              <div className="shrink-0 space-y-3 border-t border-white/10 bg-black/20 p-4">
                <Totals subtotal={subtotal} fee={fee} nbName={nb?.name} total={total} />
                <Press variant="cta" className="h-12 w-full text-base" onClick={submit} disabled={submitting || !client.cart.length}>
                  {submitting ? (
                    <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} className="h-5 w-5 rounded-full border-2 border-on-brand/25 border-t-on-brand" />
                  ) : (
                    <>Finalizar Pedido • <AnimatedPrice value={total} /></>
                  )}
                </Press>
              </div>
            </motion.div>
          )}

          {view === "done" && (
            <motion.div key="done" custom={dirRef.current} variants={slide} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }} className="thin-scroll flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-6">
              {tracked ? (
                <>
                  <div className="relative flex flex-col items-center pt-2 text-center">
                    <Burst />
                    <motion.div initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }} className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-b from-emerald-300 to-emerald-500 text-on-success shadow-[0_0_50px_rgba(52,211,153,0.55)]">
                      <CheckCircle2 className="h-10 w-10" strokeWidth={2.2} />
                    </motion.div>
                    <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-4 text-2xl font-extrabold text-white">
                      {tracked.status === "concluido" ? "Bom apetite! 🍟" : "Pedido confirmado!"}
                    </motion.h3>
                    <p className="mt-1 text-sm text-zinc-400">
                      Pedido <b className="text-amber-300">#{tracked.id}</b> • {money(tracked.total)} • {paymentLabel(tracked.payment)}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {neighborhoodById(tracked.neighborhoodId)?.pickup ? "Retirada no local" : `Entrega: ${neighborhoodById(tracked.neighborhoodId)?.name}`} • previsão {neighborhoodById(tracked.neighborhoodId)?.eta}
                    </p>
                  </div>

                  <div className="glass mt-6 rounded-3xl p-4 pt-5">
                    <OrderTracker order={tracked} />
                    <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-zinc-400">
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Atualiza em tempo real conforme a cozinha avança
                    </p>
                  </div>

                  <div className="glass mt-3 space-y-1.5 rounded-3xl p-4 text-sm">
                    {tracked.items.map((i) => (
                      <div key={i.uid} className="flex justify-between gap-3 text-zinc-300">
                        <span className="min-w-0 truncate">
                          {i.qty}x {i.name}
                        </span>
                        <span className="shrink-0 text-zinc-400">{money(i.unitPrice * i.qty)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-2">
                    <motion.a
                      href={whatsappLink(tracked)}
                      target="_blank"
                      rel="noreferrer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      transition={spring}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500/10 px-3 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-400/25 transition-colors hover:bg-emerald-500/15"
                    >
                      <WhatsAppIcon className="h-5 w-5 shrink-0" /> <span className="truncate">Enviar resumo no WhatsApp {STORE.phone}</span>
                    </motion.a>
                    <Press
                      variant="ghost"
                      className="h-11 w-full text-sm"
                      onClick={() => {
                        if (tracked.status === "concluido") clearTracking();
                        go("cart", -1);
                        onClose();
                      }}
                    >
                      <ShoppingBag className="h-4 w-4" /> {tracked.status === "concluido" ? "Fazer novo pedido" : "Voltar ao cardápio"}
                    </Press>
                  </div>
                </>
              ) : (
                <p className="py-16 text-center text-zinc-400">Nenhum pedido em andamento.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Sheet>
  );
}

function Totals({ subtotal, fee, nbName, total }: { subtotal: number; fee: number; nbName?: string; total: number }) {
  return (
    <div className="space-y-1 text-sm">
      <div className="flex justify-between text-zinc-400">
        <span>Subtotal</span>
        <AnimatedPrice value={subtotal} />
      </div>
      <div className="flex justify-between text-zinc-400">
        <span>Entrega {nbName ? `• ${nbName}` : "(escolha o bairro)"}</span>
        <span className={fee === 0 && nbName ? "text-emerald-300" : ""}>{nbName ? (fee ? money(fee) : "Grátis") : "—"}</span>
      </div>
      <div className="flex justify-between pt-1 text-base font-extrabold text-white">
        <span>Total</span>
        <AnimatedPrice value={total} className="text-amber-300" />
      </div>
    </div>
  );
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">{children}</h3>
);

const Err = ({ msg }: { msg?: string }) => (
  <AnimatePresence>
    {msg && (
      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="px-1 pt-1 text-xs font-medium text-rose-400">
        {msg}
      </motion.p>
    )}
  </AnimatePresence>
);

/** Explosão de partículas douradas na confirmação. */
function Burst() {
  const parts = Array.from({ length: 14 });
  return (
    <div className="pointer-events-none absolute left-1/2 top-12 h-0 w-0">
      {parts.map((_, i) => {
        const a = (i / parts.length) * Math.PI * 2;
        const r = 70 + (i % 3) * 18;
        return (
          <motion.span
            key={i}
            className={cn("absolute h-2 w-2 rounded-full", i % 3 === 0 ? "bg-rose-400" : i % 3 === 1 ? "bg-amber-300" : "bg-emerald-300")}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(a) * r, y: Math.sin(a) * r, opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.15 }}
          />
        );
      })}
    </div>
  );
}
