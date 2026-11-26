"use client";

import { motion, useAnimationControls } from "framer-motion";
import { ChevronDown, MapPin, ShoppingBag } from "lucide-react";
import { useEffect } from "react";
import { Logo } from "@/components/ui/Logo";
import { spring } from "@/components/ui/Press";
import { neighborhoodById } from "@/lib/data";
import { money, STORE } from "@/lib/format";
import { useStore } from "@/lib/store";

export function Header({ onOpenCart, onPickNeighborhood }: { onOpenCart: () => void; onPickNeighborhood: () => void }) {
  const { client, cartBump } = useStore();
  const count = client.cart.reduce((s, i) => s + i.qty, 0);
  const nb = neighborhoodById(client.neighborhoodId);
  const ctrl = useAnimationControls();

  useEffect(() => {
    if (cartBump) ctrl.start({ scale: [1, 1.28, 0.92, 1.08, 1], transition: { duration: 0.55 } });
  }, [cartBump, ctrl]);

  return (
    <header className="sticky top-0 z-40 px-3 pt-[max(env(safe-area-inset-top),10px)] sm:px-6">
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...spring, delay: 0.05 }}
        className="glass-strong mx-auto flex max-w-6xl items-center gap-2.5 rounded-panel p-2 pr-2.5 sm:gap-4 sm:p-2.5"
      >
        <Logo size={46} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-extrabold leading-tight tracking-tight text-white">
            Batatas <span className="text-amber-300">da Val</span>
          </p>
          <div className="mt-0.5 flex items-center gap-1.5 text-2xs text-zinc-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="font-semibold text-emerald-300">Aberto</span>
            <span className="truncate">• {STORE.hours}</span>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          transition={spring}
          onClick={onPickNeighborhood}
          className="hidden items-center gap-2 rounded-2xl bg-white/[0.06] px-3 py-2 text-left ring-1 ring-white/10 transition hover:bg-white/10 md:flex"
        >
          <MapPin className="h-4 w-4 text-amber-300" />
          <span className="leading-tight">
            <span className="block text-xs font-semibold text-white">{nb ? nb.name : "Escolha seu bairro"}</span>
            <span className="block text-2xs text-zinc-400">
              {nb ? `${nb.fee ? money(nb.fee) : "Grátis"} • ${nb.eta}` : "Veja frete e tempo"}
            </span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
        </motion.button>

        <motion.button
          id="cart-target"
          data-cart-target
          animate={ctrl}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.92 }}
          transition={spring}
          onClick={onOpenCart}
          aria-label={`Abrir carrinho (${count} itens)`}
          className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-b from-rose-500 to-red-600 text-white shadow-[0_8px_24px_-6px_rgba(225,29,72,0.8),inset_0_1px_0_rgba(255,255,255,0.3)]"
        >
          <ShoppingBag className="h-5 w-5" />
          {count > 0 && (
            <motion.span
              key={count}
              initial={{ scale: 0.4 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 600, damping: 14 }}
              className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-amber-300 px-1 text-2xs font-extrabold text-on-brand ring-2 ring-surface"
            >
              {count}
            </motion.span>
          )}
        </motion.button>
      </motion.div>

      {/* Bairro no mobile: barra compacta logo abaixo do header */}
      <motion.button
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.15 }}
        whileTap={{ scale: 0.97 }}
        onClick={onPickNeighborhood}
        className="glass mx-auto mt-2 flex w-full max-w-6xl items-center gap-2 rounded-2xl px-3.5 py-2 text-xs md:hidden"
      >
        <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-300" />
        <span className="truncate font-semibold text-white">{nb ? `Entregar em: ${nb.name}` : "Escolha seu bairro"}</span>
        <span className="ml-auto shrink-0 text-zinc-400">
          {nb ? `${nb.fee ? money(nb.fee) : "Grátis"} • ${nb.eta}` : "frete e tempo"}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
      </motion.button>
    </header>
  );
}
