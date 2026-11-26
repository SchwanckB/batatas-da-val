"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bike, ChefHat, ChevronRight, ClipboardCheck, MapPin, PartyPopper, SearchX, ShoppingBag } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DishArt } from "./DishArt";
import { Logo } from "@/components/ui/Logo";
import { InstagramIcon } from "@/components/ui/InstagramIcon";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { spring } from "@/components/ui/Press";
import { neighborhoodById, unitPriceFor } from "@/lib/data";
import { money, STORE, uid } from "@/lib/format";
import { useMinDelay, useStore, visibleSections } from "@/lib/store";
import type { CategoryId, OrderStatus, Product } from "@/lib/types";
import { CartDrawer, type CartView } from "./CartDrawer";
import { CategoryTabs } from "./CategoryTabs";
import { Featured } from "./Featured";
import { FlyLayer, type Flight } from "./FlyLayer";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { NeighborhoodList } from "./NeighborhoodPicker";
import { ProductCard, ProductCardSkeleton } from "./ProductCard";
import { ProductModal, type Customization } from "./ProductModal";
import { trackerSteps } from "./OrderTracker";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

type ToastData = { title: string; subtitle: string; icon: ReactNode };

const ic = "h-4.5 w-4.5 text-amber-300";
const STATUS_MSG: Record<OrderStatus, { title: string; icon: ReactNode }> = {
  novo: { title: "Pedido recebido", icon: <ClipboardCheck className={ic} /> },
  preparo: { title: "Seu pedido está na cozinha!", icon: <ChefHat className={ic} /> },
  entrega: { title: "Saiu para entrega!", icon: <Bike className={ic} /> },
  concluido: { title: "Pedido entregue. Bom apetite!", icon: <PartyPopper className={ic} /> },
};

