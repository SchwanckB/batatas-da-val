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
import { applyAction, canDo, type Action } from "./actions";
import { createSeed } from "./data";
import { usePolling } from "./hooks";
import { uid } from "./format";
import type { Role, SharedState } from "./types";

export interface AdminSession {
  name: string;
  login: string;
  role: Role;
}

const emptyState: SharedState = { ...createSeed(), orders: [], products: [], sections: [], audit: [] };

interface AdminValue {
  hydrated: boolean;
  /** Última leitura falhou (sem rede / Redis fora). */
  offline: boolean;
  saving: boolean;
  state: SharedState;
  session: AdminSession;
  can: (type: Action["type"]) => boolean;
  dispatch: (action: Action) => Promise<string | null>;
  refresh: () => Promise<void>;
  saveUser: (data: {
    id?: string;
    name: string;
    login: string;
    role: Role;
    password?: string;
  }) => Promise<string | null>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AdminValue | null>(null);

export function AdminProvider({ session, children }: { session: AdminSession; children: ReactNode }) {
  const [state, setState] = useState<SharedState>(emptyState);
  const [hydrated, setHydrated] = useState(false);
  const [offline, setOffline] = useState(false);
  const [saving, setSaving] = useState(false);
  const revRef = useRef(0);
  const pending = useRef(0);

  const refresh = useCallback(async () => {
    // Enquanto uma gravação está em voo, a resposta dela é mais nova que o polling.
    if (pending.current > 0) return;
    try {
      const res = await fetch(`/api/admin/state?rev=${revRef.current}`, { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as
        | { rev: number; unchanged: true }
        | { rev: number; state: SharedState };
      setOffline(false);
      revRef.current = data.rev;
      if (!("unchanged" in data)) setState(data.state);
    } catch {
      setOffline(true);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  usePolling(refresh, 5000);

  const can = useCallback((type: Action["type"]) => canDo(session.role, type), [session.role]);

  /**
   * Aplica a ação na hora (resposta imediata no painel) e manda para o servidor.
   * A resposta do servidor é a verdade: ela substitui o estado local.
   */
  const dispatch = useCallback(
    async (action: Action) => {
      if (!canDo(session.role, action.type)) return "Seu perfil não tem permissão para esta ação.";

      const before = state;
      setState((current) => applyAction(current, action, { now: Date.now(), actor: session.name }));
      setSaving(true);
      pending.current++;
      try {
        const res = await fetch("/api/admin/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action),
        });
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return "Sessão expirada.";
        }
        const data = (await res.json()) as { rev?: number; state?: SharedState; error?: string };
        if (!res.ok || !data.state) {
          setState(before);
          return data.error ?? "Não foi possível salvar.";
        }
        revRef.current = data.rev ?? revRef.current;
        setState(data.state);
        setOffline(false);
        return null;
      } catch {
        setState(before);
        setOffline(true);
        return "Sem conexão: a alteração não foi salva.";
      } finally {
        pending.current--;
        setSaving(false);
      }
    },
    [session.role, session.name, state],
  );

  const saveUser = useCallback(
    async (data: { id?: string; name: string; login: string; role: Role; password?: string }) => {
      setSaving(true);
      pending.current++;
      try {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const body = (await res.json()) as { rev?: number; state?: SharedState; error?: string };
        if (!res.ok || !body.state) return body.error ?? "Não foi possível salvar o acesso.";
        revRef.current = body.rev ?? revRef.current;
        setState(body.state);
        return null;
      } catch {
        return "Sem conexão: o acesso não foi salvo.";
      } finally {
        pending.current--;
        setSaving(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/admin/login";
    }
  }, []);

  const value = useMemo<AdminValue>(
    () => ({ hydrated, offline, saving, state, session, can, dispatch, refresh, saveUser, logout }),
    [hydrated, offline, saving, state, session, can, dispatch, refresh, saveUser, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdmin() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAdmin precisa estar dentro de <AdminProvider>");
  return v;
}

/** Turno de caixa aberto (ou undefined). */
export const openShift = (state: SharedState) => state.shifts.find((s) => !s.closedAt);

/**
 * Atalhos para as ações mais usadas do painel. Cada um devolve a mensagem de
 * erro (ou null), já que a gravação acontece no servidor.
 */
export function useAdminActions() {
  const { dispatch } = useAdmin();
  return useMemo(
    () => ({
      advanceOrder: (id: number) => dispatch({ type: "order:advance", id }),
      cancelOrder: (id: number, reason: string) => dispatch({ type: "order:cancel", id, reason }),
      saveProduct: (product: SharedState["products"][number]) => dispatch({ type: "product:save", product }),
      deleteProduct: (id: string) => dispatch({ type: "product:delete", id }),
      saveSection: (section: SharedState["sections"][number]) => dispatch({ type: "section:save", section }),
      deleteSection: (id: string) => dispatch({ type: "section:delete", id }),
      moveSection: (id: string, dir: -1 | 1) => dispatch({ type: "section:move", id, dir }),
      saveExtra: (extra: SharedState["extras"][number]) => dispatch({ type: "extra:save", extra }),
      deleteExtra: (id: string) => dispatch({ type: "extra:delete", id }),
      saveNeighborhood: (neighborhood: SharedState["neighborhoods"][number]) =>
        dispatch({ type: "nb:save", neighborhood }),
      deleteNeighborhood: (id: string) => dispatch({ type: "nb:delete", id }),
      saveCoupon: (coupon: SharedState["coupons"][number]) => dispatch({ type: "coupon:save", coupon }),
      deleteCoupon: (id: string) => dispatch({ type: "coupon:delete", id }),
      saveSettings: (settings: SharedState["settings"]) => dispatch({ type: "settings:save", settings }),
      adjustStock: (id: string, delta: number) => dispatch({ type: "stock:adjust", id, delta }),
      saveIngredient: (ingredient: SharedState["stock"][number]) => dispatch({ type: "stock:save", ingredient }),
      deleteIngredient: (id: string) => dispatch({ type: "stock:delete", id }),
      addCashEntry: (kind: "reforco" | "sangria", description: string, amount: number) =>
        dispatch({ type: "cash:entry", id: uid(), kind, description, amount }),
      deleteCashEntry: (id: string) => dispatch({ type: "cash:delete", id }),
      openShift: (openingFloat: number) => dispatch({ type: "shift:open", id: uid(), openingFloat }),
      closeShift: (counted: number, note: string) => dispatch({ type: "shift:close", counted, note }),
      deleteUser: (id: string) => dispatch({ type: "user:delete", id }),
      resetDemo: () => dispatch({ type: "demo:reset" }),
    }),
    [dispatch],
  );
}
