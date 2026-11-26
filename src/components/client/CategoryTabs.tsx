"use client";

import { motion } from "framer-motion";
import { SECTION_ICONS } from "@/components/ui/sectionIcons";
import { cn } from "@/lib/format";
import type { CategoryId, Section } from "@/lib/types";

/** Abas das seções do cardápio, sobre o creme do papel. */
export function CategoryTabs({
  sections,
  value,
  onChange,
}: {
  sections: Section[];
  value: CategoryId;
  onChange: (c: CategoryId) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Seções do cardápio"
      className="no-scrollbar flex gap-1 overflow-x-auto border-b border-paper-ink/15 pb-px"
    >
      {sections.map((c) => {
        const active = c.id === value;
        const Icon = SECTION_ICONS[c.icon]?.Icon ?? SECTION_ICONS.star.Icon;
        return (
          <button
            key={c.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(c.id)}
            className={cn(
              "relative flex shrink-0 items-center gap-2 px-3.5 py-3 text-sm font-semibold transition-colors",
              active ? "text-paper-ink" : "text-zinc-600 hover:text-paper-ink",
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
            <span className="whitespace-nowrap">{c.name}</span>
            {active && (
              <motion.span
                layoutId="aba-cardapio"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-x-1 -bottom-px h-0.75 rounded-t bg-gold"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
