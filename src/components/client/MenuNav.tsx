"use client";

import { motion } from "framer-motion";
import { SECTION_ICONS } from "@/components/ui/sectionIcons";
import { cn } from "@/lib/format";
import type { Section } from "@/lib/types";

/**
 * Barra de categorias do cardápio. Leva direto para a seção e marca sozinha
 * em qual delas o cliente está enquanto rola a página.
 */
export function MenuNav({
  sections,
  active,
  counts,
  onPick,
}: {
  sections: Section[];
  active: string;
  counts: Record<string, number>;
  onPick: (id: string) => void;
}) {
  return (
    <nav aria-label="Categorias do cardápio" className="border-b border-paper-ink/15">
      <ul className="no-scrollbar flex gap-2 overflow-x-auto py-3">
        {sections.map((c) => {
          const on = c.id === active;
          const Icon = SECTION_ICONS[c.icon]?.Icon ?? SECTION_ICONS.star.Icon;
          return (
            <li key={c.id} className="shrink-0">
              <a
                href={`#secao-${c.id}`}
                aria-current={on ? "true" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  onPick(c.id);
                }}
                className={cn(
                  "relative flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
                  on ? "text-on-brand" : "text-zinc-600 hover:text-paper-ink",
                )}
              >
                {on && (
                  <motion.span
                    layoutId="categoria-ativa"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-full bg-gold"
                  />
                )}
                <Icon className="relative h-4 w-4" strokeWidth={2} aria-hidden />
                <span className="relative whitespace-nowrap">{c.name}</span>
                <span className={cn("relative text-2xs tnum", on ? "text-on-brand/70" : "text-zinc-500")}>
                  {counts[c.id] ?? 0}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
