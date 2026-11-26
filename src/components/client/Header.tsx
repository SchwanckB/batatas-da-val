"use client";

import { motion, useAnimationControls } from "framer-motion";
import { ChevronDown, MapPin, ReceiptText, ShoppingBag } from "lucide-react";
import { useEffect } from "react";
import { Logo } from "@/components/ui/Logo";
import { spring } from "@/components/ui/Press";
import { cn, money } from "@/lib/format";
import { etaLabel } from "@/lib/data";
import { useMenu } from "@/lib/menuStore";
import { StatusPill } from "./StatusPill";

export function Header({
  onOpenCart,
  onPickNeighborhood,
  onOpenOrders,
}: {
  onOpenCart: () => void;
  onPickNeighborhood: () => void;
  onOpenOrders: () => void;
}) {
  const { count, cartBump, neighborhood, status, menu, myOrders } = useMenu();
  const ctrl = useAnimationControls();

  useEffect(() => {
    if (cartBump) ctrl.start({ scale: [1, 1.28, 0.92, 1.08, 1], transition: { duration: 0.55 } });
  }, [cartBump, ctrl]);

  const emAndamento = myOrders.filter((o) => o.status !== "concluido" && o.status !== "cancelado").length;

  return (
    <header className="sticky top-0 z-40 border-b border-line sticky-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 pt-[max(env(safe-area-inset-top),0.625rem)] sm:px-6">
        <Logo size={42} />
        <div className="min-w-0 flex-1">
          <p className="letreiro truncate text-lg text-white">{menu.settings.name}</p>
          <p className="mt-0.5 hidden truncate text-2xs text-zinc-400 sm:block">{menu.settings.slogan}</p>
        </div>

        <StatusPill status={status} className="hidden md:inline-flex" />

        <button
          onClick={onPickNeighborhood}
          className="hidden items-center gap-2 rounded-control border border-line px-3 py-2 text-left transition-colors hover:border-amber-400/40 md:flex"
        >
          <MapPin className="h-4 w-4 text-amber-400" aria-hidden />
          <span className="leading-tight">
            <span className="block text-xs font-semibold text-white">
              {neighborhood ? neighborhood.name : "Escolha seu bairro"}
            </span>
            <span className="block text-2xs tnum text-zinc-400">
              {neighborhood
                ? `${neighborhood.fee ? money(neighborhood.fee) : "sem taxa"} em ${etaLabel(neighborhood)}`
                : "ver frete e tempo"}
            </span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
        </button>

        <button
          onClick={onOpenOrders}
          aria-label="Meus pedidos"
          title="Meus pedidos"
          className="relative grid h-11 w-11 place-items-center rounded-control border border-line text-zinc-300 transition-colors hover:border-amber-400/40 hover:text-white"
        >
          <ReceiptText className="h-5 w-5" aria-hidden />
          {emAndamento > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brasa px-1 text-2xs font-bold text-white">
              {emAndamento}
            </span>
          )}
        </button>

        <motion.button
          data-cart-target
          animate={ctrl}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.92 }}
          transition={spring}
          onClick={onOpenCart}
          aria-label={`Abrir sacola com ${count} ${count === 1 ? "item" : "itens"}`}
          className="btn-gold relative grid h-11 w-11 place-items-center rounded-control"
        >
          <ShoppingBag className="h-5 w-5" aria-hidden />
          {count > 0 && (
            <motion.span
              key={count}
              initial={{ scale: 0.4 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 600, damping: 14 }}
              className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-2xs font-bold text-amber-300 ring-1 ring-amber-400"
            >
              {count}
            </motion.span>
          )}
        </motion.button>
      </div>

      {/* No celular o bairro ganha a própria linha: é a informação que muda o preço */}
      <button
        onClick={onPickNeighborhood}
        className={cn(
          "flex w-full items-center gap-2 border-t border-line px-4 py-2 text-xs md:hidden",
          neighborhood ? "text-zinc-300" : "bg-amber-400/[0.07] text-amber-200",
        )}
      >
        <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden />
        <span className="truncate font-semibold">
          {neighborhood ? `Entregar em ${neighborhood.name}` : "Escolha onde você está"}
        </span>
        <span className="ml-auto shrink-0 tnum text-zinc-400">
          {neighborhood ? `${neighborhood.fee ? money(neighborhood.fee) : "sem taxa"} • ${etaLabel(neighborhood)}` : "frete e tempo"}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
      </button>
    </header>
  );
}
