"use client";

import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/format";

export function useIsDesktop(query = "(min-width: 768px)") {
  const [v, setV] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setV(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, [query]);
  return v;
}

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Desktop: "center" = modal, "right" = drawer lateral. Mobile é sempre bottom-sheet. */
  side?: "center" | "right";
  className?: string;
  label: string;
  /** Modal largo no desktop (formulários com duas colunas). */
  wide?: boolean;
}

/** Modal / Drawer em Liquid Glass com abertura orgânica (mola) e arraste para fechar no celular. */
export function Sheet({ open, onClose, children, side = "center", className, label, wide }: SheetProps) {
  const desktop = useIsDesktop();
  const drag = useDragControls();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const variants = !desktop
    ? { hidden: { y: "100%" }, shown: { y: 0 } }
    : side === "right"
      ? { hidden: { x: "105%" }, shown: { x: 0 } }
      : { hidden: { opacity: 0, scale: 0.92, y: 24 }, shown: { opacity: 1, scale: 1, y: 0 } };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={label}>
          <motion.div
            className="absolute inset-0 bg-black/55 backdrop-blur-[6px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <div
            className={
              desktop && side === "center" ? "pointer-events-none absolute inset-0 grid place-items-center p-6" : "contents"
            }
          >
          <motion.div
            variants={variants}
            initial="hidden"
            animate="shown"
            exit="hidden"
            transition={{ type: "spring", stiffness: 380, damping: 36, mass: 0.9 }}
            drag={desktop ? false : "y"}
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) onClose();
            }}
            className={cn(
              "panel-strong absolute flex flex-col overflow-hidden",
              desktop
                ? side === "right"
                  ? "inset-y-3 right-3 w-[440px] rounded-panel"
                  : cn("pointer-events-auto relative max-h-[90vh] w-full rounded-panel", wide ? "max-w-[920px]" : "max-w-[560px]")
                : "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-panel pb-[env(safe-area-inset-bottom)]",
              className,
            )}
          >
            {!desktop && (
              <div
                className="flex shrink-0 cursor-grab touch-none justify-center pb-1 pt-2.5 active:cursor-grabbing"
                onPointerDown={(e) => drag.start(e)}
              >
                <span className="h-1.5 w-11 rounded-full bg-white/25" />
              </div>
            )}
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/[0.08] text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/15 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            {children}
          </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
