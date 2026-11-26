"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, SearchX, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SIZES } from "@/lib/data";
import { cn, money, norm } from "@/lib/format";
import type { Extra, Product, PublicState } from "@/lib/types";
import { MenuNav } from "./MenuNav";
import { MenuRow } from "./MenuRow";

interface Props {
  menu: PublicState;
  minOrder: number;
  onOpen: (p: Product) => void;
  onQuickAdd: (p: Product, el: HTMLElement) => void;
}

/** Esgotados caem para o fim da seção, sem sumir do cardápio. */
const byAvailability = (a: Product, b: Product) => Number(b.available) - Number(a.available);

/**
 * A faixa de papel com o cardápio inteiro: todas as seções na página, atalho
 * para cada uma no topo, preço por tamanho, adicionais e as observações da casa.
 */
export function MenuBoard({ menu, minOrder, onOpen, onQuickAdd }: Props) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("");
  const navRef = useRef<HTMLDivElement>(null);

  const sections = menu.sections;

  const bySection = useMemo(() => {
    const q = norm(query.trim());
    return sections
      .map((s) => ({
        section: s,
        products: menu.products
          .filter((p) => p.category === s.id)
          .filter((p) => !q || norm([p.name, p.description, ...p.tags].join(" ")).includes(q))
          .sort(byAvailability),
      }))
      .filter((g) => g.products.length > 0);
  }, [sections, menu.products, query]);

  const found = bySection.reduce((n, g) => n + g.products.length, 0);

  /** Distância que o conteúdo precisa descer para não ficar atrás das barras fixas. */
  const stickyOffset = useCallback(() => {
    const header = document.querySelector("header")?.offsetHeight ?? 0;
    return header + (navRef.current?.offsetHeight ?? 0) + 8;
  }, []);

  const goToSection = useCallback(
    (id: string) => {
      const el = document.getElementById(`secao-${id}`);
      if (!el) return;
      setActive(id);
      window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - stickyOffset(), behavior: "smooth" });
    },
    [stickyOffset],
  );

  // Marca no topo a seção que está passando pela tela.
  useEffect(() => {
    if (query) return;
    const ids = bySection.map((g) => g.section.id);
    if (!ids.length) return;

    const onScroll = () => {
      const limit = stickyOffset() + 24;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(`secao-${id}`);
        if (el && el.getBoundingClientRect().top <= limit) current = id;
      }
      setActive(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [bySection, query, stickyOffset]);

  const extras = menu.extras;

  return (
    <section id="cardapio" className="papel mt-12 border-t-4 border-gold sm:mt-16">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="letreiro text-3xl text-paper-ink sm:text-4xl">Cardápio</h2>
            <p className="mt-1 text-small text-zinc-600">
              {menu.products.length} itens em {sections.length}{" "}
              {sections.length === 1 ? "seção" : "seções"}, tudo feito na hora.
            </p>
          </div>
          <label className="flex min-w-60 flex-1 items-center gap-2.5 rounded-control border border-paper-ink/20 bg-paper-2 px-4 py-2.5 focus-within:border-paper-ink/50 sm:max-w-sm">
            <Search className="h-4.5 w-4.5 shrink-0 text-zinc-600" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome ou ingrediente"
              aria-label="Buscar no cardápio"
              className="min-w-0 flex-1 bg-transparent text-paper-ink placeholder:text-zinc-500 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Limpar busca"
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-paper-ink/10 text-zinc-600"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
          </label>
        </div>

        {query ? (
          <p className="mt-5 border-b border-paper-ink/15 pb-3 text-sm text-zinc-600">
            {found} {found === 1 ? "resultado" : "resultados"} para{" "}
            <b className="text-paper-ink">“{query}”</b>
          </p>
        ) : (
          sections.length > 0 && (
            <div
              ref={navRef}
              className="sticky top-25 z-30 -mx-4 mt-5 bg-paper px-4 sm:-mx-6 sm:px-6 md:top-17"
            >
              <MenuNav
                sections={sections}
                active={active}
                counts={Object.fromEntries(bySection.map((g) => [g.section.id, g.products.length]))}
                onPick={goToSection}
              />
            </div>
          )
        )}

        {found === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex flex-col items-center gap-2 rounded-card border border-dashed border-paper-ink/25 py-14 text-center"
          >
            <SearchX className="h-7 w-7 text-zinc-500" aria-hidden />
            <p className="font-bold text-paper-ink">Não encontramos esse item</p>
            <p className="text-sm text-zinc-600">Tente “frango”, “bacon” ou “cheddar”.</p>
          </motion.div>
        ) : (
          <AnimatePresence initial={false} mode="popLayout">
            {bySection.map((g) => (
              <motion.div
                key={g.section.id}
                id={`secao-${g.section.id}`}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="scroll-mt-40 pt-8 first:pt-6"
              >
                <div className="flex items-baseline justify-between gap-4 border-b-2 border-paper-ink/20 pb-2">
                  <h3 className="letreiro text-2xl text-paper-ink">{g.section.name}</h3>
                  <span className="shrink-0 text-small tnum text-zinc-600">
                    {g.products.length} {g.products.length === 1 ? "opção" : "opções"}
                  </span>
                </div>
                <ul className="lg:grid lg:grid-cols-2 lg:gap-x-10">
                  {g.products.map((p) => (
                    <MenuRow key={p.id} product={p} onOpen={onOpen} onQuickAdd={onQuickAdd} />
                  ))}
                </ul>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {!query && extras.length > 0 && <ExtrasBlock extras={extras} />}
        {!query && <HouseNotes minOrder={minOrder} hasGiant={menu.products.some((p) => p.priceGigante)} />}
      </div>
    </section>
  );
}

/** Os adicionais ficam no fim do cardápio, como na folha impressa. */
function ExtrasBlock({ extras }: { extras: Extra[] }) {
  return (
    <div className="pt-10">
      <div className="flex items-baseline justify-between gap-4 border-b-2 border-paper-ink/20 pb-2">
        <h3 className="letreiro text-2xl text-paper-ink">Adicionais</h3>
        <span className="shrink-0 text-small text-zinc-600">Escolha ao montar o pedido</span>
      </div>
      <ul className="mt-1 lg:grid lg:grid-cols-2 lg:gap-x-10">
        {extras.map((e) => (
          <li key={e.id} className="flex items-baseline border-b border-paper-ink/10 py-2.5 text-sm">
            <span className="font-medium text-paper-ink">{e.name}</span>
            <span className="guia" aria-hidden />
            <span className="font-bold tnum text-paper-ink">+{money(e.price)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** As combinações da casa, do jeito que ficariam no rodapé de um cardápio. */
function HouseNotes({ minOrder, hasGiant }: { minOrder: number; hasGiant: boolean }) {
  const notes = [
    hasGiant &&
      `${SIZES[0].short} de ${SIZES[0].weight} serve uma pessoa. ${SIZES[1].short} de ${SIZES[1].weight} serve duas.`,
    "Todo batatão é montado na hora, depois que o pedido entra.",
    "Dá para pedir sem um ingrediente: escreva na observação do item.",
    minOrder > 0 && `Pedido mínimo de ${money(minOrder)}, sem contar a entrega.`,
  ].filter(Boolean) as string[];

  return (
    <div className="mt-10 rounded-card border border-paper-ink/15 bg-paper-2 p-4 sm:p-5">
      <h3 className={cn("text-sm font-bold text-paper-ink")}>Como funciona</h3>
      <ul className="mt-2 space-y-1.5">
        {notes.map((n) => (
          <li key={n} className="flex gap-2 text-small leading-relaxed text-zinc-600">
            <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-paper-ink/40" />
            {n}
          </li>
        ))}
      </ul>
    </div>
  );
}
