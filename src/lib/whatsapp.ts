import { extraById, neighborhoodById, SIZES } from "./data";
import { money, STORE } from "./format";
import type { Order } from "./types";

const PAY: Record<Order["payment"], string> = { pix: "Pix", cartao: "Cartão na entrega", dinheiro: "Dinheiro" };
export const paymentLabel = (p: Order["payment"]) => PAY[p];

export function whatsappLink(o: Order) {
  const nb = neighborhoodById(o.neighborhoodId);
  const lines = [
    `*Pedido #${o.id} — Batatas da Val* 🍟`,
    "",
    ...o.items.map((i) => {
      const size = i.size ? ` (${SIZES.find((s) => s.id === i.size)?.label})` : "";
      const ex = i.extras.length ? `\n   + ${i.extras.map((e) => extraById(e)?.name).join(", ")}` : "";
      const obs = i.notes ? `\n   _Obs: ${i.notes}_` : "";
      return `• ${i.qty}x ${i.name}${size} — ${money(i.unitPrice * i.qty)}${ex}${obs}`;
    }),
    "",
    `Subtotal: ${money(o.subtotal)}`,
    `Entrega (${nb?.name}): ${o.deliveryFee ? money(o.deliveryFee) : "Grátis"}`,
    `*Total: ${money(o.total)}*`,
    "",
    `👤 ${o.customer.name} — ${o.customer.phone}`,
    nb?.pickup ? "🏪 Retirada no local" : `📍 ${o.customer.address}`,
    `💳 ${PAY[o.payment]}${o.payment === "dinheiro" && o.changeFor ? ` (troco para ${money(o.changeFor)})` : ""}`,
  ];
  return `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`;
}
