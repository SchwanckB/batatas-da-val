"use client";

import { motion } from "framer-motion";
import { Minus, Plus, Trash2 } from "lucide-react";
import { spring } from "@/components/ui/Press";
import { cn } from "@/lib/format";

export function QtyStepper({
  value,
  onChange,
  min = 1,
  size = "md",
  trashAtMin,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  size?: "sm" | "md";
  trashAtMin?: boolean;
}) {
  const btn = size === "sm" ? "h-8 w-8" : "h-11 w-11";
  const showTrash = trashAtMin && value <= 1;
  return (
    <div className="flex items-center gap-1 rounded-full bg-white/[0.06] p-1 ring-1 ring-white/10">
      <motion.button
        whileTap={{ scale: 0.85 }}
        transition={spring}
        disabled={!trashAtMin && value <= min}
        onClick={() => onChange(value - 1)}
        aria-label={showTrash ? "Remover" : "Diminuir"}
        className={cn(btn, "grid place-items-center rounded-full text-zinc-200 transition hover:bg-white/10 disabled:opacity-30", showTrash && "text-brasa")}
      >
        {showTrash ? <Trash2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
      </motion.button>
      <motion.span
        key={value}
        initial={{ scale: 1.35, opacity: 0.4 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 20 }}
        className={cn("min-w-6 text-center font-bold tabular-nums text-white", size === "sm" ? "text-sm" : "text-base")}
      >
        {value}
      </motion.span>
      <motion.button
        whileTap={{ scale: 0.85 }}
        transition={spring}
        onClick={() => onChange(value + 1)}
        aria-label="Aumentar"
        className={cn(btn, "grid place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/15")}
      >
        <Plus className="h-4 w-4" />
      </motion.button>
    </div>
  );
}
