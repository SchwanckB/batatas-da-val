import { createSeed, orderConsumption } from "./data";
import type {
  CashEntry,
  Coupon,
  Extra,
  Ingredient,
  Neighborhood,
  Order,
  OrderStatus,
  Product,
  Role,
  Section,
  SharedState,
  StoreSettings,
} from "./types";

export const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  novo: "preparo",
  preparo: "entrega",
  entrega: "concluido",
  concluido: null,
  cancelado: null,
};

/**
 * Toda alteração do estado passa por aqui. O mesmo reducer roda no navegador
 * (resposta imediata) e no servidor (fonte da verdade), então ele precisa ser
 * puro: ids e horários de novas entidades vêm no payload ou no contexto.
 */
export type Action =
  | { type: "order:advance"; id: number }
  | { type: "order:cancel"; id: number; reason: string }
  | { type: "cash:entry"; id: string; kind: CashEntry["type"]; description: string; amount: number }
  | { type: "cash:delete"; id: string }
  | { type: "shift:open"; id: string; openingFloat: number }
  | { type: "shift:close"; counted: number; note: string }
  | { type: "stock:adjust"; id: string; delta: number }
  | { type: "stock:save"; ingredient: Ingredient }
  | { type: "stock:delete"; id: string }
  | { type: "product:save"; product: Product }
  | { type: "product:delete"; id: string }
  | { type: "section:save"; section: Section }
  | { type: "section:delete"; id: string }
  | { type: "section:move"; id: string; dir: -1 | 1 }
  | { type: "extra:save"; extra: Extra }
  | { type: "extra:delete"; id: string }
  | { type: "nb:save"; neighborhood: Neighborhood }
  | { type: "nb:delete"; id: string }
  | { type: "coupon:save"; coupon: Coupon }
  | { type: "coupon:delete"; id: string }
  | { type: "settings:save"; settings: StoreSettings }
  | { type: "user:delete"; id: string }
  | { type: "demo:reset" };

export interface ActionContext {
  now: number;
  /** Nome de quem fez a alteração (vai para o histórico). */
  actor: string;
}

/* ------------------------------------------------------------------ *
 * Papéis
 * ------------------------------------------------------------------ */

const KITCHEN = new Set<Action["type"]>(["order:advance", "order:cancel", "stock:adjust", "product:save"]);
const CASHIER = new Set<Action["type"]>([
  "order:advance",
  "order:cancel",
  "cash:entry",
  "cash:delete",
  "shift:open",
  "shift:close",
  "stock:adjust",
]);

export function canDo(role: Role, type: Action["type"]): boolean {
  if (role === "dono") return true;
  if (role === "cozinha") return KITCHEN.has(type);
  return CASHIER.has(type);
}

export const ROLE_LABEL: Record<Role, string> = {
  dono: "Dono (acesso total)",
  cozinha: "Cozinha (pedidos e estoque)",
  caixa: "Caixa (pedidos e caixa)",
};

/* ------------------------------------------------------------------ *
 * Reducer
 * ------------------------------------------------------------------ */

const round2 = (v: number) => Math.round(v * 100) / 100;

function logged(state: SharedState, ctx: ActionContext, summary: string): SharedState {
  return {
    ...state,
    audit: [
      { id: `${ctx.now}-${state.audit.length}`, at: ctx.now, actor: ctx.actor, summary },
      ...state.audit,
    ].slice(0, 400),
  };
}

const touch = (o: Order, status: OrderStatus, now: number): Order => ({
  ...o,
  status,
  updatedAt: now,
  history: [...o.history, { status, at: now }],
});

