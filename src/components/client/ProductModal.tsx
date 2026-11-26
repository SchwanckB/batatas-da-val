"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Press, spring } from "@/components/ui/Press";
import { Sheet } from "@/components/ui/Sheet";
import { SIZES, unitPriceFor } from "@/lib/data";
import { cn, money } from "@/lib/format";
import type { Extra, Product, SizeId } from "@/lib/types";
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
  extrasList: Extra[];
  onClose: () => void;
  onAdd: (p: Product, c: Customization, from: HTMLElement) => void;
}

export function ProductModal({ product, extrasList, onClose, onAdd }: Props) {
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
  const unit = p ? unitPriceFor(p, hasSizes ? size : undefined, extras, extrasList) : 0;

  return (
    <Sheet open={!!p} onClose={onClose} label={p?.name ?? "Produto"}>
      {p && (
        <>
          <div className="thin-scroll flex-1 overflow-y-auto">
            <ProductArt product={p} className="h-48 w-full border-0 border-b sm:h-56" big />
            <div className="space-y-7 p-5 sm:p-6">
              <div>
                {p.badges.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {p.badges.map((b) => (
                      <BadgeChip key={b} badge={b} />
                    ))}
                  </div>
                )}
                <h2 className="font-bold pr-8 text-2xl text-white">{p.name}</h2>
                <p className="mt-2.5 text-sm leading-relaxed text-zinc-300">{p.description}</p>
              </div>

              {hasSizes && (
                <section>
                  <h3 className="mb-2.5 text-sm font-bold text-white">Qual tamanho?</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {SIZES.map((s) => {
                      const active = s.id === size;
                      const price = s.id === "gigante" ? p.priceGigante! : p.price;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSize(s.id)}
                          aria-pressed={active}
                          className={cn(
                            "rounded-control border px-3.5 py-3 text-left transition-colors",
                            active ? "border-amber-400/60 bg-amber-400/10" : "border-line hover:border-amber-400/35",
                          )}
                        >
                          <span className="block text-sm font-bold text-white">{s.label}</span>
                          <span className="mt-0.5 block text-xs tnum text-zinc-400">
                            {s.weight}
                            {", "}
                            <span className={active ? "font-semibold text-amber-300" : ""}>{money(price)}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {p.allowsExtras && extrasList.length > 0 && (
                <section>
                  <h3 className="mb-2.5 text-sm font-bold text-white">Quer acrescentar algo?</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {extrasList.map((e) => {
                      const on = extras.includes(e.id);
                      return (
                        <motion.button
                          key={e.id}
                          whileTap={{ scale: 0.96 }}
                          transition={spring}
                          onClick={() => setExtras((x) => (on ? x.filter((i) => i !== e.id) : [...x, e.id]))}
                          aria-pressed={on}
                          className={cn(
                            "flex items-center gap-3 rounded-control border px-3.5 py-3 text-left transition-colors duration-200",
                            on ? "border-amber-400/60 bg-amber-400/10" : "border-line hover:border-amber-400/35",
                          )}
                        >
                          <span
                            className={cn(
                              "grid h-6 w-6 shrink-0 place-items-center rounded border transition-colors",
                              on ? "border-amber-300 bg-gold" : "border-zinc-600",
                            )}
                          >
                            <AnimatePresence>
                              {on && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                  transition={{ type: "spring", stiffness: 600, damping: 20 }}
                                >
                                  <Check className="h-4 w-4 text-on-brand" strokeWidth={3} aria-hidden />
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </span>
                          <span className="flex-1 text-sm font-medium text-zinc-100">{e.name}</span>
                          <span className="text-xs font-semibold tnum text-amber-300">+{money(e.price)}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </section>
              )}

              <section>
                <label htmlFor="obs-produto" className="mb-2 block text-sm font-bold text-white">
                  Alguma observação para a cozinha?
                </label>
                <textarea
                  id="obs-produto"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  maxLength={140}
                  placeholder="Sem cebola, caprichar no molho, pouca pimenta…"
                  className="w-full resize-none rounded-control border border-line bg-ink px-4 py-3 text-white placeholder:text-zinc-500 focus:border-amber-400/60 focus:outline-none"
                />
              </section>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 border-t border-line bg-ink p-4 sm:p-5">
            <QtyStepper value={qty} onChange={setQty} />
            <Press
              variant="cta"
              className="h-12 flex-1 px-4 text-base"
              onClick={(e) =>
                onAdd(p, { size: hasSizes ? size : undefined, extras, notes: notes.trim(), qty }, e.currentTarget)
              }
            >
              <span className="truncate">Colocar na sacola</span>
              <AnimatedPrice value={unit * qty} />
            </Press>
          </div>
        </>
      )}
    </Sheet>
  );
}
