"use client";

import { motion } from "framer-motion";
import { Clock, MapPin, Phone, Search, X } from "lucide-react";
import { InstagramIcon } from "@/components/ui/InstagramIcon";
import { Logo } from "@/components/ui/Logo";
import { STORE } from "@/lib/format";

const INFO = [
  { Icon: MapPin, label: "Atendemos", value: STORE.city },
  { Icon: Clock, label: "Horário", value: STORE.hours },
  { Icon: Phone, label: "WhatsApp", value: STORE.phone, href: `https://wa.me/${STORE.whatsapp}` },
  { Icon: InstagramIcon, label: "Instagram", value: STORE.instagram, href: STORE.instagramUrl },
];

const fadeUp = (d: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 260, damping: 26, delay: d },
});

export function Hero({ query, onQuery }: { query: string; onQuery: (q: string) => void }) {
  return (
    <section className="relative mx-auto mt-6 max-w-6xl px-4 sm:mt-10 sm:px-6">
      <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <motion.p {...fadeUp(0.05)} className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300 ring-1 ring-inset ring-amber-400/25">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Batatões recheados • Delivery
          </motion.p>
          <motion.h1 {...fadeUp(0.1)} className="text-4xl font-extrabold leading-[1.04] tracking-[-0.03em] text-white sm:text-6xl">
            Crocante por fora,{" "}
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-transparent">
              cremosa por dentro!
            </span>
          </motion.h1>
          <motion.p {...fadeUp(0.14)} className="mt-3 max-w-md text-base leading-relaxed text-zinc-400">
            Batatões recheados feitos na hora, com ingredientes generosos e entrega quentinha em Três Cachoeiras.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.15 }}
          className="relative hidden md:block"
        >
          <div className="absolute inset-0 -z-10 scale-125 rounded-full bg-amber-500/25 blur-3xl" />
          <Logo size={190} className="ring-2" />
        </motion.div>
      </div>

      <motion.div {...fadeUp(0.18)} className="glass mt-6 grid grid-cols-2 gap-1 rounded-panel p-1.5 sm:flex sm:items-stretch">
        {INFO.map(({ Icon, label, value, href }, i) => {
          const body = (
            <>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-amber-400/10 text-amber-300 ring-1 ring-inset ring-amber-400/20">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block text-2xs font-medium uppercase tracking-wider text-zinc-400">{label}</span>
                <span className="block text-small font-semibold text-zinc-100 sm:whitespace-nowrap">{value}</span>
              </span>
            </>
          );
          const cls = `flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3 rounded-control px-3 py-2 transition-colors ${i ? "sm:border-l sm:border-white/[0.06]" : ""}`;
          return href ? (
            <a key={label} href={href} target="_blank" rel="noreferrer" className={`${cls} hover:bg-white/[0.05]`}>
              {body}
            </a>
          ) : (
            <div key={label} className={cls}>
              {body}
            </div>
          );
        })}
      </motion.div>

      <motion.label {...fadeUp(0.22)} className="glass mt-3 flex items-center gap-3 rounded-panel px-5 py-4 focus-within:ring-2 focus-within:ring-amber-400/40">
        <Search className="h-5 w-5 shrink-0 text-zinc-400" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Buscar por nome ou ingrediente (bacon, frango, cheddar...)"
          className="min-w-0 flex-1 bg-transparent text-white placeholder:text-zinc-400 focus:outline-none"
        />
        {query && (
          <button onClick={() => onQuery("")} aria-label="Limpar busca" className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-zinc-300">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </motion.label>
    </section>
  );
}
