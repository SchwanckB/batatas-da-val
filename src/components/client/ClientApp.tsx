"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bike,
  ChefHat,
  ChevronRight,
  ClipboardCheck,
  MapPin,
  PackageCheck,
  Search,
  SearchX,
  ShoppingBag,
  WifiOff,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { InstagramIcon } from "@/components/ui/InstagramIcon";
import { Logo } from "@/components/ui/Logo";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { spring } from "@/components/ui/Press";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { findNeighborhood, unitPriceFor } from "@/lib/data";
import { cn, instagramUrl, money, norm, uid, waLink } from "@/lib/format";
import { hoursLines } from "@/lib/hours";
import { useMinDelay } from "@/lib/hooks";
import { useMenu } from "@/lib/menuStore";
import { useToast } from "@/lib/toast";
import type { CategoryId, Order, OrderStatus, Product } from "@/lib/types";
import { CartDrawer, type CartView } from "./CartDrawer";
import { CategoryTabs } from "./CategoryTabs";
import { DishArt } from "./DishArt";
import { Featured } from "./Featured";
import { FlyLayer, type Flight } from "./FlyLayer";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { MenuRow, MenuRowSkeleton } from "./MenuRow";
import { MyOrders } from "./MyOrders";
import { NeighborhoodList } from "./NeighborhoodPicker";
import { Notices } from "./Notices";
import { ProductModal, type Customization } from "./ProductModal";
import { statusLabel } from "./OrderTracker";

type ToastData = { title: string; subtitle: string; icon: ReactNode };

const ic = "h-4.5 w-4.5 text-amber-300";
const STATUS_MSG: Record<OrderStatus, { title: string; icon: ReactNode }> = {
  novo: { title: "Pedido recebido", icon: <ClipboardCheck className={ic} /> },
  preparo: { title: "Seu pedido entrou na cozinha", icon: <ChefHat className={ic} /> },
  entrega: { title: "Saiu para entrega", icon: <Bike className={ic} /> },
  concluido: { title: "Entregue. Bom apetite!", icon: <PackageCheck className={ic} /> },
  cancelado: { title: "Pedido cancelado", icon: <X className={ic} /> },
};

