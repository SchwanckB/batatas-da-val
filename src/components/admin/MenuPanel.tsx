"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, Check, Eye, EyeOff, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductArt } from "@/components/client/ProductArt";
import { Press, spring } from "@/components/ui/Press";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spotlight } from "@/components/ui/Spotlight";
import { Switch } from "@/components/ui/Switch";
import { SECTION_ICONS } from "@/components/ui/sectionIcons";
import { cn, money, uid } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Product, Section, SectionIcon } from "@/lib/types";
import { newProduct, ProductEditor } from "./ProductEditor";

type Tab = "secoes" | "produtos";

export function MenuPanel() {
  const [tab, setTab] = useState<Tab>("secoes");
  const [editing, setEditing] = useState<Product | null>(null);
  const [filter, setFilter] = useState<string>("todas");
  const { shared } = useStore();
  const firstSection = [...shared.sections].sort((a, b) => a.order - b.order)[0]?.id ?? "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="glass flex rounded-full p-1">
          {(
            [
              ["secoes", "Seções"],
              ["produtos", "Produtos"],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={cn("relative rounded-full px-5 py-2 text-sm font-semibold transition-colors", tab === id ? "text-on-brand" : "text-zinc-400 hover:text-white")}>
              {tab === id && <motion.span layoutId="menu-tab" transition={{ type: "spring", stiffness: 420, damping: 34 }} className="absolute inset-0 rounded-full bg-gradient-to-b from-amber-200 to-amber-400" />}
              <span className="relative">
                {label}
                <span className="ml-1.5 opacity-60">{id === "secoes" ? shared.sections.length : shared.products.length}</span>
              </span>
            </button>
          ))}
        </div>
        <Press variant="cta" className="ml-auto h-10 px-4 text-sm" onClick={() => setEditing(newProduct(filter !== "todas" ? filter : firstSection))}>
          <Plus className="h-4 w-4" /> Novo produto
        </Press>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          {tab === "secoes" ? (
            <SectionsList
              onOpenSection={(id) => {
                setFilter(id);
                setTab("produtos");
              }}
            />
          ) : (
            <ProductsList filter={filter} setFilter={setFilter} onEdit={setEditing} />
          )}
        </motion.div>
      </AnimatePresence>

      <ProductEditor product={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function SectionsList({ onOpenSection }: { onOpenSection: (id: string) => void }) {
  const { shared, saveSection, moveSection, deleteSection, toast } = useStore();
  const [editing, setEditing] = useState<Section | null>(null);
  const list = [...shared.sections].sort((a, b) => a.order - b.order);
  const visibleCount = list.filter((s) => s.active && shared.products.some((p) => p.category === s.id)).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-card bg-amber-400/[0.06] px-4 py-3 text-small text-amber-100/90 ring-1 ring-amber-400/20">
        <span className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-amber-300" /> Só as seções <b>marcadas</b> aparecem para os clientes. {visibleCount} de {list.length} visíveis agora.
        </span>
        <Press variant="glass" className="h-9 px-3 text-xs" onClick={() => setEditing({ id: `s-${uid()}`, name: "", icon: "star", active: false, order: 999 })}>
          <Plus className="h-3.5 w-3.5" /> Nova seção
        </Press>
      </div>

      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {list.map((s, i) => {
            const Icon = SECTION_ICONS[s.icon]?.Icon ?? SECTION_ICONS.star.Icon;
            const count = shared.products.filter((p) => p.category === s.id).length;
            const empty = count === 0;
            return (
              <motion.li key={s.id} layout transition={spring} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: 40 }}>
                <Spotlight className={cn("rounded-card", !s.active && "opacity-70")}>
                  <div className="relative z-[1] flex items-center gap-3 p-3 sm:p-3.5">
                    <div className="flex flex-col">
                      <button aria-label="Subir" disabled={i === 0} onClick={() => moveSection(s.id, -1)} className="grid h-6 w-6 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-white disabled:opacity-20">
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button aria-label="Descer" disabled={i === list.length - 1} onClick={() => moveSection(s.id, 1)} className="grid h-6 w-6 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-white disabled:opacity-20">
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-control ring-1", s.active ? "bg-amber-400/15 text-amber-300 ring-amber-400/30" : "bg-white/[0.05] text-zinc-500 ring-white/10")}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <button className="min-w-0 flex-1 text-left" onClick={() => onOpenSection(s.id)}>
                      <p className="truncate font-bold text-white">{s.name}</p>
                      <p className="flex items-center gap-1.5 text-2xs text-zinc-400">
                        {count} produto{count === 1 ? "" : "s"}
                        {s.active && empty && <span className="text-amber-300">• sem produtos, não aparece</span>}
                        {!s.active && (
                          <span className="inline-flex items-center gap-1">
                            • <EyeOff className="h-3 w-3" /> oculta
                          </span>
                        )}
                      </p>
                    </button>
                    <button aria-label={`Editar ${s.name}`} onClick={() => setEditing(s)} className="grid h-9 w-9 place-items-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <div className="flex flex-col items-center gap-0.5">
                      <Switch
                        label={`Mostrar ${s.name} para clientes`}
                        checked={s.active}
                        onChange={(v) => {
                          saveSection({ ...s, active: v });
                          toast({ title: v ? "Seção visível" : "Seção oculta", subtitle: s.name, icon: v ? <Eye className="h-4.5 w-4.5 text-amber-300" /> : <EyeOff className="h-4.5 w-4.5 text-zinc-300" /> });
                        }}
                      />
                      <span className="text-2xs font-semibold uppercase tracking-wider text-zinc-500">{s.active ? "Visível" : "Oculta"}</span>
                    </div>
                  </div>
                </Spotlight>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      <SectionEditor
        section={editing}
        exists={!!editing && shared.sections.some((x) => x.id === editing.id)}
        canDelete={!!editing && !shared.products.some((p) => p.category === editing.id)}
        onClose={() => setEditing(null)}
        onSave={(sec) => {
          saveSection(sec);
          toast({ title: "Seção salva", subtitle: sec.name, icon: <Check className="h-4.5 w-4.5 text-emerald-300" /> });
          setEditing(null);
        }}
        onDelete={(sec) => {
          if (deleteSection(sec.id)) toast({ title: "Seção excluída", subtitle: sec.name, icon: <Trash2 className="h-4.5 w-4.5 text-rose-300" /> });
          setEditing(null);
        }}
      />
    </div>
  );
}

function SectionEditor({
  section,
  exists,
  canDelete,
  onClose,
  onSave,
  onDelete,
}: {
  section: Section | null;
  exists: boolean;
  canDelete: boolean;
  onClose: () => void;
  onSave: (s: Section) => void;
  onDelete: (s: Section) => void;
}) {
  const [draft, setDraft] = useState<Section | null>(null);
  const d = draft && section && draft.id === section.id ? draft : section;
  const set = (p: Partial<Section>) => d && setDraft({ ...d, ...p });
  const valid = !!d && d.name.trim().length > 1;

  return (
    <Sheet open={!!section} onClose={onClose} label={exists ? "Editar seção" : "Nova seção"}>
      {d && (
        <form
          className="space-y-5 p-5 pt-4 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) onSave({ ...d, name: d.name.trim() });
          }}
        >
          <h2 className="pr-10 text-xl font-extrabold text-white">{exists ? "Editar seção" : "Nova seção"}</h2>
          <input autoFocus value={d.name} onChange={(e) => set({ name: e.target.value })} maxLength={32} placeholder="Ex.: Xis, Hambúrgueres, Torres de Batata" className="w-full rounded-control bg-white/[0.04] px-4 py-3 text-white ring-1 ring-white/10 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400/40" />
          <div className="space-y-2">
            <p className="text-2xs font-bold uppercase tracking-widest text-zinc-400">Ícone</p>
            <div className="grid grid-cols-6 gap-1.5">
              {(Object.keys(SECTION_ICONS) as SectionIcon[]).map((k) => {
                const { Icon, label } = SECTION_ICONS[k];
                return (
                  <button key={k} type="button" title={label} aria-label={label} onClick={() => set({ icon: k })} className={cn("grid aspect-square place-items-center rounded-control ring-1 transition", d.icon === k ? "bg-amber-400 text-on-brand ring-amber-300" : "bg-white/[0.04] text-zinc-300 ring-white/10 hover:bg-white/[0.08]")}>
                    <Icon className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-card bg-white/[0.03] px-4 py-3 ring-1 ring-white/10">
            <div>
              <p className="text-sm font-semibold text-white">Mostrar para os clientes</p>
              <p className="text-2xs text-zinc-400">Aparece no cardápio quando tiver produtos</p>
            </div>
            <Switch label="Mostrar para os clientes" checked={d.active} onChange={(v) => set({ active: v })} />
          </div>
          <div className="flex items-center gap-2">
            {exists && (
              <Press type="button" variant="ghost" className="h-11 px-3 text-sm text-zinc-400" disabled={!canDelete} title={canDelete ? "" : "Mova ou exclua os produtos antes"} onClick={() => onDelete(d)}>
                <Trash2 className="h-4 w-4" /> {canDelete ? "Excluir" : "Tem produtos"}
              </Press>
            )}
            <Press type="submit" variant="cta" className="ml-auto h-11 px-6 text-sm" disabled={!valid}>
              <Check className="h-4 w-4" /> Salvar seção
            </Press>
          </div>
        </form>
      )}
    </Sheet>
  );
}

function ProductsList({ filter, setFilter, onEdit }: { filter: string; setFilter: (f: string) => void; onEdit: (p: Product) => void }) {
  const { shared, saveProduct } = useStore();
  const [q, setQ] = useState("");
  const sections = [...shared.sections].sort((a, b) => a.order - b.order);
  const sectionName = (id: string) => sections.find((s) => s.id === id)?.name ?? "Sem seção";

  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return shared.products
      .filter((p) => filter === "todas" || p.category === filter)
      .filter((p) => !n || p.name.toLowerCase().includes(n))
      .sort((a, b) => (sections.findIndex((s) => s.id === a.category) - sections.findIndex((s) => s.id === b.category)) || a.name.localeCompare(b.name));
  }, [shared.products, filter, q, sections]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="glass flex flex-1 items-center gap-2 rounded-full px-4 py-2.5 focus-within:ring-2 focus-within:ring-amber-400/40">
          <Search className="h-4 w-4 text-zinc-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produto" className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none" />
        </label>
      </div>
      <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
        {[{ id: "todas", name: "Todas", active: true }, ...sections].map((s) => (
          <button key={s.id} onClick={() => setFilter(s.id)} className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition", filter === s.id ? "bg-amber-400 text-on-brand ring-amber-300" : "bg-white/[0.04] text-zinc-300 ring-white/10 hover:bg-white/[0.08]")}>
            {s.name}
            {!s.active && <EyeOff className="h-3 w-3 opacity-60" />}
          </button>
        ))}
      </div>

      <div className="grid gap-2.5 md:grid-cols-2 2xl:grid-cols-3">
        <AnimatePresence initial={false}>
          {list.map((p) => (
            <motion.div key={p.id} layout transition={spring} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <Spotlight className="group rounded-card">
                <div role="button" tabIndex={0} onClick={() => onEdit(p)} onKeyDown={(e) => e.key === "Enter" && onEdit(p)} className="relative z-[1] flex cursor-pointer items-center gap-3 p-3 outline-none">
                  <ProductArt product={p} compact={!p.image} className={cn("h-16 w-16 shrink-0 rounded-control", !p.available && "opacity-40 grayscale")} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-white">{p.name}</p>
                    <p className="truncate text-2xs text-zinc-400">
                      {sectionName(p.category)}
                      {p.featured && <span className="text-amber-300"> • Destaque</span>}
                    </p>
                    <p className="mt-0.5 text-sm font-extrabold text-amber-300">
                      {money(p.price)}
                      {p.priceGigante && <span className="ml-1.5 text-2xs font-medium text-zinc-400">Gigante {money(p.priceGigante)}</span>}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <Switch size="sm" label={`${p.name} disponível`} checked={p.available} onChange={(v) => saveProduct({ ...p, available: v })} />
                    <span className={cn("text-2xs font-semibold uppercase tracking-wider", p.available ? "text-zinc-500" : "text-rose-300")}>{p.available ? "Ativo" : "Esgotado"}</span>
                  </div>
                </div>
              </Spotlight>
            </motion.div>
          ))}
        </AnimatePresence>
        {list.length === 0 && <p className="glass col-span-full rounded-card py-12 text-center text-sm text-zinc-400">Nenhum produto aqui ainda. Clique em “Novo produto”.</p>}
      </div>
    </div>
  );
}

export function MenuSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-11 w-56 rounded-full" />
        <Skeleton className="h-10 w-36 rounded-control" />
      </div>
      <Skeleton className="h-12 w-full rounded-card" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass flex items-center gap-3 rounded-card p-3.5">
          <Skeleton className="h-11 w-11 rounded-control" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-7 w-12 rounded-full" />
        </div>
      ))}
    </div>
  );
}
