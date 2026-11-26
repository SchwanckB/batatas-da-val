"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/format";

export const spring = { type: "spring", stiffness: 400, damping: 25 } as const;

type Variant = "cta" | "gold" | "panel" | "outline" | "ghost" | "danger";

/** Botão "adesivo": chapado, com borda inferior sólida em vez de brilho. */
const styles: Record<Variant, string> = {
  cta: "btn-gold",
  gold: "btn-gold",
  panel: "panel text-zinc-100 hover:border-amber-400/40",
  outline: "border border-line text-zinc-200 hover:border-amber-400/50 hover:text-white",
  ghost: "text-zinc-300 hover:bg-white/[0.06] hover:text-white",
  danger: "bg-brasa text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_2px_0_#8f2117] hover:brightness-110",
};

export function Press({ variant = "panel", className, ...rest }: HTMLMotionProps<"button"> & { variant?: Variant }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={spring}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-control font-semibold transition-[background-color,box-shadow,color,border-color] duration-200 disabled:pointer-events-none disabled:opacity-40",
        styles[variant],
        className,
      )}
      {...rest}
    />
  );
}
