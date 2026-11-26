"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bike, Check, Info, Pencil, Plus, Store, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Press, spring } from "@/components/ui/Press";
import { Sheet } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { etaLabel } from "@/lib/data";
import { cn, money, slug, uid } from "@/lib/format";
import { useAdmin, useAdminActions } from "@/lib/adminStore";
import { useToast } from "@/lib/toast";
import type { Extra, Neighborhood } from "@/lib/types";
import { Field, Hint, MoneyField, NumberField, inputCls } from "./kit";

type Tab = "bairros" | "adicionais";

/** Áreas de entrega (frete e tempo) e adicionais do cardápio. */
export function DeliveryPanel() {
  const [tab, setTab] = useState<Tab>("bairros");
  const { state } = useAdmin();

  return (
    <div className="space-y-4">
      <div className="panel inline-flex rounded-full p-1">
        {(
          [
            ["bairros", "Áreas de entrega", state.neighborhoods.length],
            ["adicionais", "Adicionais", state.extras.length],
          ] as [Tab, string, number][]
        ).map(([id, label, n]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "relative rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              tab === id ? "text-on-brand" : "text-zinc-400 hover:text-white",
            )}
          >
            {tab === id && (
              <motion.span
                layoutId="aba-entrega"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-full bg-gold"
              />
            )}
            <span className="relative">
              {label} <span className="tnum opacity-60">{n}</span>
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {tab === "bairros" ? <Neighborhoods /> : <Extras />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------ bairros ------------------------------ */

const newNeighborhood = (): Neighborhood => ({
  id: `nb-${uid()}`,
  name: "",
  hint: "",
  fee: 5,
  etaMin: 30,
  etaMax: 45,
  active: true,
  order: 999,
});

function Neighborhoods() {
  const { state } = useAdmin();
  const { saveNeighborhood, deleteNeighborhood } = useAdminActions();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Neighborhood | null>(null);
  const list = [...state.neighborhoods].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Hint Icon={Info}>
          O cliente escolhe a área antes de fechar. O frete e a previsão vêm daqui.
        </Hint>
        <Press variant="cta" className="h-10 shrink-0 px-4 text-sm" onClick={() => setEditing(newNeighborhood())}>
          <Plus className="h-4 w-4" aria-hidden /> Nova área
        </Press>
      </div>

      <ul className="grid gap-2.5 md:grid-cols-2">
        <AnimatePresence initial={false}>
          {list.map((n) => {
            const used = state.orders.filter((o) => o.neighborhoodId === n.id).length;
            return (
              <motion.li
                key={n.id}
                layout
                transition={spring}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: 30 }}
                className={cn("spotlight p-3.5", !n.active && "opacity-60")}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-control",
                      n.active ? "bg-amber-400/15 text-amber-300" : "bg-white/[0.05] text-zinc-500",
                    )}
                  >
                    {n.pickup ? <Store className="h-5 w-5" aria-hidden /> : <Bike className="h-5 w-5" aria-hidden />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-white">{n.name}</p>
                    <p className="truncate text-2xs text-zinc-500">{n.hint || "sem descrição"}</p>
                    <p className="mt-0.5 text-sm font-bold tnum text-amber-300">
                      {n.fee ? money(n.fee) : "sem taxa"}
                      <span className="ml-1.5 text-2xs font-medium text-zinc-500">{etaLabel(n)}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setEditing(n)}
                    aria-label={`Editar ${n.name}`}
                    className="grid h-9 w-9 place-items-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white"
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                  <Switch
                    size="sm"
                    label={`Oferecer ${n.name}`}
                    checked={n.active}
                    onChange={async (v) => {
                      const err = await saveNeighborhood({ ...n, active: v });
                      if (err) toast({ title: "Não salvou", subtitle: err, tone: "erro" });
                    }}
                  />
                </div>
                {used > 0 && (
                  <p className="mt-2 text-2xs tnum text-zinc-600">{used} pedidos já usaram esta área</p>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      <NeighborhoodEditor
        value={editing}
        exists={!!editing && state.neighborhoods.some((x) => x.id === editing.id)}
        hasOrders={!!editing && state.orders.some((o) => o.neighborhoodId === editing.id)}
        onClose={() => setEditing(null)}
        onSave={async (n) => {
          setEditing(null);
          const err = await saveNeighborhood(n);
          toast(
            err
              ? { title: "Não salvou", subtitle: err, tone: "erro" }
              : { title: "Área salva", subtitle: `${n.name}, ${n.fee ? money(n.fee) : "sem taxa"}`, icon: <Check className="h-4.5 w-4.5 text-[#7fd79a]" /> },
          );
        }}
        onDelete={async (n) => {
          setEditing(null);
          const err = await deleteNeighborhood(n.id);
          toast(
            err
              ? { title: "Não salvou", subtitle: err, tone: "erro" }
              : { title: "Área removida", subtitle: n.name, icon: <Trash2 className="h-4.5 w-4.5 text-brasa" /> },
          );
        }}
      />
    </div>
  );
}

function NeighborhoodEditor({
  value,
  exists,
  hasOrders,
  onClose,
  onSave,
  onDelete,
}: {
  value: Neighborhood | null;
  exists: boolean;
  hasOrders: boolean;
  onClose: () => void;
  onSave: (n: Neighborhood) => void;
  onDelete: (n: Neighborhood) => void;
}) {
  const [d, setD] = useState<Neighborhood | null>(value);
  useEffect(() => setD(value), [value]);
  const set = (p: Partial<Neighborhood>) => setD((x) => (x ? { ...x, ...p } : x));
  const valid = !!d && d.name.trim().length > 1 && d.etaMax >= d.etaMin;

  return (
    <Sheet open={!!value} onClose={onClose} label={exists ? "Editar área" : "Nova área"}>
      {d && (
        <form
          className="space-y-4 p-5 pt-4 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) onSave({ ...d, name: d.name.trim(), hint: d.hint.trim() });
          }}
        >
          <h2 className="letreiro pr-10 text-2xl text-white">{exists ? "Editar área" : "Nova área"}</h2>

          <Field label="Nome" hint="É o que o cliente vê na lista.">
            <input
              autoFocus
              className={inputCls}
              maxLength={50}
              value={d.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="Centro, Interior, Vila Nova…"
            />
          </Field>
          <Field label="Descrição curta">
            <input
              className={inputCls}
              maxLength={80}
              value={d.hint}
              onChange={(e) => set({ hint: e.target.value })}
              placeholder="Até 3 km do centro"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <MoneyField label="Frete" value={d.fee} onChange={(fee) => set({ fee })} />
            <NumberField label="Tempo mínimo" suffix="min" value={d.etaMin} onChange={(etaMin) => set({ etaMin })} max={600} />
            <NumberField label="Tempo máximo" suffix="min" value={d.etaMax} onChange={(etaMax) => set({ etaMax })} max={600} />
          </div>

          <div className="flex items-center justify-between rounded-control border border-line px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">É retirada no local</p>
              <p className="text-2xs text-zinc-500">Não pede endereço e o tempo conta só o preparo.</p>
            </div>
            <Switch label="É retirada no local" checked={!!d.pickup} onChange={(v) => set({ pickup: v })} />
          </div>

          <div className="flex items-center justify-between rounded-control border border-line px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Oferecer para os clientes</p>
              <p className="text-2xs text-zinc-500">Desligue para esconder sem apagar.</p>
            </div>
            <Switch label="Oferecer para os clientes" checked={d.active} onChange={(v) => set({ active: v })} />
          </div>

          <div className="flex items-center gap-2 pt-1">
            {exists && (
              <Press
                type="button"
                variant="ghost"
                className="h-11 px-3 text-sm text-zinc-400"
                title={hasOrders ? "Tem pedidos no histórico: será apenas desativada" : ""}
                onClick={() => onDelete(d)}
              >
                <Trash2 className="h-4 w-4" aria-hidden /> {hasOrders ? "Desativar" : "Excluir"}
              </Press>
            )}
            <Press type="submit" variant="cta" className="ml-auto h-11 px-6 text-sm" disabled={!valid}>
              <Check className="h-4 w-4" aria-hidden /> Salvar área
            </Press>
          </div>
        </form>
      )}
    </Sheet>
  );
}

/* ----------------------------- adicionais ----------------------------- */

const newExtra = (): Extra => ({
  id: `ex-${uid()}`,
  name: "",
  price: 5,
  ingredient: "",
  amount: 0.08,
  active: true,
});

function Extras() {
  const { state } = useAdmin();
  const { saveExtra, deleteExtra } = useAdminActions();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Extra | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Hint Icon={Info}>
          Os adicionais aparecem na tela do produto. Ligar um insumo faz o estoque baixar junto.
        </Hint>
        <Press variant="cta" className="h-10 shrink-0 px-4 text-sm" onClick={() => setEditing(newExtra())}>
          <Plus className="h-4 w-4" aria-hidden /> Novo adicional
        </Press>
      </div>

      <ul className="grid gap-2.5 md:grid-cols-2">
        <AnimatePresence initial={false}>
          {state.extras.map((e) => {
            const ing = state.stock.find((i) => i.id === e.ingredient);
            return (
              <motion.li
                key={e.id}
                layout
                transition={spring}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: 30 }}
                className={cn("spotlight flex items-center gap-3 p-3.5", !e.active && "opacity-60")}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-white">{e.name}</p>
                  <p className="truncate text-2xs text-zinc-500">
                    {ing ? `baixa ${e.amount} ${ing.unit} de ${ing.name}` : "sem baixa de estoque"}
                  </p>
                  <p className="mt-0.5 text-sm font-bold tnum text-amber-300">+{money(e.price)}</p>
                </div>
                <button
                  onClick={() => setEditing(e)}
                  aria-label={`Editar ${e.name}`}
                  className="grid h-9 w-9 place-items-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white"
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </button>
                <Switch
                  size="sm"
                  label={`Oferecer ${e.name}`}
                  checked={e.active}
                  onChange={async (v) => {
                    const err = await saveExtra({ ...e, active: v });
                    if (err) toast({ title: "Não salvou", subtitle: err, tone: "erro" });
                  }}
                />
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      <ExtraEditor
        value={editing}
        exists={!!editing && state.extras.some((x) => x.id === editing.id)}
        onClose={() => setEditing(null)}
        onSave={async (e) => {
          setEditing(null);
          const err = await saveExtra(e);
          toast(
            err
              ? { title: "Não salvou", subtitle: err, tone: "erro" }
              : { title: "Adicional salvo", subtitle: e.name, icon: <Check className="h-4.5 w-4.5 text-[#7fd79a]" /> },
          );
        }}
        onDelete={async (e) => {
          setEditing(null);
          const err = await deleteExtra(e.id);
          toast(
            err
              ? { title: "Não salvou", subtitle: err, tone: "erro" }
              : { title: "Adicional excluído", subtitle: e.name, icon: <Trash2 className="h-4.5 w-4.5 text-brasa" /> },
          );
        }}
      />
    </div>
  );
}

function ExtraEditor({
  value,
  exists,
  onClose,
  onSave,
  onDelete,
}: {
  value: Extra | null;
  exists: boolean;
  onClose: () => void;
  onSave: (e: Extra) => void;
  onDelete: (e: Extra) => void;
}) {
  const { state } = useAdmin();
  const [d, setD] = useState<Extra | null>(value);
  useEffect(() => setD(value), [value]);
  const set = (p: Partial<Extra>) => setD((x) => (x ? { ...x, ...p } : x));
  const valid = !!d && d.name.trim().length > 1;
  const ing = d && state.stock.find((i) => i.id === d.ingredient);

  return (
    <Sheet open={!!value} onClose={onClose} label={exists ? "Editar adicional" : "Novo adicional"}>
      {d && (
        <form
          className="space-y-4 p-5 pt-4 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) onSave({ ...d, name: d.name.trim(), id: exists ? d.id : `ex-${slug(d.name) || uid()}` });
          }}
        >
          <h2 className="letreiro pr-10 text-2xl text-white">{exists ? "Editar adicional" : "Novo adicional"}</h2>

          <Field label="Nome">
            <input
              autoFocus
              className={inputCls}
              maxLength={50}
              value={d.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="Bacon crocante"
            />
          </Field>

          <MoneyField label="Preço" value={d.price} onChange={(price) => set({ price })} />

          <Field label="Insumo que sai do estoque" hint="Opcional. Escolha para a baixa acontecer sozinha.">
            <select
              className={inputCls}
              value={d.ingredient}
              onChange={(e) => set({ ingredient: e.target.value })}
            >
              <option value="">Nenhum</option>
              {state.stock.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </Field>

          {ing && (
            <NumberField
              label="Quanto sai por adicional"
              suffix={ing.unit}
              step={0.01}
              max={100}
              value={d.amount}
              onChange={(amount) => set({ amount })}
            />
          )}

          <div className="flex items-center gap-2 pt-1">
            {exists && (
              <Press type="button" variant="ghost" className="h-11 px-3 text-sm text-zinc-400" onClick={() => onDelete(d)}>
                <Trash2 className="h-4 w-4" aria-hidden /> Excluir
              </Press>
            )}
            <Press type="submit" variant="cta" className="ml-auto h-11 px-6 text-sm" disabled={!valid}>
              <Check className="h-4 w-4" aria-hidden /> Salvar adicional
            </Press>
          </div>
        </form>
      )}
    </Sheet>
  );
}
