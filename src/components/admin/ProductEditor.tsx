"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ImagePlus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BadgeChip } from "@/components/client/Badges";
import { DishArt } from "@/components/client/DishArt";
import { ProductArt } from "@/components/client/ProductArt";
import { Press } from "@/components/ui/Press";
import { Sheet } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { SECTION_ICONS } from "@/components/ui/sectionIcons";
import { TINTS } from "@/lib/data";
import { cn, money, uid } from "@/lib/format";
import { resizeImage } from "@/lib/image";
import { useStore } from "@/lib/store";
import type { Badge, DishArtSpec, IngredientId, Product, Recipe, TintKey, Topping } from "@/lib/types";

const BADGES: Badge[] = ["Mais Pedido", "Novo", "Serve 2 pessoas", "Especial da Casa"];

const SAUCES = [
  { label: "Cheddar", color: "#F59E0B" },
  { label: "Catupiry", color: "#F4E6C8" },
  { label: "Strogonoff", color: "#C98A54" },
  { label: "4 Queijos", color: "#FBE7A1" },
  { label: "Barbecue", color: "#7C2D12" },
];

const TOPPINGS: { id: Topping; label: string }[] = [
  { id: "carne", label: "Carne" },
  { id: "frango", label: "Frango" },
  { id: "bacon", label: "Bacon" },
  { id: "queijo", label: "Queijo" },
  { id: "palha", label: "Batata palha" },
  { id: "ervas", label: "Cheiro-verde" },
];

const ART_PRESETS: { key: string; label: string; spec: DishArtSpec }[] = [
  { key: "batatao", label: "Batatão", spec: { kind: "batatao", sauce: "#F59E0B", toppings: ["bacon", "ervas"] } },
  { key: "porcao", label: "Porção", spec: { kind: "porcao", toppings: [] } },
  { key: "torre", label: "Torre", spec: { kind: "torre", sauce: "#F59E0B", toppings: ["bacon"] } },
  { key: "xis", label: "Xis", spec: { kind: "lanche", style: "xis", cheese: true, egg: true } },
  { key: "burger", label: "Hambúrguer", spec: { kind: "lanche", style: "burger", cheese: true } },
  { key: "lata", label: "Lata", spec: { kind: "lata", color: "#DC2626", label: "COLA" } },
  { key: "garrafa", label: "Garrafa", spec: { kind: "garrafa", color: "#15803D", liquid: "#7A2E0E", label: "REFRI" } },
  { key: "pote", label: "Molho", spec: { kind: "pote" } },
];

const presetKey = (a: DishArtSpec) => (a.kind === "lanche" ? (a.style === "xis" ? "xis" : "burger") : a.kind);

const BEV_COLORS = ["#DC2626", "#15803D", "#0EA5E9", "#F59E0B", "#7C3AED", "#111827"];

export function newProduct(category: string): Product {
  return {
    id: `p-${uid()}`,
    name: "",
    description: "",
    category,
    price: 0,
    badges: [],
    tags: [],
    art: ART_PRESETS[0].spec,
    tint: "gold",
    available: true,
    allowsExtras: true,
    recipe: { embalagem: 1 },
  };
}

const scaleRecipe = (r: Recipe, k: number): Recipe =>
  Object.fromEntries(Object.entries(r).map(([id, v]) => [id, id === "embalagem" ? v : Math.round((v ?? 0) * k * 100) / 100]));

