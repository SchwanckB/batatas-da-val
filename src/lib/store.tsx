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
import { STATE_VERSION, createSeed, neighborhoodById, orderConsumption } from "./data";
import type { CartItem, CashEntry, ClientState, Order, OrderStatus, PaymentMethod, SharedState } from "./types";
import { uid } from "./format";

const SHARED_KEY = "bdv:shared:v1";
const CLIENT_KEY = "bdv:client:v1";
const CHANNEL = "bdv-sync";

const emptyClient: ClientState = {
  cart: [],
  neighborhoodId: null,
  trackedOrderId: null,
  customer: { name: "", phone: "", address: "" },
};

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* modo privado / sem espaço: segue só em memória */
  }
}

export const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  novo: "preparo",
  preparo: "entrega",
  entrega: "concluido",
  concluido: null,
};

interface Toast {
  id: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}

interface StoreValue {
  hydrated: boolean;
  shared: SharedState;
  client: ClientState;
  // cliente
  addToCart: (item: Omit<CartItem, "uid">) => void;
  setQty: (uid: string, qty: number) => void;
  removeItem: (uid: string) => void;
  setNeighborhood: (id: string) => void;
  setCustomer: (c: Partial<ClientState["customer"]>) => void;
  placeOrder: (payment: PaymentMethod, changeFor?: number) => Order | null;
  clearTracking: () => void;
  // admin
  advanceOrder: (id: number) => void;
  addCashEntry: (e: Omit<CashEntry, "id" | "at">) => void;
  adjustStock: (id: string, delta: number) => void;
  resetDemo: () => void;
  // UI
  toasts: Toast[];
  toast: (t: Omit<Toast, "id">) => void;
  cartBump: number;
  bumpCart: () => void;
}

