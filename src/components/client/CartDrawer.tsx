"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  Lock,
  QrCode,
  ShoppingBag,
  Ticket,
  TriangleAlert,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Press, spring } from "@/components/ui/Press";
import { Sheet } from "@/components/ui/Sheet";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { SIZES, etaLabel, findExtra, findProduct } from "@/lib/data";
import { cn, maskPhone, money, parseMoney } from "@/lib/format";
import { etaRange } from "@/lib/hours";
import { useMenu } from "@/lib/menuStore";
import { useToast } from "@/lib/toast";
import type { PaymentMethod } from "@/lib/types";
import { paymentLabel, whatsappLink } from "@/lib/whatsapp";
import { AnimatedPrice } from "./AnimatedPrice";
import { NeighborhoodList } from "./NeighborhoodPicker";
import { OrderTracker } from "./OrderTracker";
import { PixBox } from "./PixBox";
import { ProductArt } from "./ProductArt";
import { QtyStepper } from "./QtyStepper";
import { RatingBox } from "./RatingStars";

export type CartView = "cart" | "checkout" | "done";

const slide = {
  initial: (dir: number) => ({ x: dir * 40, opacity: 0 }),
  animate: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -40, opacity: 0 }),
};

const PAYMENTS: { id: PaymentMethod; label: string; Icon: typeof QrCode }[] = [
  { id: "pix", label: "Pix", Icon: QrCode },
  { id: "cartao", label: "Cartão na entrega", Icon: CreditCard },
  { id: "dinheiro", label: "Dinheiro", Icon: Banknote },
];

interface Props {
  open: boolean;
  view: CartView;
  setView: (v: CartView) => void;
  onClose: () => void;
}