/** Aplica (ou devolve o estado intacto quando a ação não faz sentido). */
export function applyAction(state: SharedState, action: Action, ctx: ActionContext): SharedState {
  const { now } = ctx;

  switch (action.type) {
    case "order:advance": {
      const o = state.orders.find((x) => x.id === action.id);
      const next = o ? NEXT_STATUS[o.status] : null;
      if (!o || !next) return state;

      let stock = state.stock;
      let deducted = o.stockDeducted;
      // Baixa de insumos ao entrar em preparo (ou ao concluir, se ainda não baixou)
      if (!deducted && (next === "preparo" || next === "concluido")) {
        const use = orderConsumption(o, state.products, state.extras);
        stock = stock.map((i) => (use[i.id] ? { ...i, qty: Math.max(0, round2(i.qty - use[i.id])) } : i));
        deducted = true;
      }
      return {
        ...state,
        stock,
        orders: state.orders.map((x) =>
          x.id === action.id ? { ...touch(x, next, now), stockDeducted: deducted } : x,
        ),
      };
    }

    case "order:cancel": {
      const o = state.orders.find((x) => x.id === action.id);
      if (!o || o.status === "cancelado") return state;

      // Devolve ao estoque o que já havia sido baixado
      let stock = state.stock;
      if (o.stockDeducted) {
        const use = orderConsumption(o, state.products, state.extras);
        stock = stock.map((i) => (use[i.id] ? { ...i, qty: round2(i.qty + use[i.id]) } : i));
      }
      // Libera o uso do cupom
      const coupons = o.couponCode
        ? state.coupons.map((c) => (c.code === o.couponCode ? { ...c, uses: Math.max(0, c.uses - 1) } : c))
        : state.coupons;

      const next: SharedState = {
        ...state,
        stock,
        coupons,
        orders: state.orders.map((x) =>
          x.id === action.id
            ? { ...touch(x, "cancelado", now), stockDeducted: false, cancelReason: action.reason.slice(0, 160) }
            : x,
        ),
      };
      return logged(next, ctx, `Cancelou o pedido #${o.id}: ${action.reason.slice(0, 80)}`);
    }

    case "cash:entry": {
      if (!(action.amount > 0)) return state;
      const entry: CashEntry = {
        id: action.id,
        type: action.kind,
        description: action.description.slice(0, 80),
        amount: round2(action.amount),
        at: now,
        by: ctx.actor,
      };
      return { ...state, cash: [...state.cash, entry] };
    }

    case "cash:delete":
      return { ...state, cash: state.cash.filter((c) => c.id !== action.id) };

    case "shift:open": {
      const open = state.shifts.find((s) => !s.closedAt);
      if (open) return state;
      return {
        ...state,
        shifts: [
          ...state.shifts,
          { id: action.id, openedAt: now, openedBy: ctx.actor, openingFloat: round2(action.openingFloat) },
        ],
      };
    }

    case "shift:close": {
      const open = state.shifts.find((s) => !s.closedAt);
      if (!open) return state;
      const next: SharedState = {
        ...state,
        shifts: state.shifts.map((s) =>
          s.id === open.id
            ? { ...s, closedAt: now, closedBy: ctx.actor, counted: round2(action.counted), note: action.note.slice(0, 160) }
            : s,
        ),
      };
      return logged(next, ctx, `Fechou o caixa do turno (contado R$ ${action.counted.toFixed(2)})`);
    }

    case "stock:adjust": {
      const i = state.stock.find((x) => x.id === action.id);
      if (!i) return state;
      const next: SharedState = {
        ...state,
        stock: state.stock.map((x) =>
          x.id === action.id ? { ...x, qty: Math.max(0, round2(x.qty + action.delta)) } : x,
        ),
      };
      return action.delta > 0 ? logged(next, ctx, `Repôs ${action.delta} ${i.unit} de ${i.name}`) : next;
    }

    case "stock:save": {
      const exists = state.stock.some((x) => x.id === action.ingredient.id);
      const next: SharedState = {
        ...state,
        stock: exists
          ? state.stock.map((x) => (x.id === action.ingredient.id ? action.ingredient : x))
          : [...state.stock, action.ingredient],
      };
      return logged(next, ctx, `${exists ? "Editou" : "Criou"} o insumo ${action.ingredient.name}`);
    }

    case "stock:delete":
      return { ...state, stock: state.stock.filter((x) => x.id !== action.id) };

    case "product:save": {
      const before = state.products.find((x) => x.id === action.product.id);
      const next: SharedState = {
        ...state,
        products: before
          ? state.products.map((x) => (x.id === action.product.id ? action.product : x))
          : [...state.products, action.product],
      };
      const changes: string[] = [];
      if (!before) changes.push("criou");
      else {
        if (before.price !== action.product.price || before.priceGigante !== action.product.priceGigante)
          changes.push(`preço ${before.price} → ${action.product.price}`);
        if (before.available !== action.product.available)
          changes.push(action.product.available ? "voltou a vender" : "marcou como esgotado");
        if (before.name !== action.product.name) changes.push("renomeou");
      }
      return changes.length ? logged(next, ctx, `${action.product.name}: ${changes.join(", ")}`) : next;
    }

    case "product:delete": {
      const p = state.products.find((x) => x.id === action.id);
      const next = { ...state, products: state.products.filter((x) => x.id !== action.id) };
      return p ? logged(next, ctx, `Excluiu o produto ${p.name}`) : next;
    }

    case "section:save": {
      const exists = state.sections.some((x) => x.id === action.section.id);
      return {
        ...state,
        sections: exists
          ? state.sections.map((x) => (x.id === action.section.id ? action.section : x))
          : [
              ...state.sections,
              { ...action.section, order: Math.max(-1, ...state.sections.map((x) => x.order)) + 1 },
            ],
      };
    }

    case "section:delete":
      // Só remove seções vazias (evita sumir com produtos sem querer)
      if (state.products.some((p) => p.category === action.id)) return state;
      return { ...state, sections: state.sections.filter((x) => x.id !== action.id) };

    case "section:move": {
      const list = [...state.sections].sort((a, b) => a.order - b.order);
      const i = list.findIndex((x) => x.id === action.id);
      const j = i + action.dir;
      if (i < 0 || j < 0 || j >= list.length) return state;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...state, sections: list.map((x, order) => ({ ...x, order })) };
    }

    case "extra:save": {
      const exists = state.extras.some((x) => x.id === action.extra.id);
      const next: SharedState = {
        ...state,
        extras: exists
          ? state.extras.map((x) => (x.id === action.extra.id ? action.extra : x))
          : [...state.extras, action.extra],
      };
      return logged(next, ctx, `${exists ? "Editou" : "Criou"} o adicional ${action.extra.name}`);
    }

    case "extra:delete":
      return { ...state, extras: state.extras.filter((x) => x.id !== action.id) };

    case "nb:save": {
      const exists = state.neighborhoods.some((x) => x.id === action.neighborhood.id);
      const next: SharedState = {
        ...state,
        neighborhoods: exists
          ? state.neighborhoods.map((x) => (x.id === action.neighborhood.id ? action.neighborhood : x))
          : [
              ...state.neighborhoods,
              { ...action.neighborhood, order: Math.max(-1, ...state.neighborhoods.map((x) => x.order)) + 1 },
            ],
      };
      return logged(
        next,
        ctx,
        `${exists ? "Editou" : "Criou"} a área de entrega ${action.neighborhood.name} (frete R$ ${action.neighborhood.fee})`,
      );
    }

    case "nb:delete":
      // Mantém a área se existe pedido apontando para ela (histórico ficaria órfão)
      if (state.orders.some((o) => o.neighborhoodId === action.id))
        return {
          ...state,
          neighborhoods: state.neighborhoods.map((x) => (x.id === action.id ? { ...x, active: false } : x)),
        };
      return { ...state, neighborhoods: state.neighborhoods.filter((x) => x.id !== action.id) };

    case "coupon:save": {
      const exists = state.coupons.some((x) => x.id === action.coupon.id);
      const next: SharedState = {
        ...state,
        coupons: exists
          ? state.coupons.map((x) => (x.id === action.coupon.id ? action.coupon : x))
          : [...state.coupons, action.coupon],
      };
      return logged(next, ctx, `${exists ? "Editou" : "Criou"} o cupom ${action.coupon.code}`);
    }

    case "coupon:delete":
      return { ...state, coupons: state.coupons.filter((x) => x.id !== action.id) };

    case "settings:save": {
      const before = state.settings;
      const s = action.settings;
      const changes: string[] = [];
      if (before.paused !== s.paused) changes.push(s.paused ? "pausou os pedidos" : "voltou a aceitar pedidos");
      if (JSON.stringify(before.hours) !== JSON.stringify(s.hours)) changes.push("mudou os horários");
      if (before.minOrder !== s.minOrder) changes.push(`pedido mínimo R$ ${s.minOrder}`);
      if (before.pixKey !== s.pixKey) changes.push("mudou a chave Pix");
      const next = { ...state, settings: s };
      return changes.length ? logged(next, ctx, `Loja: ${changes.join(", ")}`) : next;
    }

    case "user:delete": {
      const u = state.users.find((x) => x.id === action.id);
      // Nunca deixa o painel sem nenhum dono
      if (u?.role === "dono" && state.users.filter((x) => x.role === "dono").length <= 1) return state;
      const next = { ...state, users: state.users.filter((x) => x.id !== action.id) };
      return u ? logged(next, ctx, `Removeu o acesso de ${u.name}`) : next;
    }

    case "demo:reset": {
      // Preserva usuários e configurações: o resto volta ao exemplo
      const seed = createSeed();
      return { ...seed, users: state.users, settings: state.settings };
    }

    default:
      return state;
  }
}