const Ctx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [shared, setShared] = useState<SharedState>(() => ({
    version: STATE_VERSION,
    nextOrderId: 0,
    orders: [],
    stock: [],
    cash: [],
    openingFloat: 0,
  }));
  const [client, setClient] = useState<ClientState>(emptyClient);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [cartBump, setCartBump] = useState(0);
  const channel = useRef<BroadcastChannel | null>(null);

  // Hidratação + sincronização entre abas (Cliente ⇄ Admin)
  useEffect(() => {
    const s = read<SharedState>(SHARED_KEY);
    const initial = s && s.version === STATE_VERSION ? s : createSeed();
    if (!s || s.version !== STATE_VERSION) write(SHARED_KEY, initial);
    setShared(initial);
    setClient({ ...emptyClient, ...(read<ClientState>(CLIENT_KEY) ?? {}) });
    setHydrated(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === SHARED_KEY && e.newValue) setShared(JSON.parse(e.newValue));
    };
    window.addEventListener("storage", onStorage);
    if ("BroadcastChannel" in window) {
      channel.current = new BroadcastChannel(CHANNEL);
      channel.current.onmessage = (ev: MessageEvent<SharedState>) => setShared(ev.data);
    }
    return () => {
      window.removeEventListener("storage", onStorage);
      channel.current?.close();
    };
  }, []);

  const updateShared = useCallback((fn: (s: SharedState) => SharedState) => {
    setShared((prev) => {
      const next = fn(prev);
      write(SHARED_KEY, next);
      channel.current?.postMessage(next);
      return next;
    });
  }, []);

  const updateClient = useCallback((fn: (s: ClientState) => ClientState) => {
    setClient((prev) => {
      const next = fn(prev);
      write(CLIENT_KEY, next);
      return next;
    });
  }, []);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = uid();
    setToasts((prev) => [...prev.slice(-2), { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 2600);
  }, []);

  const bumpCart = useCallback(() => setCartBump((n) => n + 1), []);

  const addToCart = useCallback(
    (item: Omit<CartItem, "uid">) =>
      updateClient((c) => {
        const same = c.cart.find(
          (x) =>
            x.productId === item.productId &&
            x.size === item.size &&
            x.notes === item.notes &&
            x.extras.slice().sort().join() === item.extras.slice().sort().join(),
        );
        const cart = same
          ? c.cart.map((x) => (x === same ? { ...x, qty: x.qty + item.qty } : x))
          : [...c.cart, { ...item, uid: uid() }];
        return { ...c, cart };
      }),
    [updateClient],
  );

  const setQty = useCallback(
    (id: string, qty: number) =>
      updateClient((c) => ({
        ...c,
        cart: qty <= 0 ? c.cart.filter((x) => x.uid !== id) : c.cart.map((x) => (x.uid === id ? { ...x, qty } : x)),
      })),
    [updateClient],
  );

  const removeItem = useCallback(
    (id: string) => updateClient((c) => ({ ...c, cart: c.cart.filter((x) => x.uid !== id) })),
    [updateClient],
  );

  const setNeighborhood = useCallback(
    (id: string) => updateClient((c) => ({ ...c, neighborhoodId: id })),
    [updateClient],
  );

  const setCustomer = useCallback(
    (p: Partial<ClientState["customer"]>) => updateClient((c) => ({ ...c, customer: { ...c.customer, ...p } })),
    [updateClient],
  );

  const placeOrder = useCallback(
    (payment: PaymentMethod, changeFor?: number) => {
      if (!client.cart.length || !client.neighborhoodId) return null;
      const nb = neighborhoodById(client.neighborhoodId);
      const subtotal = client.cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
      const deliveryFee = nb?.fee ?? 0;
      const now = Date.now();
      const order: Order = {
        id: shared.nextOrderId,
        createdAt: now,
        updatedAt: now,
        customer: { ...client.customer },
        neighborhoodId: client.neighborhoodId,
        items: client.cart,
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee,
        payment,
        changeFor,
        status: "novo",
        stockDeducted: false,
      };
      updateShared((s) => ({ ...s, nextOrderId: Math.max(s.nextOrderId, order.id) + 1, orders: [...s.orders, order] }));
      updateClient((c) => ({ ...c, cart: [], trackedOrderId: order.id }));
      return order;
    },
    [client, shared.nextOrderId, updateShared, updateClient],
  );

  const clearTracking = useCallback(() => updateClient((c) => ({ ...c, trackedOrderId: null })), [updateClient]);

  const advanceOrder = useCallback(
    (id: number) =>
      updateShared((s) => {
        const o = s.orders.find((x) => x.id === id);
        const next = o ? NEXT_STATUS[o.status] : null;
        if (!o || !next) return s;
        let stock = s.stock;
        let deducted = o.stockDeducted;
        // Baixa automática de insumos ao entrar em preparo (ou ao concluir, se ainda não baixou)
        if (!deducted && (next === "preparo" || next === "concluido")) {
          const use = orderConsumption(o);
          stock = stock.map((i) =>
            use[i.id] ? { ...i, qty: Math.max(0, Math.round((i.qty - (use[i.id] ?? 0)) * 100) / 100) } : i,
          );
          deducted = true;
        }
        return {
          ...s,
          stock,
          orders: s.orders.map((x) =>
            x.id === id ? { ...x, status: next, stockDeducted: deducted, updatedAt: Date.now() } : x,
          ),
        };
      }),
    [updateShared],
  );

  const addCashEntry = useCallback(
    (e: Omit<CashEntry, "id" | "at">) =>
      updateShared((s) => ({ ...s, cash: [...s.cash, { ...e, id: uid(), at: Date.now() }] })),
    [updateShared],
  );

  const adjustStock = useCallback(
    (id: string, delta: number) =>
      updateShared((s) => ({
        ...s,
        stock: s.stock.map((i) =>
          i.id === id ? { ...i, qty: Math.max(0, Math.round((i.qty + delta) * 100) / 100) } : i,
        ),
      })),
    [updateShared],
  );

  const resetDemo = useCallback(() => {
    updateShared(() => createSeed());
    updateClient(() => emptyClient);
  }, [updateShared, updateClient]);

  const value = useMemo<StoreValue>(
    () => ({
      hydrated,
      shared,
      client,
      addToCart,
      setQty,
      removeItem,
      setNeighborhood,
      setCustomer,
      placeOrder,
      clearTracking,
      advanceOrder,
      addCashEntry,
      adjustStock,
      resetDemo,
      toasts,
      toast,
      cartBump,
      bumpCart,
    }),
    [hydrated, shared, client, addToCart, setQty, removeItem, setNeighborhood, setCustomer, placeOrder, clearTracking, advanceOrder, addCashEntry, adjustStock, resetDemo, toasts, toast, cartBump, bumpCart],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore precisa estar dentro de <StoreProvider>");
  return v;
}

/** Atraso mínimo para exibir skeletons de forma suave (evita "piscar"). */
export function useMinDelay(ms = 320, key?: unknown) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const t = setTimeout(() => setReady(true), ms);
    return () => clearTimeout(t);
  }, [ms, key]);
  return ready;
}

/** Relógio que atualiza periodicamente (tempo decorrido dos pedidos). */
export function useNow(interval = 15000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(t);
  }, [interval]);
  return now;
}
