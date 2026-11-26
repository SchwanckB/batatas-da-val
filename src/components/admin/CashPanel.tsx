"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownCircle, ArrowUpCircle, Banknote, CreditCard, QrCode, Receipt, ShoppingBag, TrendingUp, Vault, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Press } from "@/components/ui/Press";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spotlight } from "@/components/ui/Spotlight";
import { cn, money, timeFmt } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { CashEntry, PaymentMethod } from "@/lib/types";

const PAY: { id: PaymentMethod; label: string; Icon: typeof QrCode; bar: string; text: string }[] = [
  { id: "pix", label: "Pix", Icon: QrCode, bar: "from-emerald-300 to-emerald-500", text: "text-emerald-300" },
  { id: "cartao", label: "Cartão", Icon: CreditCard, bar: "from-sky-300 to-sky-500", text: "text-sky-300" },
  { id: "dinheiro", label: "Dinheiro", Icon: Banknote, bar: "from-amber-300 to-amber-500", text: "text-amber-300" },
];

export function CashPanel() {
  const { shared, addCashEntry, toast } = useStore();
  const [form, setForm] = useState<CashEntry["type"] | null>(null);

  const stats = useMemo(() => {
    const done = shared.orders.filter((o) => o.status === "concluido");
    const revenue = done.reduce((s, o) => s + o.total, 0);
    const byPay = Object.fromEntries(PAY.map((p) => [p.id, done.filter((o) => o.payment === p.id).reduce((s, o) => s + o.total, 0)])) as Record<PaymentMethod, number>;
    const reforco = shared.cash.filter((c) => c.type === "reforco").reduce((s, c) => s + c.amount, 0);
    const sangria = shared.cash.filter((c) => c.type === "sangria").reduce((s, c) => s + c.amount, 0);
    const drawer = shared.openingFloat + byPay.dinheiro + reforco - sangria;
    const open = shared.orders.filter((o) => o.status !== "concluido");
    const pending = open.reduce((s, o) => s + o.total, 0);
    const moves = [
      ...done.map((o) => ({ id: `o${o.id}`, at: o.updatedAt, kind: "venda" as const, label: `Venda #${o.id} • ${o.customer.name}`, sub: PAY.find((p) => p.id === o.payment)?.label ?? "", amount: o.total })),
      ...shared.cash.map((c) => ({ id: c.id, at: c.at, kind: c.type, label: c.description, sub: c.type === "reforco" ? "Reforço de caixa" : "Sangria / Despesa", amount: c.type === "reforco" ? c.amount : -c.amount })),
    ].sort((a, b) => b.at - a.at);
    return { done, revenue, byPay, drawer, open, pending, moves, ticket: done.length ? revenue / done.length : 0 };
  }, [shared]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat Icon={TrendingUp} label="Faturamento do turno" value={money(stats.revenue)} hint={`${money(stats.pending)} em aberto`} accent="text-amber-300" />
        <Stat Icon={ShoppingBag} label="Total de pedidos" value={String(shared.orders.length)} hint={`${stats.done.length} concluídos • ${stats.open.length} em andamento`} />
        <Stat Icon={Receipt} label="Ticket médio" value={money(stats.ticket)} hint="sobre pedidos concluídos" />
        <Stat Icon={Vault} label="Saldo na gaveta" value={money(stats.drawer)} hint={`Fundo de troco ${money(shared.openingFloat)}`} accent="text-emerald-300" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Spotlight className="p-5">
          <div className="relative z-[1]">
            <h3 className="flex items-center gap-2 text-sm font-bold text-white">
              <Wallet className="h-4 w-4 text-amber-300" /> Por forma de pagamento
            </h3>
            <div className="mt-5 space-y-4">
              {PAY.map((p, i) => {
                const v = stats.byPay[p.id];
                const pct = stats.revenue ? (v / stats.revenue) * 100 : 0;
                return (
                  <div key={p.id}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-zinc-300">
                        <p.Icon className={cn("h-4 w-4", p.text)} /> {p.label}
                      </span>
                      <span className="font-bold text-white">
                        {money(v)} <span className="ml-1 text-xs font-medium text-zinc-400">{pct.toFixed(0)}%</span>
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <motion.div className={cn("h-full rounded-full bg-gradient-to-r", p.bar)} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 90, damping: 20, delay: 0.1 + i * 0.08 }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Press variant="glass" className="h-11 text-sm text-emerald-200" onClick={() => setForm("reforco")}>
                <ArrowUpCircle className="h-4 w-4" /> Reforço
              </Press>
              <Press variant="glass" className="h-11 text-sm text-rose-200" onClick={() => setForm("sangria")}>
                <ArrowDownCircle className="h-4 w-4" /> Sangria / Despesa
              </Press>
            </div>
          </div>
        </Spotlight>

        <Spotlight className="p-5">
          <div className="relative z-[1]">
            <h3 className="text-sm font-bold text-white">Movimentações do turno</h3>
            <ul className="thin-scroll mt-3 max-h-[380px] space-y-1.5 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {stats.moves.map((m) => (
                  <motion.li key={m.id} layout initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 rounded-2xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/5">
                    <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", m.kind === "venda" ? "bg-amber-400/10 text-amber-300" : m.kind === "reforco" ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-500/10 text-rose-300")}>
                      {m.kind === "venda" ? <ShoppingBag className="h-4 w-4" /> : m.kind === "reforco" ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-100">{m.label}</p>
                      <p className="text-2xs text-zinc-400">
                        {timeFmt(m.at)} • {m.sub}
                      </p>
                    </div>
                    <span className={cn("text-sm font-bold tabular-nums", m.amount >= 0 ? "text-emerald-300" : "text-rose-300")}>
                      {m.amount >= 0 ? "+" : "−"} {money(Math.abs(m.amount))}
                    </span>
                  </motion.li>
                ))}
              </AnimatePresence>
              {stats.moves.length === 0 && <li className="py-10 text-center text-sm text-zinc-400">Sem movimentações ainda.</li>}
            </ul>
          </div>
        </Spotlight>
      </div>

      <EntryForm
        type={form}
        onClose={() => setForm(null)}
        onSave={(description, amount) => {
          addCashEntry({ type: form!, description, amount });
          toast({ title: form === "reforco" ? "Reforço lançado" : "Sangria lançada", subtitle: `${description} • ${money(amount)}`, icon: form === "reforco" ? <ArrowUpCircle className="h-4.5 w-4.5 text-emerald-300" /> : <ArrowDownCircle className="h-4.5 w-4.5 text-rose-300" /> });
          setForm(null);
        }}
      />
    </div>
  );
}

