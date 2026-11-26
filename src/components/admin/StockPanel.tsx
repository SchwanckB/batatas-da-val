"use client";

import { motion } from "framer-motion";
import { Check, CircleCheck, Minus, Pencil, Plus, TriangleAlert, Trash2, OctagonX } from "lucide-react";
import { useEffect, useState } from "react";
import { Press, spring } from "@/components/ui/Press";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { stockLevel, type StockLevel } from "@/lib/data";
import { cn, qtyFmt, slug, uid } from "@/lib/format";
import { useAdmin, useAdminActions } from "@/lib/adminStore";
import { useToast } from "@/lib/toast";
import type { Ingredient } from "@/lib/types";
import { Field, NumberField, inputCls } from "./kit";

const LEVEL: Record<StockLevel, { label: string; bar: string; chip: string; Icon: typeof CircleCheck }> = {
  ok: { label: "No ponto", bar: "bg-aberto", chip: "bg-aberto/15 text-[#7fd79a]", Icon: CircleCheck },
  atencao: { label: "Atenção", bar: "bg-gold", chip: "bg-amber-400/15 text-amber-300", Icon: TriangleAlert },
  critico: { label: "Crítico", bar: "bg-brasa", chip: "bg-brasa/15 text-[#ff8f82]", Icon: OctagonX },
};

const UNITS: Ingredient["unit"][] = ["kg", "l", "pct", "un"];

const newIngredient = (): Ingredient => ({
  id: "",
  name: "",
  unit: "kg",
  qty: 0,
  min: 1,
  max: 10,
  step: 0.5,
});

