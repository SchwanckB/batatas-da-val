"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/format";

/** Interruptor estilo iOS. */
export function Switch({ checked, onChange, label, size = "md" }: { checked: boolean; onChange: (v: boolean) => void; label: string; size?: "sm" | "md" }) {
  const w = size === "sm" ? "h-6 w-10" : "h-7 w-12";
  const k = size === "sm" ? 18 : 22;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={cn(
        "relative shrink-0 rounded-full p-[3px] ring-1 ring-inset transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70",
        w,
        checked ? "bg-amber-400 ring-amber-300" : "bg-white/10 ring-white/15",
      )}
    >
      <motion.span
        className="block rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
        style={{ width: k, height: k }}
        animate={{ x: checked ? (size === "sm" ? 16 : 20) : 0 }}
        transition={{ type: "spring", stiffness: 600, damping: 32 }}
      />
    </button>
  );
}
