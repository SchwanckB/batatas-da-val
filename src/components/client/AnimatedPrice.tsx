"use client";

import { AnimatePresence, motion } from "framer-motion";
import { money } from "@/lib/format";

/** Preço com troca animada (desliza verticalmente quando muda). */
export function AnimatedPrice({ value, className }: { value: number; className?: string }) {
  return (
    <span className={`relative inline-flex overflow-hidden ${className ?? ""}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: "70%", opacity: 0, filter: "blur(3px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "-70%", opacity: 0, filter: "blur(3px)" }}
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className="inline-block tabular-nums"
        >
          {money(value)}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