export function ClientApp() {
  const {
    hydrated,
    offline,
    serverError,
    menu,
    cart,
    count,
    totals,
    addToCart,
    bumpCart,
    neighborhoodId,
    setNeighborhood,
    tracked,
    setTrackedToken,
    myOrders,
  } = useMenu();
  const { toast } = useToast();

  const [picked, setPicked] = useState<CategoryId | null>(null);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartView, setCartView] = useState<CartView>("cart");
  const [nbOpen, setNbOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [flights, setFlights] = useState<Flight[]>([]);
  const pendingToasts = useRef(new Map<string, ToastData>());

  const sections = menu.sections;
  const category = sections.some((s) => s.id === picked) ? picked! : (sections[0]?.id ?? "");

  const booted = useMinDelay(320);
  const ready = hydrated && booted;

  const results = useMemo(() => {
    const q = norm(query.trim());
    const list = !q
      ? menu.products.filter((p) => p.category === category)
      : menu.products.filter((p) => norm([p.name, p.description, ...p.tags].join(" ")).includes(q));
    return [...list].sort((a, b) => Number(b.available) - Number(a.available));
  }, [query, category, menu.products]);

  // Avisa o cliente quando a cozinha muda o status do pedido que ele acompanha
  const lastStatus = useRef<OrderStatus | null>(null);
  useEffect(() => {
    if (!tracked) {
      lastStatus.current = null;
      return;
    }
    if (lastStatus.current && lastStatus.current !== tracked.status) {
      const pickup = !!findNeighborhood(menu.neighborhoods, tracked.neighborhoodId)?.pickup;
      const m = STATUS_MSG[tracked.status];
      toast({
        title: tracked.status === "entrega" && pickup ? "Pronto para retirar" : m.title,
        subtitle: `Pedido #${tracked.id}`,
        icon: m.icon,
      });
    }
    lastStatus.current = tracked.status;
  }, [tracked, toast, menu.neighborhoods]);

  /** Miniatura voando até a sacola visível. */
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
    addToCart({
      productId: p.id,
      name: p.name,
      size,
      extras: [],
      notes: "",
      qty: 1,
      unitPrice: unitPriceFor(p, size, [], menu.extras),
    });
    fly(el, p.id, {
      title: "Na sacola",
      subtitle: size ? `${p.name}, média` : p.name,
      icon: <DishArt spec={p.art} steam={false} className="h-7 w-7" />,
    });
  };

  const addCustom = (p: Product, c: Customization, el: HTMLElement) => {
    addToCart({
      productId: p.id,
      name: p.name,
      size: c.size,
      extras: c.extras,
      notes: c.notes,
      qty: c.qty,
      unitPrice: unitPriceFor(p, c.size, c.extras, menu.extras),
    });
    fly(el, p.id, { title: `${c.qty}x na sacola`, subtitle: p.name, icon: <DishArt spec={p.art} steam={false} className="h-7 w-7" /> });
    setModal(null);
  };

  const openCart = (view: CartView = "cart") => {
    setCartView(view);
    setCartOpen(true);
  };

  const trackOrder = (order: Order) => {
    setTrackedToken(order.token);
    setOrdersOpen(false);
    openCart("done");
  };

  const seeMenu = () =>
    document.getElementById("cardapio")?.scrollIntoView({ behavior: "smooth", block: "start" });

  if (!ready) return <ClientSkeleton />;

  const catLabel = sections.find((c) => c.id === category)?.name;
  const pickupTracked = !!findNeighborhood(menu.neighborhoods, tracked?.neighborhoodId ?? "")?.pickup;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="pb-36">
      <Header
        onOpenCart={() => openCart(cart.length || !tracked ? "cart" : "done")}
        onPickNeighborhood={() => setNbOpen(true)}
        onOpenOrders={() => setOrdersOpen(true)}
      />

      {offline && (
        <p className="flex items-center justify-center gap-2 bg-surface px-4 py-2 text-center text-small text-zinc-300">
          <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {serverError
            ? serverError
            : menu.products.length
              ? "Sem conexão. Você está vendo o cardápio salvo no aparelho."
              : "Sem conexão com o servidor. Tente de novo em instantes."}
        </p>
      )}

      <Hero settings={menu.settings} neighborhoods={menu.neighborhoods} onSeeMenu={seeMenu} />

      <Notices notices={menu.settings.notices} />

      <Featured products={menu.products} onOpen={setModal} onQuickAdd={quickAdd} />

      {/* Faixa de papel: é aqui que o cardápio vira cardápio */}
      <section id="cardapio" className="papel mt-12 border-t-4 border-gold sm:mt-16">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="letreiro text-3xl text-paper-ink sm:text-4xl">Cardápio</h2>
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

          {!query ? (
            <div className="sticky top-25 z-30 -mx-4 mt-5 bg-paper px-4 sm:-mx-6 sm:px-6 md:top-17">
              <CategoryTabs sections={sections} value={category} onChange={setPicked} />
            </div>
          ) : (
            <p className="mt-5 border-b border-paper-ink/15 pb-3 text-sm text-zinc-600">
              {results.length} {results.length === 1 ? "resultado" : "resultados"} para{" "}
              <b className="text-paper-ink">“{query}”</b>
            </p>
          )}

          {!query && catLabel && (
            <div className="mt-6 flex items-baseline justify-between gap-4">
              <h3 className="letreiro text-2xl text-paper-ink">{catLabel}</h3>
              <span className="text-small tnum text-zinc-600">
                {results.length} {results.length === 1 ? "opção" : "opções"}
              </span>
            </div>
          )}

          <AnimatePresence mode="wait" initial={false}>
            {results.length ? (
              <motion.ul
                key={query ? "busca" : category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-2 lg:grid lg:grid-cols-2 lg:gap-x-10"
              >
                {results.map((p) => (
                  <MenuRow key={p.id} product={p} onOpen={setModal} onQuickAdd={quickAdd} />
                ))}
              </motion.ul>
            ) : (
              <motion.div
                key="vazio"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex flex-col items-center gap-2 rounded-card border border-dashed border-paper-ink/25 py-14 text-center"
              >
                <SearchX className="h-7 w-7 text-zinc-500" aria-hidden />
                <p className="font-bold text-paper-ink">Não encontramos esse item</p>
                <p className="text-sm text-zinc-600">Tente “frango”, “bacon” ou “cheddar”.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <Footer />

      {/* Barra da sacola no celular */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ y: 120 }}
            animate={{ y: 0 }}
            exit={{ y: 120 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed inset-x-3 bottom-[max(env(safe-area-inset-bottom),0.75rem)] z-50 md:hidden"
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => openCart("cart")}
              data-cart-target
              className="btn-gold flex h-14 w-full items-center gap-3 rounded-card px-4"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-black/15 text-sm font-bold tnum">
                {count}
              </span>
              <span className="font-bold">Ver a sacola</span>
              <span className="ml-auto font-bold tnum">{money(totals.total)}</span>
              <ChevronRight className="h-5 w-5" aria-hidden />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pílula de acompanhamento */}
      <AnimatePresence>
        {tracked && tracked.status !== "concluido" && tracked.status !== "cancelado" && !cartOpen && (
          <motion.button
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={spring}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => openCart("done")}
            className={cn(
              "panel-strong fixed right-4 z-50 flex items-center gap-2.5 rounded-full py-2 pl-2 pr-4 text-left",
              count > 0
                ? "bottom-[calc(max(env(safe-area-inset-bottom),0.75rem)+4.25rem)] md:bottom-6"
                : "bottom-[max(env(safe-area-inset-bottom),1rem)]",
            )}
          >
            <span className="btn-gold grid h-9 w-9 place-items-center rounded-full">
              <ShoppingBag className="h-4 w-4" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block text-2xs tnum text-zinc-400">Pedido #{tracked.id}</span>
              <span className="block text-sm font-bold text-white">
                {statusLabel(tracked.status, pickupTracked)}
              </span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <ProductModal
        product={modal}
        extrasList={menu.extras}
        onClose={() => setModal(null)}
        onAdd={addCustom}
      />
      <CartDrawer open={cartOpen} view={cartView} setView={setCartView} onClose={() => setCartOpen(false)} />
      <MyOrders open={ordersOpen} onClose={() => setOrdersOpen(false)} onTrack={trackOrder} />

      <Sheet open={nbOpen} onClose={() => setNbOpen(false)} label="Escolha seu bairro">
        <div className="p-5 pt-4 sm:p-6">
          <h2 className="letreiro flex items-center gap-2 pr-10 text-2xl text-white">
            <MapPin className="h-5 w-5 text-amber-400" aria-hidden /> Onde você está?
          </h2>
          <p className="mb-4 mt-1.5 text-sm text-zinc-400">
            Entregamos em {menu.settings.city}. O frete entra no total automaticamente.
          </p>
          <NeighborhoodList
            neighborhoods={menu.neighborhoods}
            value={neighborhoodId}
            onPick={(id) => {
              setNeighborhood(id);
              setTimeout(() => setNbOpen(false), 220);
            }}
          />
        </div>
      </Sheet>

      <FlyLayer flights={flights} products={menu.products} onDone={onFlightDone} />

      {myOrders.length > 0 && <span className="sr-only">{myOrders.length} pedidos neste aparelho</span>}
    </motion.div>
  );
}

function Footer() {
  const { menu } = useMenu();
  const { settings } = menu;
  return (
    <footer className="mx-auto mt-14 max-w-6xl px-4 sm:px-6">
      <div className="flex flex-col items-center gap-3 border-t border-line pt-10 text-center">
        <Logo size={56} />
        <p className="letreiro text-2xl text-white">{settings.name}</p>
        <p className="max-w-md text-sm text-zinc-400">{settings.slogan}</p>

        <dl className="mt-4 grid w-full max-w-md gap-x-6 text-left sm:grid-cols-2">
          <div className="flex items-baseline gap-3 border-b border-line py-2">
            <dt className="w-20 shrink-0 text-small text-zinc-500">Horário</dt>
            <dd className="text-small tnum text-zinc-200">
              {hoursLines(settings).map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </dd>
          </div>
          <div className="flex items-baseline gap-3 border-b border-line py-2">
            <dt className="w-20 shrink-0 text-small text-zinc-500">Telefone</dt>
            <dd className="text-small tnum text-zinc-200">{settings.phone}</dd>
          </div>
          <div className="flex items-baseline gap-3 border-b border-line py-2">
            <dt className="w-20 shrink-0 text-small text-zinc-500">Onde</dt>
            <dd className="text-small text-zinc-200">{settings.address || settings.city}</dd>
          </div>
          <div className="flex items-baseline gap-3 border-b border-line py-2">
            <dt className="w-20 shrink-0 text-small text-zinc-500">Instagram</dt>
            <dd className="text-small">
              <a
                href={instagramUrl(settings.instagram)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-zinc-200 hover:text-amber-300"
              >
                <InstagramIcon className="h-3.5 w-3.5" aria-hidden /> {settings.instagram}
              </a>
            </dd>
          </div>
        </dl>

        <a
          href={waLink(settings.whatsapp)}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-control border border-line px-4 text-sm font-semibold text-zinc-200 hover:border-amber-400/40 hover:text-white"
        >
          <WhatsAppIcon className="h-4 w-4" aria-hidden /> Chamar no WhatsApp
        </a>
        <p className="mt-6 text-2xs text-zinc-600">
          {settings.name} — {settings.city}
        </p>
      </div>
    </footer>
  );
}

/** Silhueta do cardápio durante o carregamento. */
export function ClientSkeleton() {
  return (
    <div className="pb-24">
      <div className="border-b border-line px-4 py-2.5 pt-[max(env(safe-area-inset-top),0.625rem)] sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <Skeleton className="h-10.5 w-10.5 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-52" />
          </div>
          <Skeleton className="h-11 w-11 rounded-control" />
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-6xl space-y-4 px-4 sm:px-6">
        <Skeleton className="h-4 w-40 rounded-full" />
        <Skeleton className="h-14 w-full max-w-lg" />
        <Skeleton className="h-10 w-2/3 max-w-md" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-12 w-40 rounded-control" />
          <Skeleton className="h-12 w-44 rounded-control" />
        </div>
        <div className="grid gap-2 pt-6 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-6xl gap-3 overflow-hidden px-4 sm:px-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="panel w-60 shrink-0 rounded-card p-3">
            <Skeleton className="h-36 w-full rounded-md" />
            <Skeleton className="mt-3 h-4 w-3/4" />
            <Skeleton className="mt-2 h-5 w-20" />
          </div>
        ))}
      </div>

      <div className="papel mt-12 border-t-4 border-gold">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="h-9 w-40 rounded bg-paper-ink/10" />
          <ul className="mt-6">
            {[0, 1, 2, 3].map((i) => (
              <MenuRowSkeleton key={i} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
