"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn, moneyInput, parseMoney } from "@/lib/format";

/** Peças repetidas do painel, para as telas ficarem iguais entre si. */

export const inputCls =
  "w-full rounded-control border border-line bg-ink px-3.5 py-2.5 text-white placeholder:text-zinc-500 transition-colors focus:border-amber-400/60 focus:outline-none";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("panel rounded-card p-4 sm:p-5", className)}>{children}</div>;
}

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-small font-semibold text-zinc-200">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-2xs text-zinc-500">{hint}</span>}
      {error && (
        <span role="alert" className="mt-1 block text-2xs font-medium text-brasa">
          {error}
        </span>
      )}
    </label>
  );
}

/** Campo de dinheiro em reais, aceitando vírgula. */
export function MoneyField({
  label,
  value,
  onChange,
  hint,
  error,
  className,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
  error?: string;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      <span className={cn(inputCls, "flex items-center gap-2")}>
        <span className="shrink-0 text-zinc-500">R$</span>
        <input
          inputMode="decimal"
          value={moneyInput(value)}
          onChange={(e) => {
            const n = parseMoney(e.target.value.replace(/[^\d,.]/g, ""));
            onChange(Number.isFinite(n) ? n : 0);
          }}
          className="min-w-0 flex-1 bg-transparent tnum focus:outline-none"
        />
      </span>
    </Field>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  suffix,
  min = 0,
  max = 9999,
  step = 1,
  hint,
  className,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <span className={cn(inputCls, "flex items-center gap-2")}>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="min-w-0 flex-1 bg-transparent tnum focus:outline-none"
        />
        {suffix && <span className="shrink-0 text-small text-zinc-500">{suffix}</span>}
      </span>
    </Field>
  );
}

export function Stat({
  Icon,
  label,
  value,
  hint,
  accent = "text-white",
}: {
  Icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <Card>
      <div className="flex items-center gap-2 text-small text-zinc-400">
        <Icon className="h-4 w-4 shrink-0 text-amber-400/80" aria-hidden /> <span className="truncate">{label}</span>
      </div>
      <motion.p
        key={value}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("mt-2 text-xl font-bold tnum sm:text-2xl", accent)}
      >
        {value}
      </motion.p>
      {hint && <p className="mt-1 truncate text-2xs text-zinc-500">{hint}</p>}
    </Card>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-card border border-dashed border-line py-10 text-center text-sm text-zinc-500">
      {children}
    </p>
  );
}

/** Aviso de contexto dentro de um módulo (dica, alerta, explicação). */
export function Hint({
  Icon,
  tone = "info",
  children,
}: {
  Icon: LucideIcon;
  tone?: "info" | "alerta";
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-control border px-3.5 py-2.5 text-small",
        tone === "alerta" ? "border-brasa/40 bg-brasa/10 text-[#ffb3aa]" : "border-line bg-surface text-zinc-300",
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
