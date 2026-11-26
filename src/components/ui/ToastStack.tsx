"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/format";
import { useToast } from "@/lib/toast";

/** Avisos flutuantes no topo, com a mesma mola do resto da interface. */
export function ToastStack() {
  const { toasts, dismiss } = useToast();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[max(env(safe-area-inset-top),10px)] z-[90] flex flex-col items-center gap-2 px-4"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            layout
            onClick={() => dismiss(t.id)}
            initial={{ opacity: 0, y: -24, scale: 0.6, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -16, scale: 0.7, filter: "blur(6px)" }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className={cn(
              "pointer-events-auto flex max-w-[92vw] items-center gap-3 rounded-full border py-2 pl-2 pr-5 text-left shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]",
              t.tone === "erro" ? "border-brasa/50 bg-[#2a1210]" : "border-line bg-ink-2",
            )}
          >
            <span
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                t.tone === "erro" ? "bg-brasa/15 text-brasa" : "bg-amber-400/15 text-amber-300",
              )}
            >
              {t.icon ?? (t.tone === "erro" ? <TriangleAlert className="h-4.5 w-4.5" /> : <Check className="h-4.5 w-4.5" />)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{t.title}</p>
              {t.subtitle && <p className="truncate text-xs text-zinc-400">{t.subtitle}</p>}
            </div>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