export function ProductEditor({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const { shared, saveProduct, deleteProduct, toast } = useStore();
  const [d, setD] = useState<Product | null>(product);
  const [confirmDel, setConfirmDel] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const isNew = !!product && !shared.products.some((p) => p.id === product.id);

  useEffect(() => {
    setD(product);
    setConfirmDel(false);
    setErrors({});
  }, [product]);

  const set = (patch: Partial<Product>) => setD((x) => (x ? { ...x, ...patch } : x));
  const setArt = (patch: Partial<DishArtSpec>) => setD((x) => (x ? { ...x, art: { ...x.art, ...patch } as DishArtSpec } : x));

  const save = () => {
    if (!d) return;
    const e: Record<string, string> = {};
    if (d.name.trim().length < 2) e.name = "Dê um nome ao produto";
    if (!(d.price > 0)) e.price = "Informe o preço";
    if (d.priceGigante !== undefined && !(d.priceGigante > d.price)) e.gigante = "O Gigante deve custar mais que a Média";
    if (!shared.sections.some((s) => s.id === d.category)) e.category = "Escolha uma seção";
    setErrors(e);
    if (Object.keys(e).length) return;
    const final: Product = {
      ...d,
      name: d.name.trim(),
      description: d.description.trim(),
      recipeGigante: d.priceGigante ? scaleRecipe(d.recipe, 1.6) : undefined,
    };
    saveProduct(final);
    toast({ title: isNew ? "Produto criado" : "Produto atualizado", subtitle: final.name, icon: <Check className="h-4.5 w-4.5 text-emerald-300" /> });
    onClose();
  };

  const remove = () => {
    if (!d) return;
    if (!confirmDel) return setConfirmDel(true);
    deleteProduct(d.id);
    toast({ title: "Produto excluído", subtitle: d.name, icon: <Trash2 className="h-4.5 w-4.5 text-rose-300" /> });
    onClose();
  };

  const onPhoto = async (f?: File) => {
    if (!f) return;
    try {
      set({ image: await resizeImage(f) });
    } catch {
      toast({ title: "Não foi possível ler a imagem", subtitle: "Use JPG ou PNG", icon: <X className="h-4.5 w-4.5 text-rose-300" /> });
    }
  };

  const input = (k?: string) =>
    cn(
      "w-full rounded-control bg-white/[0.04] px-4 py-3 text-white ring-1 placeholder:text-zinc-500 focus:outline-none focus:ring-2",
      k && errors[k] ? "ring-rose-500/60" : "ring-white/10 focus:ring-amber-400/40",
    );

  const sections = [...shared.sections].sort((a, b) => a.order - b.order);

  return (
    <Sheet open={!!product} onClose={onClose} label={isNew ? "Novo produto" : "Editar produto"} wide>
      {d && (
        <>
          <div className="thin-scroll flex-1 overflow-y-auto">
            <div className="grid gap-6 p-5 pt-4 sm:p-6 md:grid-cols-[300px_1fr]">
              {/* Prévia + aparência */}
              <aside className="space-y-4 md:sticky md:top-0 md:self-start">
                <h2 className="pr-10 text-xl font-extrabold tracking-tight text-white">{isNew ? "Novo produto" : "Editar produto"}</h2>
                <div className="glass overflow-hidden rounded-card p-3">
                  <ProductArt product={d} className="h-44 w-full rounded-control" big />
                  <div className="px-1 pb-1 pt-3">
                    {d.badges.length > 0 && (
                      <div className="mb-1.5 flex flex-wrap gap-1">
                        {d.badges.map((b) => (
                          <BadgeChip key={b} badge={b} />
                        ))}
                      </div>
                    )}
                    <p className="font-bold text-white">{d.name || "Nome do produto"}</p>
                    <p className="mt-0.5 line-clamp-2 text-small text-zinc-400">{d.description || "Descrição apetitosa aparece aqui."}</p>
                    <p className="mt-2 text-lg font-extrabold text-amber-300">{money(d.price || 0)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Foto (opcional)</Label>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
                  <div className="flex gap-2">
                    <Press type="button" variant="glass" className="h-10 flex-1 text-sm" onClick={() => fileRef.current?.click()}>
                      <ImagePlus className="h-4 w-4" /> {d.image ? "Trocar foto" : "Enviar foto"}
                    </Press>
                    {d.image && (
                      <Press type="button" variant="ghost" className="h-10 px-3 text-sm" onClick={() => set({ image: undefined })}>
                        Usar ilustração
                      </Press>
                    )}
                  </div>
                </div>

                {!d.image && (
                  <>
                    <div className="space-y-2">
                      <Label>Ilustração</Label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {ART_PRESETS.map((a) => {
                          const on = presetKey(d.art) === a.key;
                          return (
                            <button
                              key={a.key}
                              type="button"
                              onClick={() => set({ art: a.spec })}
                              className={cn("flex flex-col items-center gap-0.5 rounded-control p-1.5 ring-1 transition", on ? "bg-amber-400/10 ring-amber-400/50" : "bg-white/[0.03] ring-white/10 hover:bg-white/[0.06]")}
                            >
                              <DishArt spec={a.spec} steam={false} className="h-10 w-10" />
                              <span className="text-2xs text-zinc-300">{a.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <ArtOptions art={d.art} setArt={setArt} />
                    <div className="space-y-2">
                      <Label>Fundo</Label>
                      <div className="flex gap-2">
                        {(Object.keys(TINTS) as TintKey[]).map((t) => (
                          <button key={t} type="button" title={TINTS[t].label} aria-label={TINTS[t].label} onClick={() => set({ tint: t })} className={cn("h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-surface transition", d.tint === t ? "ring-amber-300" : "ring-transparent")} style={{ background: TINTS[t].swatch }} />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </aside>

              {/* Dados */}
              <div className="space-y-5">
                <Field label="Nome" error={errors.name}>
                  <input className={input("name")} value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ex.: Xis Coração" maxLength={60} />
                </Field>
                <Field label="Descrição">
                  <textarea className={cn(input(), "resize-none")} rows={3} value={d.description} onChange={(e) => set({ description: e.target.value })} placeholder="Ingredientes e o que torna esse prato especial" maxLength={220} />
                </Field>

                <Field label="Seção do cardápio" error={errors.category}>
                  <div className="flex flex-wrap gap-1.5">
                    {sections.map((s) => {
                      const Icon = SECTION_ICONS[s.icon]?.Icon ?? SECTION_ICONS.star.Icon;
                      const on = d.category === s.id;
                      return (
                        <button key={s.id} type="button" onClick={() => set({ category: s.id })} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold ring-1 transition", on ? "bg-amber-400 text-on-brand ring-amber-300" : "bg-white/[0.04] text-zinc-300 ring-white/10 hover:bg-white/[0.08]")}>
                          <Icon className="h-3.5 w-3.5" /> {s.name}
                          {!s.active && <span className={cn("text-2xs font-medium", on ? "text-on-brand/70" : "text-zinc-500")}>(oculta)</span>}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={d.priceGigante !== undefined ? "Preço Média (500g)" : "Preço"} error={errors.price}>
                    <MoneyInput className={input("price")} value={d.price} onChange={(v) => set({ price: v })} />
                  </Field>
                  <Field label="Tamanho Gigante (800g)" error={errors.gigante}>
                    <div className="flex items-center gap-3">
                      <Switch label="Oferecer tamanho Gigante" checked={d.priceGigante !== undefined} onChange={(v) => set({ priceGigante: v ? Math.round(d.price * 1.4) || 0 : undefined })} />
                      <AnimatePresence initial={false}>
                        {d.priceGigante !== undefined && (
                          <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="min-w-0 flex-1 overflow-hidden">
                            <MoneyInput className={input("gigante")} value={d.priceGigante} onChange={(v) => set({ priceGigante: v })} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </Field>
                </div>

                <Field label="Selos">
                  <div className="flex flex-wrap gap-1.5">
                    {BADGES.map((b) => {
                      const on = d.badges.includes(b);
                      return (
                        <button key={b} type="button" onClick={() => set({ badges: on ? d.badges.filter((x) => x !== b) : [...d.badges, b] })} className={cn("rounded-full ring-2 transition", on ? "ring-amber-300/70" : "opacity-50 ring-transparent hover:opacity-80")}>
                          <BadgeChip badge={b} className="px-2.5 py-1 text-xs" />
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <div className="divide-y divide-white/[0.06] rounded-card bg-white/[0.03] ring-1 ring-white/10">
                  <Toggle title="Disponível para venda" sub="Desligado, aparece como Esgotado" checked={d.available} onChange={(v) => set({ available: v })} />
                  <Toggle title="Destaque em “Mais Pedidos”" sub="Mostra no carrossel do topo" checked={!!d.featured} onChange={(v) => set({ featured: v })} />
                  <Toggle title="Permitir adicionais" sub="Bacon, cheddar, catupiry, palha, mussarela" checked={d.allowsExtras} onChange={(v) => set({ allowsExtras: v })} />
                </div>

                <Field label="Ficha técnica — baixa automática no estoque (por unidade)">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {shared.stock.map((ing) => (
                      <label key={ing.id} className="flex items-center gap-2 rounded-control bg-white/[0.03] px-3 py-2 ring-1 ring-white/10">
                        <span className="min-w-0 flex-1 truncate text-small text-zinc-300">{ing.name}</span>
                        <input
                          type="number"
                          min={0}
                          step={ing.unit === "kg" ? 0.01 : 1}
                          inputMode="decimal"
                          value={d.recipe[ing.id] ?? ""}
                          placeholder="0"
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            const recipe = { ...d.recipe };
                            if (!v) delete recipe[ing.id as IngredientId];
                            else recipe[ing.id as IngredientId] = v;
                            set({ recipe });
                          }}
                          className="w-16 rounded-lg bg-black/30 px-2 py-1 text-right text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-amber-400/40"
                        />
                        <span className="w-6 text-2xs text-zinc-400">{ing.unit}</span>
                      </label>
                    ))}
                  </div>
                  {d.priceGigante !== undefined && <p className="mt-2 text-2xs text-zinc-400">No tamanho Gigante a baixa é 1,6× (embalagem continua 1).</p>}
                </Field>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 border-t border-white/10 bg-black/20 p-4 sm:px-6">
            {!isNew && (
              <Press type="button" variant="ghost" className={cn("h-11 px-4 text-sm", confirmDel ? "bg-rose-500/15 text-rose-300" : "text-zinc-400")} onClick={remove}>
                <Trash2 className="h-4 w-4" /> {confirmDel ? "Confirmar exclusão" : "Excluir"}
              </Press>
            )}
            <Press type="button" variant="ghost" className="ml-auto h-11 px-4 text-sm" onClick={onClose}>
              Cancelar
            </Press>
            <Press type="button" variant="cta" className="h-11 px-6 text-sm" onClick={save}>
              <Check className="h-4 w-4" /> {isNew ? "Criar produto" : "Salvar"}
            </Press>
          </div>
        </>
      )}
    </Sheet>
  );
}

function ArtOptions({ art, setArt }: { art: DishArtSpec; setArt: (p: Partial<DishArtSpec>) => void }) {
  if (art.kind === "batatao" || art.kind === "porcao" || art.kind === "torre") {
    const toppings = art.toppings;
    return (
      <>
        <div className="space-y-2">
          <Label>Molho</Label>
          <div className="flex flex-wrap gap-1.5">
            {art.kind !== "batatao" && <Chip on={!art.sauce} onClick={() => setArt({ sauce: undefined })}>Sem molho</Chip>}
            {SAUCES.map((s) => (
              <Chip key={s.color} on={art.sauce === s.color} onClick={() => setArt({ sauce: s.color })}>
                <span className="h-3 w-3 rounded-full ring-1 ring-black/20" style={{ background: s.color }} /> {s.label}
              </Chip>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Coberturas</Label>
          <div className="flex flex-wrap gap-1.5">
            {TOPPINGS.map((t) => {
              const on = toppings.includes(t.id);
              return (
                <Chip key={t.id} on={on} onClick={() => setArt({ toppings: on ? toppings.filter((x) => x !== t.id) : [...toppings, t.id] })}>
                  {t.label}
                </Chip>
              );
            })}
          </div>
        </div>
      </>
    );
  }
  if (art.kind === "lanche") {
    return (
      <div className="space-y-2">
        <Label>Recheio</Label>
        <div className="flex flex-wrap gap-1.5">
          <Chip on={!!art.cheese} onClick={() => setArt({ cheese: !art.cheese })}>Queijo</Chip>
          <Chip on={!!art.bacon} onClick={() => setArt({ bacon: !art.bacon })}>Bacon</Chip>
          {art.style === "xis" && <Chip on={!!art.egg} onClick={() => setArt({ egg: !art.egg })}>Ovo</Chip>}
        </div>
      </div>
    );
  }
  if (art.kind === "lata" || art.kind === "garrafa") {
    return (
      <div className="space-y-2">
        <Label>Rótulo</Label>
        <div className="flex items-center gap-2">
          {BEV_COLORS.map((c) => (
            <button key={c} type="button" aria-label={`Cor ${c}`} onClick={() => setArt({ color: c })} className={cn("h-7 w-7 rounded-full ring-2 ring-offset-2 ring-offset-surface", art.color === c ? "ring-amber-300" : "ring-transparent")} style={{ background: c }} />
          ))}
        </div>
        <input value={art.label} maxLength={9} onChange={(e) => setArt({ label: e.target.value.toUpperCase() })} className="w-full rounded-control bg-white/[0.04] px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-amber-400/40" placeholder="Texto do rótulo" />
      </div>
    );
  }
  return null;
}

function MoneyInput({ value, onChange, className }: { value?: number; onChange: (v: number) => void; className: string }) {
  const [txt, setTxt] = useState(value ? value.toFixed(2).replace(".", ",") : "");
  return (
    <div className={cn(className, "flex items-center gap-2")}>
      <span className="text-zinc-400">R$</span>
      <input
        inputMode="decimal"
        value={txt}
        placeholder="0,00"
        onChange={(e) => {
          const t = e.target.value.replace(/[^\d,.]/g, "");
          setTxt(t);
          onChange(Number(t.replace(/\./g, "").replace(",", ".")) || 0);
        }}
        className="min-w-0 flex-1 bg-transparent focus:outline-none"
      />
    </div>
  );
}

function Toggle({ title, sub, checked, onChange }: { title: string; sub: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-zinc-100">{title}</p>
        <p className="text-2xs text-zinc-400">{sub}</p>
      </div>
      <Switch label={title} checked={checked} onChange={onChange} />
    </div>
  );
}

const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button type="button" onClick={onClick} className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium ring-1 transition", on ? "bg-amber-400/15 text-amber-200 ring-amber-400/50" : "bg-white/[0.04] text-zinc-400 ring-white/10 hover:text-zinc-200")}>
    {children}
  </button>
);

const Label = ({ children }: { children: React.ReactNode }) => <p className="text-2xs font-bold uppercase tracking-widest text-zinc-400">{children}</p>;

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error && <p className="px-1 text-xs font-medium text-rose-400">{error}</p>}
    </div>
  );
}
