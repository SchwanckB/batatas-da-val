"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SEED_SETTINGS } from "./data";
import { findNeighborhood, findProduct, unitPriceFor } from "./data";
import { uid } from "./format";
import { storage, usePolling } from "./hooks";
import { openStatus, type OpenStatus } from "./hours";
import type { CartItem, ClientState, Neighborhood, Order, PaymentMethod, PublicState } from "./types";

const CLIENT_KEY = "bdv:cliente:v2";
const MENU_CACHE_KEY = "bdv:cardapio:v2";

const emptyClient: ClientState = {
  cart: [],
  neighborhoodId: null,
  orderTokens: [],
  customer: { name: "", phone: "", address: "" },
  couponCode: "",
};

const emptyMenu: PublicState = {
  rev: 0,
  sections: [],
  products: [],
  extras: [],
  neighborhoods: [],
  settings: SEED_SETTINGS,
};

export interface AppliedCoupon {
  code: string;
  kind: "fixo" | "percent";
  value: number;
  discount: number;
}

interface MenuValue {
  /** Cardápio já disponível (da rede ou do cache). */
  hydrated: boolean;
  offline: boolean;
  /** Mensagem do servidor quando a falha não é de conexão (ex.: banco fora). */
  serverError: string;
  menu: PublicState;
  status: OpenStatus;
  refreshMenu: () => Promise<void>;

  // Sacola
  cart: CartItem[];
  count: number;
  addToCart: (item: Omit<CartItem, "uid">) => void;
  setQty: (uid: string, qty: number) => void;
  removeItem: (uid: string) => void;
  clearCart: () => void;
  reorder: (order: Order) => number;

  // Entrega e dados do cliente
  neighborhoodId: string | null;
  neighborhood: Neighborhood | undefined;
  setNeighborhood: (id: string) => void;
  customer: ClientState["customer"];
  setCustomer: (c: Partial<ClientState["customer"]>) => void;

  // Cupom
  coupon: AppliedCoupon | null;
  couponInput: string;
  setCouponInput: (v: string) => void;
  applyCoupon: (code: string) => Promise<string | null>;
  clearCoupon: () => void;

  totals: { subtotal: number; fee: number; discount: number; total: number };

  // Pedidos deste aparelho
  myOrders: Order[];
  tracked: Order | null;
  trackedToken: string | null;
  setTrackedToken: (t: string | null) => void;
  placeOrder: (payment: PaymentMethod, changeFor?: number) => Promise<{ ok: boolean; order?: Order; error?: string }>;
  refreshOrders: () => Promise<void>;
  rateOrder: (token: string, stars: number, comment: string) => Promise<string | null>;

  cartBump: number;
  bumpCart: () => void;
}

const Ctx = createContext<MenuValue | null>(null);

const cents = (v: number) => Math.round(v * 100) / 100;