function Stat({ Icon, label, value, hint, accent = "text-white" }: { Icon: typeof Wallet; label: string; value: string; hint: string; accent?: string }) {
  return (
    <Spotlight className="p-4 sm:p-5">
      <div className="relative z-[1]">
        <div className="flex items-center gap-2 text-2xs font-semibold uppercase tracking-wider text-zinc-400">
          <Icon className="h-4 w-4 text-amber-300/80" /> <span className="truncate">{label}</span>
        </div>
        <motion.p key={value} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn("mt-2 text-xl font-extrabold tracking-tight sm:text-2xl", accent)}>
          {value}
        </motion.p>
        <p className="mt-1 truncate text-2xs text-zinc-400">{hint}</p>
      </div>
    </Spotlight>
  );
}

function EntryForm({ type, onClose, onSave }: { type: CashEntry["type"] | null; onClose: () => void; onSave: (d: string, v: number) => void }) {
  const [desc, setDesc] = useState("");
  const [val, setVal] = useState("");
  const amount = Number(val.replace(",", "."));
  const valid = desc.trim().length > 1 && amount > 0;
  const input = "w-full rounded-2xl bg-white/[0.04] px-4 py-3 text-white ring-1 ring-white/10 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40";
  return (
    <Sheet open={!!type} onClose={onClose} label="Lançamento de caixa">
      <form
        className="space-y-4 p-5 pt-4 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onSave(desc.trim(), amount);
          setDesc("");
          setVal("");
        }}
      >
        <h2 className="flex items-center gap-2 text-xl font-extrabold text-white">
          {type === "reforco" ? <ArrowUpCircle className="h-5 w-5 text-emerald-300" /> : <ArrowDownCircle className="h-5 w-5 text-rose-300" />}
          {type === "reforco" ? "Reforço de Caixa" : "Sangria / Despesa"}
        </h2>
        <input className={input} placeholder={type === "reforco" ? "Ex.: Troco adicional" : "Ex.: Compra de gás, motoboy..."} value={desc} onChange={(e) => setDesc(e.target.value)} autoFocus />
        <div className={cn(input, "flex items-center gap-2")}>
          <span className="text-zinc-400">R$</span>
          <input inputMode="decimal" className="min-w-0 flex-1 bg-transparent focus:outline-none" placeholder="0,00" value={val} onChange={(e) => setVal(e.target.value.replace(/[^\d,.]/g, ""))} />
        </div>
        <Press type="submit" variant={type === "reforco" ? "gold" : "cta"} className="h-12 w-full" disabled={!valid}>
          Lançar {valid ? money(amount) : ""}
        </Press>
      </form>
    </Sheet>
  );
}

export function CashSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="glass space-y-3 rounded-3xl p-5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-2.5 w-32" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="glass space-y-5 rounded-3xl p-5">
          <Skeleton className="h-4 w-40" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-2.5 w-full rounded-full" />
            </div>
          ))}
        </div>
        <div className="glass space-y-2 rounded-3xl p-5">
          <Skeleton className="h-4 w-44" />
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
