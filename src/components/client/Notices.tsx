"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Info, Megaphone, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/format";
import type { Notice } from "@/lib/types";

const TONES = {
  aviso: { cls: "border-amber-400/35 bg-amber-400/[0.09] text-amber-200", Icon: TriangleAlert },
  promo: { cls: "border-aberto/35 bg-aberto/[0.09] text-[#9fe0b3]", Icon: Megaphone },
  info: { cls: "border-line bg-surface text-zinc-200", Icon: Info },
} as const;

/** Avisos escritos no painel (alta demanda, feriado, promoção). */
export function Notices({ notices }: { notices: Notice[] }) {
  const list = notices.filter((n) => n.active && n.text.trim());
  if (!list.length) return null;

  return (
    <div className="mx-auto mt-8 max-w-6xl space-y-2 px-4 sm:px-6" role="status">
      <AnimatePresence initial={false}>
        {list.map((n) => {
          const tone = TONES[n.tone] ?? TONES.info;
          return (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={cn("flex items-start gap-2.5 rounded-control border px-3.5 py-2.5", tone.cls)}
            >
              <tone.Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p className="text-small font-medium leading-relaxed">{n.text}</p>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