export function MenuProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState<PublicState>(emptyMenu);
  const [hydrated, setHydrated] = useState(false);
  const [offline, setOffline] = useState(false);
  const [serverError, setServerError] = useState("");
  const [client, setClient] = useState<ClientState>(emptyClient);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [trackedToken, setTrackedToken] = useState<string | null>(null);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [cartBump, setCartBump] = useState(0);
  const [minute, setMinute] = useState(() => Date.now());
  const revRef = useRef(0);
  const ordersRevRef = useRef(-1);

  const updateClient = useCallback((fn: (c: ClientState) => ClientState) => {
    setClient((prev) => {
      const next = fn(prev);
      storage.write(CLIENT_KEY, next);
      return next;
    });
  }, []);

  /* ---------------- cardápio ---------------- */

  const refreshMenu = useCallback(async () => {
    try {
      const res = await fetch(`/api/menu?rev=${revRef.current}`, { cache: "no-store" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setServerError(body.error ?? "");
        throw new Error(String(res.status));
      }
      const data = (await res.json()) as PublicState | { rev: number; unchanged: true };
      setOffline(false);
      setServerError("");
      if ("unchanged" in data) {
        revRef.current = data.rev;
        return;
      }
      revRef.current = data.rev;
      setMenu(data);
      storage.write(MENU_CACHE_KEY, data);
    } catch {
      setOffline(true);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Primeira carga: cache local na frente (abre instantâneo), rede depois.
  useEffect(() => {
    const saved = storage.read<ClientState>(CLIENT_KEY);
    if (saved) setClient({ ...emptyClient, ...saved });
    setTrackedToken(saved?.orderTokens?.[0] ?? null);
    setCouponInput(saved?.couponCode ?? "");

    const cached = storage.read<PublicState>(MENU_CACHE_KEY);
    if (cached?.products?.length) {
      setMenu(cached);
      revRef.current = cached.rev ?? 0;
      setHydrated(true);
    }
    void refreshMenu();
  }, [refreshMenu]);

  usePolling(refreshMenu, 20000);

  // Relógio de minuto para o selo Aberto/Fechado acompanhar o horário real.
  useEffect(() => {
    const t = setInterval(() => setMinute(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const status = useMemo(() => openStatus(menu.settings, minute), [menu.settings, minute]);

  /* ---------------- sacola ---------------- */

  const addToCart = useCallback(
    (item: Omit<CartItem, "uid">) =>
      updateClient((c) => {
        const key = (i: Pick<CartItem, "productId" | "size" | "notes" | "extras">) =>
          `${i.productId}|${i.size ?? ""}|${i.notes}|${[...i.extras].sort().join(",")}`;
        const same = c.cart.find((x) => key(x) === key(item));
        const cart = same
          ? c.cart.map((x) => (x === same ? { ...x, qty: Math.min(20, x.qty + item.qty) } : x))
          : [...c.cart, { ...item, uid: uid() }];
        return { ...c, cart };
      }),
    [updateClient],
  );

  const setQty = useCallback(
    (id: string, qty: number) =>
      updateClient((c) => ({
        ...c,
        cart:
          qty <= 0
            ? c.cart.filter((x) => x.uid !== id)
            : c.cart.map((x) => (x.uid === id ? { ...x, qty: Math.min(20, qty) } : x)),
      })),
    [updateClient],
  );

  const removeItem = useCallback(
    (id: string) => updateClient((c) => ({ ...c, cart: c.cart.filter((x) => x.uid !== id) })),
    [updateClient],
  );

  const clearCart = useCallback(() => updateClient((c) => ({ ...c, cart: [] })), [updateClient]);

  /** Repete um pedido antigo com os preços de hoje. Devolve quantos itens entraram. */
  const reorder = useCallback(
    (order: Order) => {
      let added = 0;
      const items: CartItem[] = [];
      for (const i of order.items) {
        const p = findProduct(menu.products, i.productId);
        if (!p || !p.available) continue;
        const extras = i.extras.filter((e) => menu.extras.some((x) => x.id === e));
        items.push({
          ...i,
          uid: uid(),
          name: p.name,
          extras,
          unitPrice: unitPriceFor(p, i.size, extras, menu.extras),
        });
        added++;
      }
      if (items.length) updateClient((c) => ({ ...c, cart: [...c.cart, ...items] }));
      return added;
    },
    [menu.products, menu.extras, updateClient],
  );

  const setNeighborhood = useCallback(
    (id: string) => updateClient((c) => ({ ...c, neighborhoodId: id })),
    [updateClient],
  );

  const setCustomer = useCallback(
    (p: Partial<ClientState["customer"]>) =>
      updateClient((c) => ({ ...c, customer: { ...c.customer, ...p } })),
    [updateClient],
  );

  const neighborhood = findNeighborhood(menu.neighborhoods, client.neighborhoodId);
  const subtotal = useMemo(
    () => cents(client.cart.reduce((s, i) => s + i.unitPrice * i.qty, 0)),
    [client.cart],
  );

  /* ---------------- cupom ---------------- */

  const applyCoupon = useCallback(
    async (code: string) => {
      const clean = code.trim();
      if (!clean) return "Digite o código do cupom.";
      try {
        const res = await fetch("/api/cupom", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: clean, subtotal }),
        });
        const data = (await res.json()) as AppliedCoupon & { error?: string };
        if (!res.ok) return data.error ?? "Não foi possível validar o cupom.";
        setCoupon({ code: data.code, kind: data.kind, value: data.value, discount: data.discount });
        updateClient((c) => ({ ...c, couponCode: data.code }));
        setCouponInput(data.code);
        return null;
      } catch {
        return "Sem conexão para validar o cupom.";
      }
    },
    [subtotal, updateClient],
  );

  const clearCoupon = useCallback(() => {
    setCoupon(null);
    setCouponInput("");
    updateClient((c) => ({ ...c, couponCode: "" }));
  }, [updateClient]);

  // O desconto acompanha o subtotal (cupom de % muda quando a sacola muda).
  const discount = useMemo(() => {
    if (!coupon) return 0;
    const raw = coupon.kind === "percent" ? (subtotal * coupon.value) / 100 : coupon.value;
    return Math.min(subtotal, cents(raw));
  }, [coupon, subtotal]);

  const fee = neighborhood?.fee ?? 0;
  const totals = useMemo(
    () => ({ subtotal, fee, discount, total: cents(Math.max(0, subtotal + fee - discount)) }),
    [subtotal, fee, discount],
  );

  /* ---------------- pedidos ---------------- */

  const refreshOrders = useCallback(async () => {
    const tokens = storage.read<ClientState>(CLIENT_KEY)?.orderTokens ?? client.orderTokens;
    if (!tokens.length) {
      setMyOrders([]);
      return;
    }
    try {
      const res = await fetch(`/api/pedidos?tokens=${tokens.join(",")}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { rev: number; orders: Order[] };
      if (data.rev === ordersRevRef.current) return;
      ordersRevRef.current = data.rev;
      setMyOrders(data.orders);
    } catch {
      /* offline: mantém o que já temos */
    }
  }, [client.orderTokens]);

  useEffect(() => {
    if (client.orderTokens.length) void refreshOrders();
  }, [client.orderTokens, refreshOrders]);

  // Enquanto há pedido em andamento, olha com mais frequência.
  const hasOpenOrder = myOrders.some((o) => o.status !== "concluido" && o.status !== "cancelado");
  usePolling(refreshOrders, hasOpenOrder ? 8000 : 45000, client.orderTokens.length > 0);

  const placeOrder = useCallback(
    async (payment: PaymentMethod, changeFor?: number) => {
      if (!client.cart.length) return { ok: false, error: "Sua sacola está vazia." };
      if (!client.neighborhoodId) return { ok: false, error: "Escolha o bairro ou a retirada." };
      try {
        const res = await fetch("/api/pedidos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer: client.customer,
            neighborhoodId: client.neighborhoodId,
            items: client.cart.map((i) => ({
              productId: i.productId,
              size: i.size,
              extras: i.extras,
              notes: i.notes,
              qty: i.qty,
            })),
            payment,
            changeFor,
            couponCode: coupon?.code,
          }),
        });
        const data = (await res.json()) as { order?: Order; error?: string };
        if (!res.ok || !data.order) return { ok: false, error: data.error ?? "Não foi possível enviar o pedido." };

        const order = data.order;
        updateClient((c) => ({
          ...c,
          cart: [],
          couponCode: "",
          orderTokens: [order.token, ...c.orderTokens].slice(0, 20),
        }));
        setMyOrders((prev) => [order, ...prev]);
        setTrackedToken(order.token);
        setCoupon(null);
        setCouponInput("");
        ordersRevRef.current = -1;
        return { ok: true, order };
      } catch {
        return { ok: false, error: "Sem conexão. Verifique a internet e tente de novo." };
      }
    },
    [client, coupon, updateClient],
  );

  const rateOrder = useCallback(async (token: string, stars: number, comment: string) => {
    try {
      const res = await fetch(`/api/pedidos/${token}/avaliar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars, comment }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) return data.error ?? "Não foi possível enviar a avaliação.";
      ordersRevRef.current = -1;
      await refreshOrders();
      return null;
    } catch {
      return "Sem conexão para enviar a avaliação.";
    }
  }, [refreshOrders]);

  const tracked = useMemo(
    () => myOrders.find((o) => o.token === trackedToken) ?? null,
    [myOrders, trackedToken],
  );

  const bumpCart = useCallback(() => setCartBump((n) => n + 1), []);

  const value = useMemo<MenuValue>(
    () => ({
      hydrated,
      offline,
      serverError,
      menu,
      status,
      refreshMenu,
      cart: client.cart,
      count: client.cart.reduce((s, i) => s + i.qty, 0),
      addToCart,
      setQty,
      removeItem,
      clearCart,
      reorder,
      neighborhoodId: client.neighborhoodId,
      neighborhood,
      setNeighborhood,
      customer: client.customer,
      setCustomer,
      coupon,
      couponInput,
      setCouponInput,
      applyCoupon,
      clearCoupon,
      totals,
      myOrders,
      tracked,
      trackedToken,
      setTrackedToken,
      placeOrder,
      refreshOrders,
      rateOrder,
      cartBump,
      bumpCart,
    }),
    [
      hydrated, offline, serverError, menu, status, refreshMenu, client.cart, client.neighborhoodId, client.customer,
      addToCart, setQty, removeItem, clearCart, reorder, neighborhood, setNeighborhood, setCustomer,
      coupon, couponInput, applyCoupon, clearCoupon, totals, myOrders, tracked, trackedToken,
      placeOrder, refreshOrders, rateOrder, cartBump, bumpCart,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMenu() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useMenu precisa estar dentro de <MenuProvider>");
  return v;
}
