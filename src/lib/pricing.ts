import { findExtra, findNeighborhood, findProduct, unitPriceFor } from "./data";
import { couponError, findCoupon } from "./coupon";
import type { CartItem, Coupon, SharedState, SizeId } from "./types";

/** Item como o navegador envia: sem preço (o servidor é quem calcula). */
export interface RawItem {
  productId: string;
  size?: SizeId;
  extras: string[];
  notes: string;
  qty: number;
}

export interface QuoteInput {
  items: RawItem[];
  neighborhoodId: string;
  couponCode?: string;
}

export type Catalog = Pick<
  SharedState,
  "products" | "extras" | "neighborhoods" | "coupons" | "settings" | "sections"
>;

export interface Quote {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  coupon?: Coupon;
}

export type QuoteResult = { ok: true; quote: Quote } | { ok: false; error: string };

const cents = (v: number) => Math.round(v * 100) / 100;
const MAX_QTY = 20;
const MAX_NOTES = 180;

/**
 * Recalcula um pedido a partir do catálogo atual. Nunca confie no preço do navegador:
 * esta é a única fonte de verdade de valores, frete e desconto.
 */
export function quoteOrder(catalog: Catalog, input: QuoteInput): QuoteResult {
  if (!Array.isArray(input.items) || input.items.length === 0) return { ok: false, error: "Sacola vazia." };
  if (input.items.length > 40) return { ok: false, error: "Pedido muito grande. Fale com a gente pelo WhatsApp." };

  const nb = findNeighborhood(catalog.neighborhoods, input.neighborhoodId);
  if (!nb || !nb.active) return { ok: false, error: "Escolha um bairro de entrega válido." };

  const items: CartItem[] = [];
  for (const raw of input.items) {
    const p = findProduct(catalog.products, raw.productId);
    if (!p) return { ok: false, error: "Um dos itens saiu do cardápio. Revise sua sacola." };
    if (!p.available) return { ok: false, error: `${p.name} está esgotado agora.` };

    const section = catalog.sections.find((s) => s.id === p.category);
    if (section && !section.active) return { ok: false, error: `${p.name} não está disponível agora.` };

    const qty = Math.floor(Number(raw.qty));
    if (!Number.isFinite(qty) || qty < 1 || qty > MAX_QTY)
      return { ok: false, error: "Quantidade inválida em um dos itens." };

    const size: SizeId | undefined = p.priceGigante ? (raw.size === "gigante" ? "gigante" : "media") : undefined;

    const extras = Array.from(new Set(raw.extras ?? []));
    if (extras.length && !p.allowsExtras) return { ok: false, error: `${p.name} não aceita adicionais.` };
    for (const id of extras) {
      const e = findExtra(catalog.extras, id);
      if (!e || !e.active) return { ok: false, error: "Um dos adicionais não está mais disponível." };
    }

    items.push({
      uid: `${p.id}-${items.length}-${Math.random().toString(36).slice(2, 7)}`,
      productId: p.id,
      name: p.name,
      size,
      extras,
      notes: String(raw.notes ?? "").trim().slice(0, MAX_NOTES),
      qty,
      unitPrice: unitPriceFor(p, size, extras, catalog.extras),
    });
  }

  const subtotal = cents(items.reduce((s, i) => s + i.unitPrice * i.qty, 0));
  const { minOrder } = catalog.settings;
  if (minOrder > 0 && subtotal < minOrder)
    return { ok: false, error: `O pedido mínimo é de R$ ${minOrder.toFixed(2).replace(".", ",")} (sem a entrega).` };

  const deliveryFee = cents(nb.fee);

  let discount = 0;
  let coupon: Coupon | undefined;
  const code = input.couponCode?.trim();
  if (code) {
    coupon = findCoupon(catalog.coupons, code);
    const err = couponError(coupon, subtotal);
    if (err) return { ok: false, error: err };
    discount = coupon!.kind === "percent" ? cents((subtotal * coupon!.value) / 100) : cents(coupon!.value);
    discount = Math.min(discount, subtotal);
  }

  return {
    ok: true,
    quote: { items, subtotal, deliveryFee, discount, total: cents(subtotal + deliveryFee - discount), coupon },
  };
}