/** Insumos da cozinha: baixa automática ao preparar e reposição rápida. */
export function StockPanel() {
  const { state, can } = useAdmin();
  const { adjustStock, saveIngredient, deleteIngredient } = useAdminActions();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Ingredient | null>(null);

  const counts = state.stock.reduce(
    (acc, i) => ({ ...acc, [stockLevel(i)]: acc[stockLevel(i)] + 1 }),
    { ok: 0, atencao: 0, critico: 0 } as Record<StockLevel, number>,
  );
  const order: Record<StockLevel, number> = { critico: 0, atencao: 1, ok: 2 };
  const sorted = [...state.stock].sort((a, b) => order[stockLevel(a)] - order[stockLevel(b)]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["critico", "atencao", "ok"] as StockLevel[]).map((l) => {
          const L = LEVEL[l];
          return (
            <span
              key={l}
              className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold tnum", L.chip)}
            >
              <L.Icon className="h-3.5 w-3.5" aria-hidden /> {counts[l]} {L.label}
            </span>
          );
        })}
        <span className="hidden self-center text-xs text-zinc-500 sm:block">
          A baixa acontece quando o pedido entra em preparo.
        </span>
        {can("stock:save") && (
          <Press variant="cta" className="ml-auto h-10 px-4 text-sm" onClick={() => setEditing(newIngredient())}>
            <Plus className="h-4 w-4" aria-hidden /> Novo insumo
          </Press>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((i) => {
          const lvl = stockLevel(i);
          const L = LEVEL[lvl];
          const pct = Math.min(100, i.max ? (i.qty / i.max) * 100 : 0);
          const minPct = i.max ? (i.min / i.max) * 100 : 0;
          return (
            <motion.div
              key={i.id}
              layout
              transition={spring}
              className={cn("spotlight p-4", lvl === "critico" && "border-brasa/50")}
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{i.name}</p>
                  <p className="mt-0.5 text-2xs tnum text-zinc-500">
                    Mínimo {qtyFmt(i.min, i.unit)}, capacidade {qtyFmt(i.max, i.unit)}
                  </p>
                </div>
                {can("stock:save") && (
                  <button
                    onClick={() => setEditing(i)}
                    aria-label={`Editar ${i.name}`}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-zinc-500 hover:bg-white/10 hover:text-white"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                  </button>
                )}
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-bold",
                    L.chip,
                  )}
                >
                  <L.Icon className="h-3 w-3" aria-hidden /> {L.label}
                </span>
              </div>

              <div className="mt-4 flex items-end justify-between gap-2">
                <motion.p
                  key={i.qty}
                  initial={{ opacity: 0.4, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-bold tnum text-white"
                >
                  {qtyFmt(i.qty, i.unit)}
                </motion.p>
                <div className="flex items-center gap-1 rounded-full border border-line p-1">
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    transition={spring}
                    onClick={() => adjustStock(i.id, -i.step)}
                    aria-label={`Diminuir ${i.name}`}
                    className="grid h-8 w-8 place-items-center rounded-full text-zinc-300 hover:bg-white/10"
                  >
                    <Minus className="h-4 w-4" aria-hidden />
                  </motion.button>
                  <span className="px-1 text-2xs font-semibold tnum text-zinc-500">
                    {i.step} {i.unit}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    transition={spring}
                    onClick={() => adjustStock(i.id, i.step)}
                    aria-label={`Repor ${i.name}`}
                    className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white hover:bg-white/15"
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                  </motion.button>
                </div>
              </div>

              <div className="relative mt-3 h-2.5 rounded-sm bg-white/[0.06]">
                <motion.div
                  className={cn("h-full rounded-sm", L.bar)}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ type: "spring", stiffness: 110, damping: 20 }}
                />
                <span
                  className="absolute -top-1 h-4.5 w-0.5 rounded-full bg-white/50"
                  style={{ left: `${minPct}%` }}
                  title="Estoque mínimo"
                  aria-hidden
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      <IngredientEditor
        value={editing}
        exists={!!editing && state.stock.some((x) => x.id === editing.id)}
        usedBy={
          editing
            ? state.products.filter((p) => p.recipe[editing.id] !== undefined).length +
              state.extras.filter((e) => e.ingredient === editing.id).length
            : 0
        }
        onClose={() => setEditing(null)}
        onSave={async (ing) => {
          setEditing(null);
          const err = await saveIngredient(ing);
          toast(
            err
              ? { title: "Não salvou", subtitle: err, tone: "erro" }
              : { title: "Insumo salvo", subtitle: ing.name, icon: <Check className="h-4.5 w-4.5 text-[#7fd79a]" /> },
          );
        }}
        onDelete={async (ing) => {
          setEditing(null);
          const err = await deleteIngredient(ing.id);
          toast(
            err
              ? { title: "Não excluiu", subtitle: err, tone: "erro" }
              : { title: "Insumo excluído", subtitle: ing.name, icon: <Trash2 className="h-4.5 w-4.5 text-brasa" /> },
          );
        }}
      />
    </div>
  );
}

function IngredientEditor({
  value,
  exists,
  usedBy,
  onClose,
  onSave,
  onDelete,
}: {
  value: Ingredient | null;
  exists: boolean;
  usedBy: number;
  onClose: () => void;
  onSave: (i: Ingredient) => void;
  onDelete: (i: Ingredient) => void;
}) {
  const [d, setD] = useState<Ingredient | null>(value);
  useEffect(() => setD(value), [value]);
  const set = (p: Partial<Ingredient>) => setD((x) => (x ? { ...x, ...p } : x));
  const valid = !!d && d.name.trim().length > 1 && d.max > 0 && d.step > 0;

  return (
    <Sheet open={!!value} onClose={onClose} label={exists ? "Editar insumo" : "Novo insumo"}>
      {d && (
        <form
          className="space-y-4 p-5 pt-4 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            onSave({ ...d, name: d.name.trim(), id: exists ? d.id : slug(d.name) || `ing-${uid()}` });
          }}
        >
          <h2 className="font-bold pr-10 text-xl text-white">{exists ? "Editar insumo" : "Novo insumo"}</h2>

          <Field label="Nome">
            <input
              autoFocus
              className={inputCls}
              maxLength={60}
              value={d.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="Batata inglesa"
            />
          </Field>

          <Field label="Unidade de medida">
            <div className="grid grid-cols-4 gap-2">
              {UNITS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => set({ unit: u })}
                  className={cn(
                    "rounded-control border py-2.5 text-sm font-semibold transition-colors",
                    d.unit === u ? "border-amber-400/60 bg-amber-400/10 text-white" : "border-line text-zinc-400",
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              label="Quantidade atual"
              suffix={d.unit}
              step={d.unit === "kg" || d.unit === "l" ? 0.1 : 1}
              value={d.qty}
              onChange={(qty) => set({ qty })}
              max={100000}
            />
            <NumberField
              label="Passo de reposição"
              suffix={d.unit}
              hint="Quanto cada toque em + ou − muda."
              step={0.1}
              value={d.step}
              onChange={(step) => set({ step })}
              max={1000}
            />
            <NumberField
              label="Estoque mínimo"
              suffix={d.unit}
              hint="Abaixo disso o insumo fica crítico."
              step={0.1}
              value={d.min}
              onChange={(min) => set({ min })}
              max={100000}
            />
            <NumberField
              label="Capacidade"
              suffix={d.unit}
              hint="Serve de referência para a barra."
              step={0.1}
              value={d.max}
              onChange={(max) => set({ max })}
              max={100000}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            {exists && (
              <Press
                type="button"
                variant="ghost"
                className="h-11 px-3 text-sm text-zinc-400"
                disabled={usedBy > 0}
                title={usedBy > 0 ? `${usedBy} itens usam este insumo na ficha técnica` : ""}
                onClick={() => onDelete(d)}
              >
                <Trash2 className="h-4 w-4" aria-hidden /> {usedBy > 0 ? `Em uso (${usedBy})` : "Excluir"}
              </Press>
            )}
            <Press type="submit" variant="cta" className="ml-auto h-11 px-6 text-sm" disabled={!valid}>
              <Check className="h-4 w-4" aria-hidden /> Salvar insumo
            </Press>
          </div>
        </form>
      )}
    </Sheet>
  );
}

export function StockSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-full" />
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="panel space-y-3 rounded-card p-4">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-44" />
            <div className="flex justify-between">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-9 w-28 rounded-full" />
            </div>
            <Skeleton className="h-2.5 w-full rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
