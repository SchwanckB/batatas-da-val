"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/format";

export const spring = { type: "spring", stiffness: 400, damping: 25 } as const;

type Variant = "cta" | "glass" | "gold" | "ghost";

const styles: Record<Variant, string> = {
  cta: "bg-gradient-to-b from-rose-500 to-red-600 text-white shadow-[0_8px_30px_-8px_rgba(225,29,72,0.75),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_10px_40px_-6px_rgba(225,29,72,0.95),inset_0_1px_0_rgba(255,255,255,0.35)]",
  gold: "bg-gradient-to-b from-amber-300 to-amber-500 text-on-brand shadow-[0_8px_30px_-10px_rgba(245,158,11,0.8),inset_0_1px_0_rgba(255,255,255,0.5)]",
  glass: "glass text-zinc-100 hover:bg-white/10",
  ghost: "text-zinc-300 hover:bg-white/[0.06] hover:text-white",
};

/** Botão tátil com física de mola. */
export function Press({ variant = "glass", className, ...rest }: HTMLMotionProps<"button"> & { variant?: Variant }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={spring}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-2xl font-semibold transition-[background-color,box-shadow,color] duration-200 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70",
        styles[variant],
        className,
      )}
      {...rest}
    />
  );
}
