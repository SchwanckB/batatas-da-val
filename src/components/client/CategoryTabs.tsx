"use client";

import { motion } from "framer-motion";
import { SECTION_ICONS } from "@/components/ui/sectionIcons";
import { cn } from "@/lib/format";
import type { CategoryId, Section } from "@/lib/types";

export function CategoryTabs({ sections, value, onChange }: { sections: Section[]; value: CategoryId; onChange: (c: CategoryId) => void }) {
  return (
    <div className="glass no-scrollbar flex gap-1 overflow-x-auto rounded-full p-1.5">
      {sections.map((c) => {
        const active = c.id === value;
        const Icon = SECTION_ICONS[c.icon]?.Icon ?? SECTION_ICONS.star.Icon;
        return (
          <button
            key={c.id}
            onClick={() => onChange(c.id)}
            className={cn(
              "relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors duration-200",
              active ? "text-on-brand" : "text-zinc-400 hover:text-white",
            )}
          >
            {active && (
              <motion.span
                layoutId="cat-pill"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-full bg-gradient-to-b from-amber-200 to-amber-400 shadow-[0_6px_24px_-6px_rgba(245,158,11,0.8),inset_0_1px_0_rgba(255,255,255,0.7)]"
              />
            )}
            <Icon className="relative h-4 w-4" strokeWidth={2} />
            <span className="relative whitespace-nowrap">{c.name}</span>
          </button>
        );
      })}
    </div>
  );
}
