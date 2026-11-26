"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Info, Pencil, Plus, Ticket, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Press, spring } from "@/components/ui/Press";
import { Sheet } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { couponLabel, normalizeCode } from "@/lib/coupon";
import { cn, dateFmt, money, uid } from "@/lib/format";
import { useAdmin, useAdminActions } from "@/lib/adminStore";
import { useToast } from "@/lib/toast";
import type { Coupon } from "@/lib/types";
import { Card, Field, Hint, MoneyField, NumberField, inputCls } from "./kit";

const newCoupon = (): Coupon => ({
  id: `c-${uid()}`,
  code: "",
  kind: "percent",
  value: 10,
  minOrder: 0,
  maxUses: 0,
  uses: 0,
  expiresAt: null,
  active: true,
});

const toInputDate = (t: number | null) => (t ? new Date(t).toISOString().slice(0, 10) : "");

/** Cupons de desconto. A validação final acontece sempre no servidor. */
export function CouponsPanel() {
  const { state } = useAdmin();
  const { saveCoupon, deleteCoupon } = useAdminActions();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Coupon | null>(null);

  const usedTotal = state.orders.reduce((s, o) => s + (o.couponCode ? o.discount : 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Hint Icon={Info}>
          O cliente digita o código no fechamento. Quem desiste do pedido devolve o uso automaticamente.
        </Hint>
        <Press variant="cta" className="h-10 shrink-0 px-4 text-sm" onClick={() => setEditing(newCoupon())}>
          <Plus className="h-4 w-4" aria-hidden /> Novo cupom
        </Press>
      </div>

      {usedTotal > 0 && (
        <Card>
          <p className="text-small text-zinc-400">Desconto concedido no histórico</p>
          <p className="mt-1 text-2xl font-bold tnum text-amber-300">{money(usedTotal)}</p>
        </Card>
      )}

      <ul className="grid gap-2.5 md:grid-cols-2">
        <AnimatePresence initial={false}>
          {state.coupons.map((c) => {
            const expired = c.expiresAt ? c.expiresAt < Date.now() : false;
            const exhausted = c.maxUses > 0 && c.uses >= c.maxUses;
            return (
              <motion.li
                key={c.id}
                layout
                transition={spring}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: 30 }}
                className={cn("spotlight p-3.5", (!c.active || expired || exhausted) && "opacity-60")}
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-amber-400/15 text-amber-300">
                    <Ticket className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold tracking-wide text-white">{c.code}</p>
                    <p className="truncate text-2xs text-zinc-500">
                      {couponLabel(c)}
                      {c.minOrder > 0 && `, mínimo ${money(c.minOrder)}`}
                    </p>
                    <p className="mt-0.5 text-2xs tnum text-zinc-500">
                      {c.uses} {c.uses === 1 ? "uso" : "usos"}
                      {c.maxUses > 0 && ` de ${c.maxUses}`}
                      {c.expiresAt && `, até ${dateFmt(c.expiresAt)}`}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditing(c)}
                    aria-label={`Editar cupom ${c.code}`}
                    className="grid h-9 w-9 place-items-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white"
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                  <Switch
                    size="sm"
                    label={`Ativar cupom ${c.code}`}
                    checked={c.active}
                    onChange={async (v) => {
                      const err = await saveCoupon({ ...c, active: v });
                      if (err) toast({ title: "Não salvou", subtitle: err, tone: "erro" });
                    }}
                  />
                </div>
                {(expired || exhausted) && (
                  <p className="mt-2 text-2xs font-semibold text-amber-300">
                    {expired ? "Venceu" : "Chegou ao limite de usos"} — não é mais aceito.
                  </p>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {state.coupons.length === 0 && (
        <p className="rounded-card border border-dashed border-line py-12 text-center text-sm text-zinc-500">
          Nenhum cupom criado. Comece com um de 10% para quem pede pela primeira vez.
        </p>
      )}

      <CouponEditor
        value={editing}
        exists={!!editing && state.coupons.some((x) => x.id === editing.id)}
        takenCodes={state.coupons.filter((c) => c.id !== editing?.id).map((c) => normalizeCode(c.code))}
        onClose={() => setEditing(null)}
        onSave={async (c) => {
          setEditing(null);
          const err = await saveCoupon(c);
          toast(
            err
              ? { title: "Não salvou", subtitle: err, tone: "erro" }
              : { title: "Cupom salvo", subtitle: `${c.code}, ${couponLabel(c)}`, icon: <Check className="h-4.5 w-4.5 text-[#7fd79a]" /> },
          );
        }}
        onDelete={async (c) => {
          setEditing(null);
          const err = await deleteCoupon(c.id);
          toast(
            err
              ? { title: "Não salvou", subtitle: err, tone: "erro" }
              : { title: "Cupom excluído", subtitle: c.code, icon: <Trash2 className="h-4.5 w-4.5 text-brasa" /> },
          );
        }}
      />
    </div>
  );
}

function CouponEditor({
  value,
  exists,
  takenCodes,
  onClose,
  onSave,
  onDelete,
}: {
  value: Coupon | null;
  exists: boolean;
  takenCodes: string[];
  onClose: () => void;
  onSave: (c: Coupon) => void;
  onDelete: (c: Coupon) => void;
}) {
  const [d, setD] = useState<Coupon | null>(value);
  useEffect(() => setD(value), [value]);
  const set = (p: Partial<Coupon>) => setD((x) => (x ? { ...x, ...p } : x));

  const code = d ? normalizeCode(d.code) : "";
  const duplicated = takenCodes.includes(code);
  const valid = !!d && code.length >= 3 && !duplicated && d.value > 0 && (d.kind !== "percent" || d.value <= 100);

  return (
    <Sheet open={!!value} onClose={onClose} label={exists ? "Editar cupom" : "Novo cupom"}>
      {d && (
        <form
          className="space-y-4 p-5 pt-4 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) onSave({ ...d, code });
          }}
        >
          <h2 className="letreiro pr-10 text-2xl text-white">{exists ? "Editar cupom" : "Novo cupom"}</h2>

          <Field
            label="Código"
            hint="Só letras e números. O cliente digita sem se preocupar com maiúsculas."
            error={duplicated ? "Já existe um cupom com este código." : undefined}
          >
            <input
              autoFocus
              className={cn(inputCls, "uppercase tracking-wide")}
              maxLength={20}
              value={d.code}
              onChange={(e) => set({ code: e.target.value.toUpperCase() })}
              placeholder="PRIMEIRA10"
            />
          </Field>

          <Field label="Tipo de desconto">
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["percent", "Porcentagem"],
                  ["fixo", "Valor fixo"],
                ] as [Coupon["kind"], string][]
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => set({ kind: k })}
                  className={cn(
                    "rounded-control border px-3 py-2.5 text-sm font-semibold transition-colors",
                    d.kind === k ? "border-amber-400/60 bg-amber-400/10 text-white" : "border-line text-zinc-400",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>

          {d.kind === "percent" ? (
            <NumberField
              label="Desconto"
              suffix="%"
              max={100}
              value={d.value}
              onChange={(value) => set({ value })}
            />
          ) : (
            <MoneyField label="Desconto" value={d.value} onChange={(value) => set({ value })} />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <MoneyField
              label="Pedido mínimo"
              hint="0 = vale para qualquer valor."
              value={d.minOrder}
              onChange={(minOrder) => set({ minOrder })}
            />
            <NumberField
              label="Limite de usos"
              hint="0 = sem limite."
              value={d.maxUses}
              onChange={(maxUses) => set({ maxUses })}
              max={100000}
            />
          </div>

          <Field label="Vence em" hint="Deixe vazio para não ter prazo.">
            <input
              type="date"
              className={cn(inputCls, "tnum")}
              value={toInputDate(d.expiresAt)}
              onChange={(e) =>
                set({ expiresAt: e.target.value ? new Date(`${e.target.value}T23:59:59`).getTime() : null })
              }
            />
          </Field>

          <div className="flex items-center justify-between rounded-control border border-line px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Aceitar agora</p>
              <p className="text-2xs tnum text-zinc-500">Já usado {d.uses}x</p>
            </div>
            <Switch label="Aceitar agora" checked={d.active} onChange={(v) => set({ active: v })} />
          </div>

          <div className="flex items-center gap-2 pt-1">
            {exists && (
              <Press type="button" variant="ghost" className="h-11 px-3 text-sm text-zinc-400" onClick={() => onDelete(d)}>
                <Trash2 className="h-4 w-4" aria-hidden /> Excluir
              </Press>
            )}
            <Press type="submit" variant="cta" className="ml-auto h-11 px-6 text-sm" disabled={!valid}>
              <Check className="h-4 w-4" aria-hidden /> Salvar cupom
            </Press>
          </div>
        </form>
      )}
    </Sheet>
  );
}
