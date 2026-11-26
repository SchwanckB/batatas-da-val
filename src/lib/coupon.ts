import type { Coupon } from "./types";

export const normalizeCode = (code: string) =>
  code
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 20);

export const findCoupon = (coupons: Coupon[], code: string) => {
  const c = normalizeCode(code);
  return c ? coupons.find((x) => normalizeCode(x.code) === c) : undefined;
};

/** Valor do desconto em reais (nunca maior que o subtotal). */
export function discountFor(coupon: Coupon, subtotal: number): number {
  const raw = coupon.kind === "percent" ? (subtotal * coupon.value) / 100 : coupon.value;
  return Math.min(subtotal, Math.round(Math.max(0, raw) * 100) / 100);
}

/** `null` quando o cupom pode ser usado; mensagem em pt-BR quando não. */
export function couponError(
  coupon: Coupon | undefined,
  subtotal: number,
  at: number = Date.now(),
): string | null {
  if (!coupon || !coupon.active) return "Cupom não encontrado.";
  if (coupon.expiresAt && coupon.expiresAt < at) return "Este cupom venceu.";
  if (coupon.maxUses > 0 && coupon.uses >= coupon.maxUses) return "Este cupom já atingiu o limite de usos.";
  if (coupon.minOrder > 0 && subtotal < coupon.minOrder)
    return `Válido em pedidos a partir de R$ ${coupon.minOrder.toFixed(2).replace(".", ",")}.`;
  return null;
}

export const couponLabel = (c: Pick<Coupon, "kind" | "value">) =>
  c.kind === "percent" ? `${c.value}% de desconto` : `R$ ${c.value.toFixed(2).replace(".", ",")} de desconto`;
