"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useStore } from "@/lib/store";

/** Toasts no estilo Dynamic Island, no topo da tela. */
export function ToastStack() {
  const { toasts } = useStore();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(env(safe-area-inset-top),10px)] z-[90] flex flex-col items-center gap-2 px-4">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -24, scale: 0.6, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -16, scale: 0.7, filter: "blur(6px)" }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="flex max-w-[92vw] items-center gap-3 rounded-full border border-white/10 bg-black/80 py-2 pl-2 pr-5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-b from-amber-300/25 to-amber-600/10 ring-1 ring-amber-400/30">
              {t.icon ?? <Check className="h-4.5 w-4.5 text-amber-300" />}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{t.title}</p>
              {t.subtitle && <p className="truncate text-xs text-zinc-400">{t.subtitle}</p>}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
