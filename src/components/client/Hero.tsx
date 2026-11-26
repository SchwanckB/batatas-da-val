"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { findNeighborhood } from "@/lib/data";
import { money, waLink } from "@/lib/format";
import { hoursLines, type StoreSchedule } from "@/lib/hours";
import type { Neighborhood, StoreSettings } from "@/lib/types";

const fadeUp = (d: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 260, damping: 26, delay: d },
});

/** Fatos de verdade sobre entrega, retirada e pagamento — não "features". */
function deliveryFacts(settings: StoreSchedule, neighborhoods: Neighborhood[]) {
  const entrega = neighborhoods.filter((n) => !n.pickup);
  const retirada = findNeighborhood(neighborhoods, "retirada") ?? neighborhoods.find((n) => n.pickup);
  const cheapest = entrega.reduce<Neighborhood | null>((a, n) => (!a || n.fee < a.fee ? n : a), null);
  const dearest = entrega.reduce<Neighborhood | null>((a, n) => (!a || n.fee > a.fee ? n : a), null);

  return [
    {
      label: "Entrega",
      value:
        cheapest && dearest
          ? cheapest.fee === dearest.fee
            ? [`${money(cheapest.fee)} em toda a cidade`]
            : [`${cheapest.name} ${money(cheapest.fee)}`, `${dearest.name} ${money(dearest.fee)}`]
          : ["Combine pelo WhatsApp"],
    },
    {
      label: "Retirada",
      value: retirada
        ? [`Sem taxa, pronto em ${retirada.etaMin} a ${retirada.etaMax} minutos`]
        : ["Combine pelo WhatsApp"],
    },
    { label: "Atendimento", value: hoursLines(settings) },
    { label: "Pagamento", value: ["Pix, cartão na entrega ou dinheiro"] },
  ];
}

export function Hero({
  settings,
  neighborhoods,
  onSeeMenu,
}: {
  settings: Omit<StoreSettings, "pixKey" | "pixName" | "pixCity">;
  neighborhoods: Neighborhood[];
  onSeeMenu: () => void;
}) {
  const facts = deliveryFacts(settings, neighborhoods);

  return (
    <section className="mx-auto mt-8 max-w-6xl px-4 sm:mt-12 sm:px-6">
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-12">
        <div className="max-w-xl">
          <motion.p {...fadeUp(0.04)} className="flex items-center gap-1.5 text-small text-zinc-400">
            <MapPin className="h-3.5 w-3.5 text-amber-400" aria-hidden />
            {settings.city}
          </motion.p>

          <motion.h1 {...fadeUp(0.09)} className="letreiro mt-3 text-white">
            <span className="block text-[clamp(2.75rem,12vw,5.25rem)]">Batatão recheado</span>
            <span className="block text-[clamp(1.5rem,6vw,2.75rem)] text-amber-400">feito na hora</span>
          </motion.h1>

          <motion.p {...fadeUp(0.13)} className="mt-5 max-w-prose text-base leading-relaxed text-zinc-300">
            A batata entra na fritura quando o pedido chega. Sai sequinha e desaparece embaixo do strogonoff,
            do frango com Catupiry ou do cheddar com bacon. Média de 500&nbsp;g para um, gigante de 800&nbsp;g
            para dividir.
          </motion.p>

          <motion.div {...fadeUp(0.17)} className="mt-6 flex flex-wrap items-center gap-2.5">
            <button
              onClick={onSeeMenu}
              className="btn-gold inline-flex h-12 items-center rounded-control px-6 text-base font-bold"
            >
              Ver o cardápio
            </button>
            <a
              href={waLink(settings.whatsapp, "Oi! Vi o cardápio no site e queria tirar uma dúvida.")}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-control border border-line px-5 text-base font-semibold text-zinc-200 transition-colors hover:border-amber-400/50 hover:text-white"
            >
              <WhatsAppIcon className="h-5 w-5" aria-hidden /> Falar no WhatsApp
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.82, rotate: -6 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.14 }}
          className="relative hidden shrink-0 md:block"
        >
          <div className="rounded-full border border-amber-400/25 p-3">
            <Logo size={176} />
          </div>
        </motion.div>
      </div>

      <motion.dl
        {...fadeUp(0.21)}
        className="mt-10 grid gap-x-10 border-t border-line pt-1 sm:grid-cols-2"
      >
        {facts.map((f) => (
          <div key={f.label} className="flex items-baseline gap-3 border-b border-line py-2.5">
            <dt className="w-24 shrink-0 text-small text-zinc-400">{f.label}</dt>
            <dd className="text-small font-semibold text-zinc-100">
              {f.value.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </dd>
          </div>
        ))}
      </motion.dl>
    </section>
  );
}
