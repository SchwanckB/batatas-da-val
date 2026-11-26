import { findExtra, findNeighborhood, SIZES } from "./data";
import { money, waLink } from "./format";
import type { Extra, Neighborhood, Order } from "./types";

const PAY: Record<Order["payment"], string> = {
  pix: "Pix",
  cartao: "Cartão na entrega",
  dinheiro: "Dinheiro",
};
export const paymentLabel = (p: Order["payment"]) => PAY[p];

export interface WhatsContext {
  extras: Extra[];
  neighborhoods: Neighborhood[];
  whatsapp: string;
  storeName: string;
}

/** Resumo do pedido pronto para colar no WhatsApp da loja. */
export function orderSummary(o: Order, ctx: WhatsContext): string {
  const nb = findNeighborhood(ctx.neighborhoods, o.neighborhoodId);
  const lines = [
    `*Pedido #${o.id} — ${ctx.storeName}*`,
    "",
    ...o.items.map((i) => {
      const size = i.size ? ` (${SIZES.find((s) => s.id === i.size)?.label})` : "";
      const ex = i.extras.length
        ? `\n   + ${i.extras.map((e) => findExtra(ctx.extras, e)?.name ?? e).join(", ")}`
        : "";
      const obs = i.notes ? `\n   _Obs: ${i.notes}_` : "";
      return `${i.qty}x ${i.name}${size} — ${money(i.unitPrice * i.qty)}${ex}${obs}`;
    }),
    "",
    `Subtotal: ${money(o.subtotal)}`,
    `Entrega (${nb?.name ?? "a combinar"}): ${o.deliveryFee ? money(o.deliveryFee) : "sem taxa"}`,
    ...(o.discount ? [`Desconto${o.couponCode ? ` ${o.couponCode}` : ""}: -${money(o.discount)}`] : []),
    `*Total: ${money(o.total)}*`,
    "",
    `Cliente: ${o.customer.name} — ${o.customer.phone}`,
    nb?.pickup ? "Retirada no local" : `Endereço: ${o.customer.address}`,
    `Pagamento: ${PAY[o.payment]}${o.payment === "dinheiro" && o.changeFor ? ` (troco para ${money(o.changeFor)})` : ""}`,
  ];
  return lines.join("\n");
}

export const whatsappLink = (o: Order, ctx: WhatsContext) => waLink(ctx.whatsapp, orderSummary(o, ctx));