export function CartDrawer({ open, view, setView, onClose }: Props) {
  const {
    menu,
    status,
    cart,
    setQty,
    neighborhood,
    neighborhoodId,
    setNeighborhood,
    customer,
    setCustomer,
    totals,
    coupon,
    couponInput,
    setCouponInput,
    applyCoupon,
    clearCoupon,
    placeOrder,
    tracked,
    rateOrder,
  } = useMenu();
  const { toast } = useToast();

  const [payment, setPayment] = useState<PaymentMethod>("pix");
  const [changeFor, setChangeFor] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const dirRef = useRef(1);

  const { settings } = menu;
  const minOrder = settings.minOrder;
  const belowMin = minOrder > 0 && totals.subtotal < minOrder;

  const go = (v: CartView, dir = 1) => {
    dirRef.current = dir;
    setView(v);
  };

  useEffect(() => {
    if (!open) {
      setErrors({});
      setCouponError("");
    }
  }, [open]);

  const waCtx = useMemo(
    () => ({
      extras: menu.extras,
      neighborhoods: menu.neighborhoods,
      whatsapp: settings.whatsapp,
      storeName: settings.name,
    }),
    [menu.extras, menu.neighborhoods, settings.whatsapp, settings.name],
  );

  const submit = async () => {
    const e: Record<string, string> = {};
    if (customer.name.trim().length < 2) e.name = "Como podemos te chamar?";
    if (customer.phone.replace(/\D/g, "").length < 10) e.phone = "Telefone com DDD, por favor";
    if (!neighborhood) e.nb = "Escolha o bairro ou a retirada";
    if (neighborhood && !neighborhood.pickup && customer.address.trim().length < 5)
      e.address = "Precisamos da rua, número e um ponto de referência";
    const troco = parseMoney(changeFor);
    if (payment === "dinheiro" && changeFor && (isNaN(troco) || troco < totals.total))
      e.change = "O troco precisa ser maior que o total";
    setErrors(e);
    if (Object.keys(e).length) return;

    setSubmitting(true);
    const result = await placeOrder(payment, payment === "dinheiro" && changeFor ? troco : undefined);
    setSubmitting(false);

    if (!result.ok) {
      toast({ title: "Pedido não enviado", subtitle: result.error, tone: "erro" });
      return;
    }
    toast({
      title: `Pedido #${result.order!.id} enviado`,
      subtitle: "A cozinha já recebeu",
      icon: <CheckCircle2 className="h-4.5 w-4.5 text-[#7fd79a]" />,
    });
    go("done");
  };

  const field = (k: string) =>
    cn(
      "w-full rounded-control border bg-ink px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none transition-colors",
      errors[k] ? "border-brasa focus:border-brasa" : "border-line focus:border-amber-400/60",
    );

  const title = view === "cart" ? "Sua sacola" : view === "checkout" ? "Fechar o pedido" : "Acompanhe o pedido";
  const pickup = !!neighborhood?.pickup;

  return (
    <Sheet open={open} onClose={onClose} side="right" label={title}>
      <div className="flex shrink-0 items-center gap-3 px-5 pb-3 pt-4 sm:pt-5">
        {view === "checkout" && (
          <button
            onClick={() => go("cart", -1)}
            aria-label="Voltar para a sacola"
            className="grid h-9 w-9 place-items-center rounded-full border border-line text-zinc-300 hover:border-amber-400/40"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </button>
        )}
        <h2 className="letreiro pr-10 text-2xl text-white">{title}</h2>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <AnimatePresence mode="wait" custom={dirRef.current} initial={false}>
          {/* ------------------------------- sacola ------------------------------- */}
          {view === "cart" && (
            <motion.div
              key="cart"
              custom={dirRef.current}
              variants={slide}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.22 }}
              className="flex min-h-0 flex-1 flex-col"
            >
              {cart.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-16 text-center">
                  <span className="grid h-16 w-16 place-items-center rounded-full border border-line text-zinc-500">
                    <ShoppingBag className="h-7 w-7" aria-hidden />
                  </span>
                  <p className="text-lg font-bold text-white">Nada na sacola ainda</p>
                  <p className="text-sm text-zinc-400">
                    Comece pelo Batatão da Val: strogonoff, frango, cheddar e bacon no mesmo pote.
                  </p>
                  <Press variant="panel" className="mt-2 h-11 px-4 text-sm" onClick={onClose}>
                    Ver o cardápio
                  </Press>
                </div>
              ) : (
                <>
                  <ul className="thin-scroll flex-1 space-y-2 overflow-y-auto px-4 pb-4">
                    <AnimatePresence initial={false}>
                      {cart.map((i) => {
                        const p = findProduct(menu.products, i.productId);
                        return (
                          <motion.li
                            key={i.uid}
                            layout
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0, x: 80, transition: { duration: 0.25 } }}
                            transition={spring}
                            className="overflow-hidden"
                          >
                            <div className="flex gap-3 rounded-card border border-line bg-surface p-3">
                              {p && (
                                <ProductArt product={p} compact className="h-14 w-14 shrink-0 rounded-md" />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold leading-snug text-white">{i.name}</p>
                                <p className="mt-0.5 text-xs text-zinc-400">
                                  {[
                                    i.size && SIZES.find((s) => s.id === i.size)?.label,
                                    i.extras.length
                                      ? `com ${i.extras.map((e) => findExtra(menu.extras, e)?.name ?? e).join(", ")}`
                                      : null,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                                {i.notes && <p className="mt-1 text-xs italic text-amber-300/90">“{i.notes}”</p>}
                                <div className="mt-2 flex items-center justify-between">
                                  <QtyStepper
                                    size="sm"
                                    value={i.qty}
                                    onChange={(v) => setQty(i.uid, v)}
                                    trashAtMin
                                    min={0}
                                  />
                                  <span className="text-sm font-bold tnum text-amber-300">
                                    {money(i.unitPrice * i.qty)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.li>
                        );
                      })}
                    </AnimatePresence>
                  </ul>

                  <div className="shrink-0 space-y-3 border-t border-line bg-ink p-4">
                    <Totals totals={totals} nbName={neighborhood?.name} couponCode={coupon?.code} />
                    {belowMin && (
                      <p className="flex items-center gap-2 text-small font-medium text-amber-300">
                        <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />
                        Faltam {money(minOrder - totals.subtotal)} para o pedido mínimo.
                      </p>
                    )}
                    <Press
                      variant="cta"
                      className="h-12 w-full text-base"
                      disabled={belowMin}
                      onClick={() => go("checkout")}
                    >
                      Continuar
                      <AnimatedPrice value={totals.total} />
                    </Press>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ------------------------------ checkout ------------------------------ */}
          {view === "checkout" && (
            <motion.div
              key="checkout"
              custom={dirRef.current}
              variants={slide}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.22 }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="thin-scroll flex-1 space-y-6 overflow-y-auto px-5 pb-5">
                {!status.open && (
                  <div className="flex items-start gap-3 rounded-control border border-amber-400/40 bg-amber-400/10 p-3.5">
                    <Lock className="mt-0.5 h-4.5 w-4.5 shrink-0 text-amber-300" aria-hidden />
                    <div>
                      <p className="text-sm font-bold text-white">
                        {status.reason === "pausado" ? "Pedidos pausados" : "A loja está fechada"}
                      </p>
                      <p className="mt-0.5 text-small text-zinc-300">
                        {status.reason === "pausado" ? settings.pausedMessage : `${status.label}.`} A sacola fica
                        guardada até lá.
                      </p>
                    </div>
                  </div>
                )}

                <section className="space-y-2.5">
                  <h3 className="text-sm font-bold text-white">Seus dados</h3>
                  <label className="sr-only" htmlFor="nome">
                    Seu nome
                  </label>
                  <input
                    id="nome"
                    className={field("name")}
                    placeholder="Seu nome"
                    value={customer.name}
                    onChange={(e) => setCustomer({ name: e.target.value })}
                    autoComplete="name"
                  />
                  <Err msg={errors.name} />
                  <label className="sr-only" htmlFor="telefone">
                    Telefone com DDD
                  </label>
                  <input
                    id="telefone"
                    className={field("phone")}
                    placeholder="(51) 99999-9999"
                    inputMode="tel"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ phone: maskPhone(e.target.value) })}
                    autoComplete="tel"
                  />
                  <Err msg={errors.phone} />
                </section>

                <section className="space-y-2.5">
                  <h3 className="text-sm font-bold text-white">Onde você está</h3>
                  <NeighborhoodList
                    neighborhoods={menu.neighborhoods}
                    value={neighborhoodId}
                    onPick={setNeighborhood}
                  />
                  <Err msg={errors.nb} />
                  <AnimatePresence initial={false}>
                    {neighborhood && !neighborhood.pickup && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <label className="sr-only" htmlFor="endereco">
                          Endereço de entrega
                        </label>
                        <textarea
                          id="endereco"
                          rows={2}
                          className={cn(field("address"), "resize-none")}
                          placeholder="Rua, número e ponto de referência"
                          value={customer.address}
                          onChange={(e) => setCustomer({ address: e.target.value })}
                          autoComplete="street-address"
                        />
                        <Err msg={errors.address} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>

                <section className="space-y-2.5">
                  <h3 className="text-sm font-bold text-white">Como você paga</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {PAYMENTS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPayment(p.id)}
                        aria-pressed={payment === p.id}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-control border px-1 py-3 text-2xs font-semibold transition-colors",
                          payment === p.id
                            ? "border-amber-400/60 bg-amber-400/10 text-white"
                            : "border-line text-zinc-400 hover:border-amber-400/35",
                        )}
                      >
                        <p.Icon className={cn("h-5 w-5", payment === p.id && "text-amber-300")} aria-hidden />
                        <span className="text-center leading-tight">{p.label}</span>
                      </button>
                    ))}
                  </div>
                  <AnimatePresence initial={false} mode="wait">
                    {payment === "dinheiro" && (
                      <motion.div
                        key="troco"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className={cn(field("change"), "flex items-center gap-2")}>
                          <span className="shrink-0 text-zinc-400">Troco para R$</span>
                          <input
                            inputMode="decimal"
                            aria-label="Troco para quanto"
                            className="min-w-0 flex-1 bg-transparent tnum focus:outline-none"
                            placeholder="100 (opcional)"
                            value={changeFor}
                            onChange={(e) => setChangeFor(e.target.value.replace(/[^\d,.]/g, ""))}
                          />
                        </div>
                        <Err msg={errors.change} />
                      </motion.div>
                    )}
                    {payment === "pix" && (
                      <motion.p
                        key="pix"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden text-small text-zinc-400"
                      >
                        O QR Code aparece na tela seguinte, com o valor já preenchido.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </section>

                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-white">Tem um cupom?</h3>
                  {coupon ? (
                    <div className="flex items-center gap-2 rounded-control border border-aberto/40 bg-aberto/10 px-3.5 py-3">
                      <Ticket className="h-4 w-4 shrink-0 text-[#7fd79a]" aria-hidden />
                      <span className="min-w-0 flex-1 text-small font-semibold text-white">
                        {coupon.code} aplicado
                        <span className="ml-1 font-normal tnum text-zinc-300">−{money(totals.discount)}</span>
                      </span>
                      <button
                        onClick={() => {
                          clearCoupon();
                          setCouponError("");
                        }}
                        aria-label="Remover cupom"
                        className="grid h-7 w-7 place-items-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <label className="sr-only" htmlFor="cupom">
                        Código do cupom
                      </label>
                      <input
                        id="cupom"
                        className={cn(field("coupon"), "uppercase")}
                        placeholder="CODIGO"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                      />
                      <Press
                        variant="panel"
                        className="h-auto shrink-0 px-4 text-sm"
                        disabled={couponBusy || !couponInput}
                        onClick={async () => {
                          setCouponBusy(true);
                          const err = await applyCoupon(couponInput);
                          setCouponBusy(false);
                          setCouponError(err ?? "");
                        }}
                      >
                        Aplicar
                      </Press>
                    </div>
                  )}
                  <Err msg={couponError} />
                </section>
              </div>

              <div className="shrink-0 space-y-3 border-t border-line bg-ink p-4">
                <Totals totals={totals} nbName={neighborhood?.name} couponCode={coupon?.code} />
                {neighborhood && status.open && (
                  <p className="text-small tnum text-zinc-400">
                    {pickup ? "Pronto para retirar em " : "Chega em "}
                    {etaRange(settings.prepMinutes, neighborhood.etaMin, neighborhood.etaMax)}
                  </p>
                )}
                <Press
                  variant="cta"
                  className="h-12 w-full text-base"
                  onClick={submit}
                  disabled={submitting || !cart.length || !status.open || belowMin}
                >
                  {submitting ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                      className="h-5 w-5 rounded-full border-2 border-on-brand/25 border-t-on-brand"
                    />
                  ) : status.open ? (
                    <>
                      Enviar o pedido
                      <AnimatedPrice value={totals.total} />
                    </>
                  ) : (
                    "Fora do horário de pedidos"
                  )}
                </Press>
              </div>
            </motion.div>
          )}

          {/* -------------------------------- feito -------------------------------- */}
          {view === "done" && (
            <motion.div
              key="done"
              custom={dirRef.current}
              variants={slide}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="thin-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-6"
            >
              {tracked ? (
                <>
                  <div className="relative flex flex-col items-center pt-2 text-center">
                    <Burst />
                    <motion.div
                      initial={{ scale: 0, rotate: -40 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}
                      className="grid h-18 w-18 place-items-center rounded-full bg-aberto text-on-success"
                    >
                      <CheckCircle2 className="h-9 w-9" strokeWidth={2.2} aria-hidden />
                    </motion.div>
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="letreiro mt-4 text-3xl text-white"
                    >
                      {tracked.status === "concluido" ? "Bom apetite" : "Pedido confirmado"}
                    </motion.h3>
                    <p className="mt-1 text-sm tnum text-zinc-400">
                      Pedido <b className="text-amber-300">#{tracked.id}</b>, {money(tracked.total)} no{" "}
                      {paymentLabel(tracked.payment).toLowerCase()}
                    </p>
                    {neighborhood && (
                      <p className="mt-0.5 text-xs tnum text-zinc-500">
                        {pickup ? "Retirada no local" : `Entrega em ${neighborhood.name}`}, previsão de{" "}
                        {etaLabel(neighborhood)}
                      </p>
                    )}
                  </div>

                  <div className="rounded-card border border-line bg-surface p-4 pt-5">
                    <OrderTracker order={tracked} pickup={pickup} />
                  </div>

                  {tracked.payment === "pix" && tracked.status !== "cancelado" && <PixBox token={tracked.token} />}

                  <div className="space-y-1.5 rounded-card border border-line bg-surface p-4 text-sm">
                    {tracked.items.map((i) => (
                      <div key={i.uid} className="flex justify-between gap-3 text-zinc-300">
                        <span className="min-w-0 truncate">
                          {i.qty}x {i.name}
                        </span>
                        <span className="shrink-0 tnum text-zinc-400">{money(i.unitPrice * i.qty)}</span>
                      </div>
                    ))}
                    {tracked.discount > 0 && (
                      <div className="flex justify-between gap-3 text-[#7fd79a]">
                        <span>Desconto {tracked.couponCode}</span>
                        <span className="tnum">−{money(tracked.discount)}</span>
                      </div>
                    )}
                  </div>

                  {tracked.status === "concluido" && (
                    <RatingBox
                      rating={tracked.rating}
                      onSend={(stars, comment) => rateOrder(tracked.token, stars, comment)}
                    />
                  )}

                  <div className="grid gap-2">
                    <a
                      href={whatsappLink(tracked, waCtx)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-control border border-aberto/35 bg-aberto/10 px-3 text-sm font-semibold text-[#9fe0b3] transition-colors hover:bg-aberto/15"
                    >
                      <WhatsAppIcon className="h-5 w-5 shrink-0" aria-hidden />
                      <span className="truncate">Mandar o resumo no WhatsApp</span>
                    </a>
                    <a
                      href={`/pedido/${tracked.token}`}
                      className="flex h-11 w-full items-center justify-center rounded-control text-sm font-semibold text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                      Abrir a página do pedido
                    </a>
                    <Press variant="ghost" className="h-11 w-full text-sm" onClick={onClose}>
                      Voltar ao cardápio
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

function Totals({
  totals,
  nbName,
  couponCode,
}: {
  totals: { subtotal: number; fee: number; discount: number; total: number };
  nbName?: string;
  couponCode?: string;
}) {
  return (
    <div className="space-y-1 text-sm">
      <div className="flex justify-between text-zinc-400">
        <span>Subtotal</span>
        <AnimatedPrice value={totals.subtotal} />
      </div>
      <div className="flex justify-between text-zinc-400">
        <span>Entrega{nbName ? ` em ${nbName}` : " (escolha o bairro)"}</span>
        <span className={cn("tnum", totals.fee === 0 && nbName && "text-[#7fd79a]")}>
          {nbName ? (totals.fee ? money(totals.fee) : "sem taxa") : "—"}
        </span>
      </div>
      {totals.discount > 0 && (
        <div className="flex justify-between text-[#7fd79a]">
          <span>Desconto {couponCode}</span>
          <span className="tnum">−{money(totals.discount)}</span>
        </div>
      )}
      <div className="flex items-baseline justify-between pt-1 text-base font-bold text-white">
        <span>Total</span>
        <AnimatedPrice value={totals.total} className="text-lg text-amber-300" />
      </div>
    </div>
  );
}

const Err = ({ msg }: { msg?: string }) => (
  <AnimatePresence>
    {msg && (
      <motion.p
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        role="alert"
        className="px-1 pt-1 text-xs font-medium text-brasa"
      >
        {msg}
      </motion.p>
    )}
  </AnimatePresence>
);

/** Confete curtinho na confirmação. */
function Burst() {
  const parts = Array.from({ length: 14 });
  return (
    <div className="pointer-events-none absolute left-1/2 top-10 h-0 w-0">
      {parts.map((_, i) => {
        const a = (i / parts.length) * Math.PI * 2;
        const r = 70 + (i % 3) * 18;
        return (
          <motion.span
            key={i}
            className={cn(
              "absolute h-2 w-2 rounded-full",
              i % 3 === 0 ? "bg-brasa" : i % 3 === 1 ? "bg-gold" : "bg-aberto",
            )}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(a) * r, y: Math.sin(a) * r, opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.15 }}
          />
        );
      })}
    </div>
  );
}
