"use client";

import { cn } from "@/lib/format";
import type { OpenStatus } from "@/lib/hours";

/** Selo de atendimento calculado pelo horário real da loja (fuso de São Paulo). */
export function StatusPill({ status, className }: { status: OpenStatus; className?: string }) {
  const open = status.open;
  return (
    <span
      className={cn(
        "items-center gap-2 rounded-full px-3 py-1.5 text-small font-semibold",
        open ? "bg-aberto/15 text-[#7fd79a]" : status.reason === "pausado" ? "bg-amber-400/15 text-amber-300" : "bg-white/[0.07] text-zinc-300",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("h-2 w-2 rounded-full", open ? "bg-aberto" : status.reason === "pausado" ? "bg-gold" : "bg-zinc-500")}
      />
      {open ? status.label : status.reason === "pausado" ? "Pedidos pausados" : status.label}
    </span>
  );
}
