"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  Check,
  CreditCard,
  Download,
  LockKeyhole,
  QrCode,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Vault,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Press } from "@/components/ui/Press";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn, dateTimeFmt, downloadCSV, money, timeFmt } from "@/lib/format";
import { openShift, useAdmin, useAdminActions } from "@/lib/adminStore";
import { useToast } from "@/lib/toast";
import type { CashEntry, PaymentMethod } from "@/lib/types";
import { Card, Field, MoneyField, Stat, inputCls } from "./kit";

const PAY: { id: PaymentMethod; label: string; Icon: typeof QrCode }[] = [
  { id: "pix", label: "Pix", Icon: QrCode },
  { id: "cartao", label: "Cartão", Icon: CreditCard },
  { id: "dinheiro", label: "Dinheiro", Icon: Banknote },
];

/** Caixa do turno: faturamento, gaveta, lançamentos e fechamento. */
export function CashPanel() {
  const { state } = useAdmin();
  const { addCashEntry, openShift: open, closeShift } = useAdminActions();
  const { toast } = useToast();
  const [form, setForm] = useState<CashEntry["type"] | null>(null);
  const [closing, setClosing] = useState(false);
  const [opening, setOpening] = useState(false);

  const shift = openShift(state);

  const stats = useMemo(() => {
    const since = shift?.openedAt ?? 0;
    const inShift = state.orders.filter((o) => o.createdAt >= since);
    const done = inShift.filter((o) => o.status === "concluido");
    const revenue = done.reduce((s, o) => s + o.total, 0);
    const byPay = Object.fromEntries(
      PAY.map((p) => [p.id, done.filter((o) => o.payment === p.id).reduce((s, o) => s + o.total, 0)]),
    ) as Record<PaymentMethod, number>;
    const cash = state.cash.filter((c) => c.at >= since);
    const reforco = cash.filter((c) => c.type === "reforco").reduce((s, c) => s + c.amount, 0);
    const sangria = cash.filter((c) => c.type === "sangria").reduce((s, c) => s + c.amount, 0);
    const floatValue = shift?.openingFloat ?? 0;
    const drawer = floatValue + byPay.dinheiro + reforco - sangria;
    const openOrders = inShift.filter((o) => o.status !== "concluido" && o.status !== "cancelado");

    const moves = [
      ...done.map((o) => ({
        id: `o${o.id}`,
        at: o.updatedAt,
        kind: "venda" as const,
        label: `Venda #${o.id}, ${o.customer.name}`,
        sub: PAY.find((p) => p.id === o.payment)?.label ?? "",
        amount: o.total,
      })),
      ...cash.map((c) => ({
        id: c.id,
        at: c.at,
        kind: c.type,
        label: c.description,
        sub: c.type === "reforco" ? `Reforço${c.by ? ` por ${c.by}` : ""}` : `Sangria${c.by ? ` por ${c.by}` : ""}`,
        amount: c.type === "reforco" ? c.amount : -c.amount,
      })),
    ].sort((a, b) => b.at - a.at);

    return {
      done,
      revenue,
      byPay,
      drawer,
      floatValue,
      reforco,
      sangria,
      openOrders,
      pending: openOrders.reduce((s, o) => s + o.total, 0),
      moves,
      ticket: done.length ? revenue / done.length : 0,
      total: inShift.length,
    };
  }, [state, shift]);

  const exportCSV = () => {
    const rows: (string | number)[][] = [
      ["Tipo", "Quando", "Descricao", "Detalhe", "Valor"],
      ...stats.moves.map((m) => [
        m.kind,
        dateTimeFmt(m.at),
        m.label,
        m.sub,
        m.amount.toFixed(2).replace(".", ","),
      ]),
      [],
      ["Fundo de troco", "", "", "", stats.floatValue.toFixed(2).replace(".", ",")],
      ["Faturamento", "", "", "", stats.revenue.toFixed(2).replace(".", ",")],
      ["Saldo esperado na gaveta", "", "", "", stats.drawer.toFixed(2).replace(".", ",")],
    ];
    downloadCSV(`caixa-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  if (!shift) {
    return (
      <div className="space-y-4">
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full border border-line text-zinc-400">
            <LockKeyhole className="h-6 w-6" aria-hidden />
          </span>
          <p className="font-bold text-xl text-white">Caixa fechado</p>
          <p className="max-w-sm text-sm text-zinc-400">
            Abra o turno informando o fundo de troco. A partir daí tudo que entrar e sair é contado aqui.
          </p>
          <Press variant="cta" className="mt-2 h-12 px-6" onClick={() => setOpening(true)}>
            Abrir o caixa
          </Press>
        </Card>
        {state.shifts.length > 0 && <ShiftHistory />}
        <OpenShiftSheet
          open={opening}
          onClose={() => setOpening(false)}
          onConfirm={async (value) => {
            setOpening(false);
            const err = await open(value);
            toast(
              err
                ? { title: "Não abriu", subtitle: err, tone: "erro" }
                : { title: "Caixa aberto", subtitle: `Fundo de troco ${money(value)}`, icon: <Check className="h-4.5 w-4.5 text-[#7fd79a]" /> },
            );
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-small text-zinc-400">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-aberto/15 px-3 py-1.5 font-semibold text-[#7fd79a]">
          <Wallet className="h-3.5 w-3.5" aria-hidden /> Turno aberto desde {timeFmt(shift.openedAt)}
        </span>
        <span>Aberto por {shift.openedBy}</span>
        <Press variant="panel" className="ml-auto h-10 px-4 text-sm" onClick={exportCSV}>
          <Download className="h-4 w-4" aria-hidden /> CSV do turno
        </Press>
        <Press variant="outline" className="h-10 px-4 text-sm" onClick={() => setClosing(true)}>
          <LockKeyhole className="h-4 w-4" aria-hidden /> Fechar caixa
        </Press>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat
          Icon={TrendingUp}
          label="Faturamento do turno"
          value={money(stats.revenue)}
          hint={`${money(stats.pending)} ainda em aberto`}
          accent="text-amber-300"
        />
        <Stat
          Icon={ShoppingBag}
          label="Pedidos no turno"
          value={String(stats.total)}
          hint={`${stats.done.length} concluídos e ${stats.openOrders.length} em andamento`}
        />
        <Stat Icon={Receipt} label="Ticket médio" value={money(stats.ticket)} hint="Por pedido concluído" />
        <Stat
          Icon={Vault}
          label="Esperado na gaveta"
          value={money(stats.drawer)}
          hint={`Fundo de troco ${money(stats.floatValue)}`}
          accent="text-[#7fd79a]"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <Wallet className="h-4 w-4 text-amber-400" aria-hidden /> Por forma de pagamento
          </h3>
          <div className="mt-5 space-y-4">
            {PAY.map((p, i) => {
              const v = stats.byPay[p.id];
              const pct = stats.revenue ? (v / stats.revenue) * 100 : 0;
              return (
                <div key={p.id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-zinc-300">
                      <p.Icon className="h-4 w-4 text-amber-400/80" aria-hidden /> {p.label}
                    </span>
                    <span className="font-bold tnum text-white">
                      {money(v)} <span className="ml-1 text-xs font-normal text-zinc-500">{pct.toFixed(0)}%</span>
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-sm bg-white/[0.06]">
                    <motion.div
                      className="h-full rounded-sm bg-gold"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ type: "spring", stiffness: 90, damping: 20, delay: 0.1 + i * 0.08 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Press variant="panel" className="h-11 text-sm text-[#9fe0b3]" onClick={() => setForm("reforco")}>
              <ArrowUpCircle className="h-4 w-4" aria-hidden /> Reforço
            </Press>
            <Press variant="panel" className="h-11 text-sm text-[#ffb3aa]" onClick={() => setForm("sangria")}>
              <ArrowDownCircle className="h-4 w-4" aria-hidden /> Sangria
            </Press>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-bold text-white">Movimentações do turno</h3>
          <ul className="thin-scroll mt-3 max-h-95 space-y-1.5 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {stats.moves.map((m) => (
                <motion.li
                  key={m.id}
                  layout
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 rounded-control border border-line px-3 py-2.5"
                >
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-md",
                      m.kind === "venda"
                        ? "bg-amber-400/10 text-amber-300"
                        : m.kind === "reforco"
                          ? "bg-aberto/15 text-[#7fd79a]"
                          : "bg-brasa/15 text-[#ff8f82]",
                    )}
                  >
                    {m.kind === "venda" ? (
                      <ShoppingBag className="h-4 w-4" aria-hidden />
                    ) : m.kind === "reforco" ? (
                      <ArrowUpCircle className="h-4 w-4" aria-hidden />
                    ) : (
                      <ArrowDownCircle className="h-4 w-4" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-100">{m.label}</p>
                    <p className="text-2xs tnum text-zinc-500">
                      {timeFmt(m.at)}, {m.sub}
                    </p>
                  </div>
                  <span className={cn("text-sm font-bold tnum", m.amount >= 0 ? "text-[#7fd79a]" : "text-[#ff8f82]")}>
                    {m.amount >= 0 ? "+" : "−"} {money(Math.abs(m.amount))}
                  </span>
                </motion.li>
              ))}
            </AnimatePresence>
            {stats.moves.length === 0 && (
              <li className="py-10 text-center text-sm text-zinc-500">Sem movimentações ainda neste turno.</li>
            )}
          </ul>
        </Card>
      </div>

      <ShiftHistory />

      <EntryForm
        type={form}
        onClose={() => setForm(null)}
        onSave={async (description, amount) => {
          const kind = form!;
          setForm(null);
          const err = await addCashEntry(kind, description, amount);
          toast(
            err
              ? { title: "Não salvou", subtitle: err, tone: "erro" }
              : {
                  title: kind === "reforco" ? "Reforço lançado" : "Sangria lançada",
                  subtitle: `${description}, ${money(amount)}`,
                  icon:
                    kind === "reforco" ? (
                      <ArrowUpCircle className="h-4.5 w-4.5 text-[#7fd79a]" />
                    ) : (
                      <ArrowDownCircle className="h-4.5 w-4.5 text-[#ff8f82]" />
                    ),
                },
          );
        }}
      />

      <CloseShiftSheet
        open={closing}
        expected={stats.drawer}
        onClose={() => setClosing(false)}
        onConfirm={async (counted, note) => {
          setClosing(false);
          const err = await closeShift(counted, note);
          const diff = counted - stats.drawer;
          toast(
            err
              ? { title: "Não fechou", subtitle: err, tone: "erro" }
              : {
                  title: "Caixa fechado",
                  subtitle:
                    Math.abs(diff) < 0.01
                      ? "Conferência bateu exatamente"
                      : `Diferença de ${money(Math.abs(diff))} ${diff > 0 ? "a mais" : "a menos"}`,
                  icon: <LockKeyhole className="h-4.5 w-4.5 text-amber-300" />,
                },
          );
        }}
      />
    </div>
  );
}

function ShiftHistory() {
  const { state } = useAdmin();
  const closed = state.shifts.filter((s) => s.closedAt).sort((a, b) => (b.closedAt ?? 0) - (a.closedAt ?? 0));
  if (!closed.length) return null;

  return (
    <Card>
      <h3 className="text-sm font-bold text-white">Turnos fechados</h3>
      <ul className="mt-3 space-y-1.5">
        {closed.slice(0, 8).map((s) => {
          const diff = (s.counted ?? 0) - 0;
          return (
            <li key={s.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b border-line py-2 last:border-0">
              <span className="text-small tnum text-zinc-300">{dateTimeFmt(s.openedAt)}</span>
              <span className="text-2xs text-zinc-500">Até {s.closedAt ? timeFmt(s.closedAt) : "—"}</span>
              <span className="text-2xs text-zinc-500">Fechado por {s.closedBy ?? s.openedBy}</span>
              <span className="ml-auto text-small font-semibold tnum text-zinc-200">Contado {money(diff)}</span>
              {s.note && <span className="w-full text-2xs text-zinc-500">{s.note}</span>}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function OpenShiftSheet({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (value: number) => void;
}) {
  const [value, setValue] = useState(100);
  return (
    <Sheet open={open} onClose={onClose} label="Abrir o caixa">
      <form
        className="space-y-4 p-5 pt-4 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          onConfirm(value);
        }}
      >
        <h2 className="font-bold pr-10 text-xl text-white">Abrir o caixa</h2>
        <MoneyField
          label="Fundo de troco"
          hint="Quanto em dinheiro está na gaveta agora."
          value={value}
          onChange={setValue}
        />
        <Press type="submit" variant="cta" className="h-12 w-full">
          Abrir turno
        </Press>
      </form>
    </Sheet>
  );
}

function CloseShiftSheet({
  open,
  expected,
  onClose,
  onConfirm,
}: {
  open: boolean;
  expected: number;
  onClose: () => void;
  onConfirm: (counted: number, note: string) => void;
}) {
  const [counted, setCounted] = useState(0);
  const [note, setNote] = useState("");
  const diff = counted - expected;

  return (
    <Sheet open={open} onClose={onClose} label="Fechar o caixa">
      <form
        className="space-y-4 p-5 pt-4 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          onConfirm(counted, note.trim());
        }}
      >
        <h2 className="font-bold pr-10 text-xl text-white">Fechar o caixa</h2>
        <p className="text-small text-zinc-400">
          O sistema espera <b className="tnum text-white">{money(expected)}</b> em dinheiro na gaveta. Conte e informe o
          valor real.
        </p>
        <MoneyField label="Valor contado" value={counted} onChange={setCounted} />
        {counted > 0 && (
          <p
            className={cn(
              "rounded-control border px-3.5 py-2.5 text-small font-semibold",
              Math.abs(diff) < 0.01
                ? "border-aberto/40 bg-aberto/10 text-[#9fe0b3]"
                : "border-amber-400/40 bg-amber-400/10 text-amber-200",
            )}
          >
            {Math.abs(diff) < 0.01
              ? "Bateu exatamente."
              : `Diferença de ${money(Math.abs(diff))} ${diff > 0 ? "a mais na gaveta" : "a menos na gaveta"}.`}
          </p>
        )}
        <Field label="Observação" hint="Opcional: explique a diferença, se houver.">
          <input
            className={inputCls}
            maxLength={160}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Troco adiantado para o motoboy"
          />
        </Field>
        <Press type="submit" variant="cta" className="h-12 w-full">
          <LockKeyhole className="h-4 w-4" aria-hidden /> Fechar turno
        </Press>
      </form>
    </Sheet>
  );
}

function EntryForm({
  type,
  onClose,
  onSave,
}: {
  type: CashEntry["type"] | null;
  onClose: () => void;
  onSave: (d: string, v: number) => void;
}) {
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState(0);
  const valid = desc.trim().length > 1 && amount > 0;

  return (
    <Sheet open={!!type} onClose={onClose} label="Lançamento de caixa">
      <form
        className="space-y-4 p-5 pt-4 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onSave(desc.trim(), amount);
          setDesc("");
          setAmount(0);
        }}
      >
        <h2 className="font-bold flex items-center gap-2 pr-10 text-xl text-white">
          {type === "reforco" ? (
            <ArrowUpCircle className="h-5 w-5 text-[#7fd79a]" aria-hidden />
          ) : (
            <ArrowDownCircle className="h-5 w-5 text-[#ff8f82]" aria-hidden />
          )}
          {type === "reforco" ? "Reforço de caixa" : "Sangria ou despesa"}
        </h2>
        <Field label="Descrição">
          <input
            className={inputCls}
            placeholder={type === "reforco" ? "Troco adicional" : "Compra de gás, motoboy…"}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            maxLength={80}
            autoFocus
          />
        </Field>
        <MoneyField label="Valor" value={amount} onChange={setAmount} />
        <Press type="submit" variant="cta" className="h-12 w-full" disabled={!valid}>
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
          <div key={i} className="panel space-y-3 rounded-card p-5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-2.5 w-32" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="panel space-y-5 rounded-card p-5">
          <Skeleton className="h-4 w-40" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-2.5 w-full rounded-sm" />
            </div>
          ))}
        </div>
        <div className="panel space-y-2 rounded-card p-5">
          <Skeleton className="h-4 w-44" />
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-control" />
          ))}
        </div>
      </div>
    </div>
  );
}