export function ClientApp() {
  const { hydrated, client, shared, addToCart, bumpCart, toast, setNeighborhood } = useStore();
  const [picked, setPicked] = useState<CategoryId | null>(null);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartView, setCartView] = useState<CartView>("cart");
  const [nbOpen, setNbOpen] = useState(false);
  const [flights, setFlights] = useState<Flight[]>([]);
  const pendingToasts = useRef(new Map<string, ToastData>());

  // Só seções marcadas no painel (e com produtos) aparecem para o cliente
  const sections = useMemo(() => visibleSections(shared), [shared]);
  const catalog = useMemo(() => {
    const ids = new Set(sections.map((s) => s.id));
    return shared.products.filter((p) => ids.has(p.category));
  }, [shared.products, sections]);
  const category = sections.some((s) => s.id === picked) ? picked! : (sections[0]?.id ?? "");
  const setCategory = setPicked;

  const booted = useMinDelay(380);
  const catReady = useMinDelay(280, category);
  const ready = hydrated && booted;

  const results = useMemo(() => {
    const q = norm(query.trim());
    const list = !q
      ? catalog.filter((p) => p.category === category)
      : catalog.filter((p) => norm([p.name, p.description, ...p.tags].join(" ")).includes(q));
    // Esgotados vão para o fim
    return [...list].sort((a, b) => Number(b.available) - Number(a.available));
  }, [query, category, catalog]);

  const count = client.cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = client.cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const tracked = shared.orders.find((o) => o.id === client.trackedOrderId);

  // Notifica o cliente quando o admin avança o status do pedido
  const lastStatus = useRef<OrderStatus | null>(null);
  useEffect(() => {
    if (!tracked) {
      lastStatus.current = null;
      return;
    }
    if (lastStatus.current && lastStatus.current !== tracked.status) {
      const pickup = neighborhoodById(tracked.neighborhoodId)?.pickup;
      const m = STATUS_MSG[tracked.status];
      toast({
        title: tracked.status === "entrega" && pickup ? "Pronto para retirada!" : m.title,
        subtitle: `Pedido #${tracked.id}`,
        icon: m.icon,
      });
    }
    lastStatus.current = tracked.status;
  }, [tracked, toast]);

  /** Dispara a miniatura voando até o carrinho visível. */
  const fly = useCallback((from: HTMLElement, productId: string, t: ToastData) => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-cart-target]")).filter(
      (el) => el.offsetParent !== null,
    );
    const target = targets[targets.length - 1];
    const a = from.getBoundingClientRect();
    const b = target?.getBoundingClientRect();
    const id = uid();
    pendingToasts.current.set(id, t);
    setFlights((f) => [
      ...f,
      {
        id,
        productId,
        x0: a.left + a.width / 2,
        y0: a.top + a.height / 2,
        x1: b ? b.left + b.width / 2 : window.innerWidth - 40,
        y1: b ? b.top + b.height / 2 : 40,
      },
    ]);
  }, []);

  const onFlightDone = useCallback(
    (id: string) => {
      setFlights((f) => f.filter((x) => x.id !== id));
      bumpCart();
      const t = pendingToasts.current.get(id);
      if (t) toast(t);
      pendingToasts.current.delete(id);
    },
    [bumpCart, toast],
  );

  const quickAdd = (p: Product, el: HTMLElement) => {
    const size = p.priceGigante ? "media" : undefined;
    addToCart({ productId: p.id, name: p.name, size, extras: [], notes: "", qty: 1, unitPrice: unitPriceFor(p, size, []) });
    fly(el, p.id, { title: "Adicionado ao pedido", subtitle: `${p.name}${size ? " • Média" : ""}`, icon: <DishArt spec={p.art} steam={false} className="h-7 w-7" /> });
  };

  const addCustom = (p: Product, c: Customization, el: HTMLElement) => {
    addToCart({ productId: p.id, name: p.name, size: c.size, extras: c.extras, notes: c.notes, qty: c.qty, unitPrice: unitPriceFor(p, c.size, c.extras) });
    fly(el, p.id, { title: `${c.qty}x adicionado ao pedido`, subtitle: p.name, icon: <DishArt spec={p.art} steam={false} className="h-7 w-7" /> });
    setModal(null);
  };

  const openCart = (view: CartView = "cart") => {
    setCartView(view);
    setCartOpen(true);
  };

  if (!ready) return <ClientSkeleton />;

  const catLabel = sections.find((c) => c.id === category)?.name;
  const showSkeleton = !query && !catReady;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className="pb-36">
      <Header onOpenCart={() => openCart(client.cart.length || !tracked ? "cart" : "done")} onPickNeighborhood={() => setNbOpen(true)} />
      <Hero query={query} onQuery={setQuery} />
      {!query && <Featured products={catalog} onOpen={setModal} onQuickAdd={quickAdd} />}

      <section className="mx-auto mt-8 max-w-6xl px-4 sm:px-6">
        {!query ? (
          <div className="sticky top-[calc(max(env(safe-area-inset-top),10px)+108px)] z-30 -mx-1 px-1 py-1 md:top-[calc(max(env(safe-area-inset-top),10px)+76px)]">
            <CategoryTabs sections={sections} value={category} onChange={setCategory} />
          </div>
        ) : (
          <p className="text-sm text-zinc-400">
            {results.length} resultado{results.length === 1 ? "" : "s"} para <b className="text-white">“{query}”</b>
          </p>
        )}

        {!query && (
          <div className="mt-6 flex items-baseline justify-between">
            <h2 className="text-xl font-bold tracking-tight text-white">{catLabel}</h2>
            <span className="text-small text-zinc-400">{results.length} opções</span>
          </div>
        )}

        <div className="mt-4">
          <AnimatePresence mode="wait" initial={false}>
            {showSkeleton ? (
              <motion.div key="sk" exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {Array.from({ length: Math.min(6, Math.max(3, results.length)) }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </motion.div>
            ) : results.length ? (
              <motion.div key={query ? "q" : category} className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {results.map((p, i) => (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, y: 18, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ ...spring, delay: query ? 0 : i * 0.045 }}
                    >
                      <ProductCard product={p} onOpen={setModal} onQuickAdd={quickAdd} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass flex flex-col items-center gap-2 rounded-3xl py-14 text-center">
                <SearchX className="h-8 w-8 text-zinc-400" />
                <p className="font-semibold text-white">Nada encontrado</p>
                <p className="text-sm text-zinc-400">Tente “frango”, “bacon” ou “cheddar”.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <Footer />

      {/* Barra flutuante do carrinho (mobile) */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ y: 120 }}
            animate={{ y: 0 }}
            exit={{ y: 120 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed inset-x-3 bottom-[max(env(safe-area-inset-bottom),12px)] z-50 md:hidden"
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => openCart("cart")}
              data-cart-target
              className="flex h-14 w-full items-center gap-3 rounded-card bg-gradient-to-b from-amber-300 to-amber-500 px-4 text-on-brand shadow-[0_16px_40px_-10px_rgba(245,158,11,0.85),inset_0_1px_0_rgba(255,255,255,0.3)]"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-black/15 text-sm font-extrabold">{count}</span>
              <span className="font-semibold">Ver sacola</span>
              <span className="ml-auto font-extrabold">{money(subtotal)}</span>
              <ChevronRight className="h-5 w-5" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pílula de acompanhamento do pedido */}
      <AnimatePresence>
        {tracked && !cartOpen && (
          <motion.button
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={spring}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => openCart("done")}
            className={`glass-strong fixed right-4 z-50 flex items-center gap-2.5 rounded-full py-2 pl-2 pr-4 text-left ${count > 0 ? "bottom-[calc(max(env(safe-area-inset-bottom),12px)+68px)] md:bottom-6" : "bottom-[max(env(safe-area-inset-bottom),16px)]"}`}
          >
            <span className="relative grid h-9 w-9 place-items-center rounded-full bg-gradient-to-b from-amber-300 to-amber-500 text-on-brand">
              <ShoppingBag className="h-4 w-4" />
              {tracked.status !== "concluido" && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full bg-rose-500 ring-2 ring-surface" />}
            </span>
            <span className="leading-tight">
              <span className="block text-2xs text-zinc-400">Pedido #{tracked.id}</span>
              <span className="block text-sm font-bold text-white">
                {trackerSteps(!!neighborhoodById(tracked.neighborhoodId)?.pickup).find((s) => s.id === tracked.status)?.label}
              </span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <ProductModal product={modal} onClose={() => setModal(null)} onAdd={addCustom} />
      <CartDrawer open={cartOpen} view={cartView} setView={setCartView} onClose={() => setCartOpen(false)} />
      <Sheet open={nbOpen} onClose={() => setNbOpen(false)} label="Escolha seu bairro">
        <div className="p-5 pt-4 sm:p-6">
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-white">
            <MapPin className="h-5 w-5 text-amber-300" /> Onde você está?
          </h2>
          <p className="mb-4 mt-1 text-sm text-zinc-400">Entregamos em {STORE.city}. O frete é calculado automaticamente.</p>
          <NeighborhoodList
            value={client.neighborhoodId}
            onPick={(id) => {
              setNeighborhood(id);
              setTimeout(() => setNbOpen(false), 220);
            }}
          />
        </div>
      </Sheet>
      <FlyLayer flights={flights} onDone={onFlightDone} />
    </motion.div>
  );
}

function Footer() {
  return (
    <footer className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
      <div className="glass flex flex-col items-center gap-3 rounded-3xl px-6 py-8 text-center">
        <Logo size={64} />
        <p className="text-lg font-extrabold text-white">
          Batatas <span className="text-amber-300">da Val</span> • Delivery
        </p>
        <p className="text-sm text-zinc-400">{STORE.slogan}</p>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-zinc-400">
          <span>{STORE.hoursLong}</span>
          <span>{STORE.phone}</span>
          <a href={STORE.instagramUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-white">
            <InstagramIcon className="h-3.5 w-3.5" /> {STORE.instagram}
          </a>
          <span>{STORE.city}</span>
        </div>
      </div>
    </footer>
  );
}

/** Silhueta fiel do layout do cliente durante o carregamento. */
export function ClientSkeleton() {
  return (
    <div className="pb-24">
      <div className="px-3 pt-[max(env(safe-area-inset-top),10px)] sm:px-6">
        <div className="glass mx-auto flex max-w-6xl items-center gap-3 rounded-panel p-2.5">
          <Skeleton className="h-[46px] w-[46px] rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-52" />
          </div>
          <Skeleton className="h-11 w-11 rounded-2xl" />
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-6xl space-y-4 px-4 sm:mt-12 sm:px-6">
        <Skeleton className="h-6 w-48 rounded-full" />
        <Skeleton className="h-10 w-full max-w-lg" />
        <Skeleton className="h-10 w-2/3 max-w-md" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-40 rounded-full" />
          <Skeleton className="h-8 w-44 rounded-full" />
        </div>
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
      <div className="mx-auto mt-8 flex max-w-6xl gap-3 overflow-hidden px-4 sm:px-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="glass w-[250px] shrink-0 rounded-3xl p-3">
            <Skeleton className="h-36 w-full rounded-2xl" />
            <Skeleton className="mt-3 h-4 w-3/4" />
            <Skeleton className="mt-2 h-5 w-20" />
          </div>
        ))}
      </div>
      <div className="mx-auto mt-8 max-w-6xl px-4 sm:px-6">
        <Skeleton className="h-14 w-full rounded-full" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
