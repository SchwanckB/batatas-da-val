"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, MessageSquareText } from "lucide-react";
import { useEffect, useState } from "react";
import { Press, spring } from "@/components/ui/Press";
import { Sheet } from "@/components/ui/Sheet";
import { EXTRAS, SIZES, unitPriceFor } from "@/lib/data";
import { cn, money } from "@/lib/format";
import type { Product, SizeId } from "@/lib/types";
import { AnimatedPrice } from "./AnimatedPrice";
import { BadgeChip } from "./Badges";
import { ProductArt } from "./ProductArt";
import { QtyStepper } from "./QtyStepper";

export interface Customization {
  size?: SizeId;
  extras: string[];
  notes: string;
  qty: number;
}

interface Props {
  product: Product | null;
  onClose: () => void;
  onAdd: (p: Product, c: Customization, from: HTMLElement) => void;
}

export function ProductModal({ product, onClose, onAdd }: Props) {
  const [size, setSize] = useState<SizeId>("media");
  const [extras, setExtras] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (product) {
      setSize("media");
      setExtras([]);
      setNotes("");
      setQty(1);
    }
  }, [product]);

  const p = product;
  const hasSizes = !!p?.priceGigante;
  const unit = p ? unitPriceFor(p, hasSizes ? size : undefined, extras) : 0;

  return (
    <Sheet open={!!p} onClose={onClose} label={p?.name ?? "Produto"}>
      {p && (
        <>
          <div className="thin-scroll flex-1 overflow-y-auto">
            <ProductArt product={p} className="h-48 w-full sm:h-56" big />
            <div className="space-y-6 p-5 sm:p-6">
              <div>
                {p.badges.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {p.badges.map((b) => (
                      <BadgeChip key={b} badge={b} />
                    ))}
                  </div>
                )}
                <h2 className="pr-8 text-2xl font-extrabold leading-tight tracking-tight text-white">{p.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{p.description}</p>
              </div>

              {hasSizes && (
                <section>
                  <h3 className="mb-2.5 text-xs font-bold uppercase tracking-widest text-zinc-400">Escolha o tamanho</h3>
                  <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/[0.04] p-1.5 ring-1 ring-white/10">
                    {SIZES.map((s) => {
                      const active = s.id === size;
                      const price = s.id === "gigante" ? p.priceGigante! : p.price;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSize(s.id)}
                          className="relative rounded-xl px-3 py-3 text-left"
                        >
                          {active && (
                            <motion.span
                              layoutId="size-pill"
                              transition={{ type: "spring", stiffness: 420, damping: 34 }}
                              className="absolute inset-0 rounded-xl bg-gradient-to-b from-amber-300/25 to-amber-500/10 ring-1 ring-amber-400/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                            />
                          )}
                          <span className="relative block text-sm font-bold text-white">{s.label}</span>
                          <span className="relative block text-xs text-zinc-400">
                            {s.weight} • <span className={active ? "text-amber-300" : ""}>{money(price)}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {p.allowsExtras && (
                <section>
                  <h3 className="mb-2.5 text-xs font-bold uppercase tracking-widest text-zinc-400">Turbine seu pedido</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {EXTRAS.map((e) => {
                      const on = extras.includes(e.id);
                      return (
                        <motion.button
                          key={e.id}
                          whileTap={{ scale: 0.96 }}
                          transition={spring}
                          onClick={() => setExtras((x) => (on ? x.filter((i) => i !== e.id) : [...x, e.id]))}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left ring-1 transition-colors duration-200",
                            on ? "bg-amber-400/10 ring-amber-400/50" : "bg-white/[0.04] ring-white/10 hover:bg-white/[0.07]",
                          )}
                        >
                          <span
                            className={cn(
                              "grid h-6 w-6 shrink-0 place-items-center rounded-lg ring-1 transition-colors",
                              on ? "bg-amber-400 ring-amber-300" : "ring-white/20",
                            )}
                          >
                            <AnimatePresence>
                              {on && (
                                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 600, damping: 20 }}>
                                  <Check className="h-4 w-4 text-on-brand" strokeWidth={3} />
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </span>
                          <span className="flex-1 text-sm font-medium text-zinc-100">{e.name}</span>
                          <span className="text-xs font-semibold text-amber-300">+ {money(e.price)}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </section>
              )}

              <section>
                <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-400">
                  <MessageSquareText className="h-3.5 w-3.5" /> Observações
                </h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  maxLength={140}
                  placeholder="Ex.: Sem cebola, caprichar no molho"
                  className="w-full resize-none rounded-2xl bg-white/[0.04] px-4 py-3 text-white ring-1 ring-white/10 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                />
              </section>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 border-t border-white/10 bg-black/20 p-4 sm:p-5">
            <QtyStepper value={qty} onChange={setQty} />
            <Press
              variant="cta"
              className="h-12 flex-1 px-4 text-base"
              onClick={(e) => onAdd(p, { size: hasSizes ? size : undefined, extras, notes: notes.trim(), qty }, e.currentTarget)}
            >
              <span className="truncate">Adicionar</span>
              <span className="opacity-60">•</span>
              <AnimatedPrice value={unit * qty} />
            </Press>
          </div>
        </>
      )}
    </Sheet>
  );
}
