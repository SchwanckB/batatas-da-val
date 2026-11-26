"use client";

import { SIZES, findExtra, findNeighborhood } from "@/lib/data";
import { dateTimeFmt, money } from "@/lib/format";
import { useAdmin } from "@/lib/adminStore";
import type { Order } from "@/lib/types";
import { paymentLabel } from "@/lib/whatsapp";

/**
 * Comanda para impressora térmica de 80mm. Fica fora da tela e só aparece
 * no papel (ver regras `@media print` em globals.css).
 */
export function Comanda({ order }: { order: Order | null }) {
  const { state } = useAdmin();
  if (!order) return null;

  const nb = findNeighborhood(state.neighborhoods, order.neighborhoodId);
  const { settings } = state;

  return (
    <div className="comanda fixed -left-[9999px] top-0" aria-hidden>
      <div style={{ textAlign: "center", fontWeight: 700 }}>
        {settings.name.toUpperCase()}
        <br />
        {settings.phone}
      </div>
      <div className="corte" style={{ margin: "6px 0" }} />
      <div>
        PEDIDO #{order.id}
        <br />
        {dateTimeFmt(order.createdAt)}
      </div>
      <div className="corte" style={{ margin: "6px 0" }} />
      <div>
        {order.customer.name}
        <br />
        {order.customer.phone}
        <br />
        {nb?.pickup ? "RETIRADA NO LOCAL" : `${nb?.name ?? ""} - ${order.customer.address}`}
      </div>
      <div className="corte" style={{ margin: "6px 0" }} />

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {order.items.map((i) => (
            <tr key={i.uid}>
              <td style={{ verticalAlign: "top", paddingBottom: 4 }}>
                <b>
                  {i.qty}x {i.name}
                </b>
                {i.size && <> ({SIZES.find((s) => s.id === i.size)?.label})</>}
                {i.extras.length > 0 && (
                  <>
                    <br />+ {i.extras.map((e) => findExtra(state.extras, e)?.name ?? e).join(", ")}
                  </>
                )}
                {i.notes && (
                  <>
                    <br />
                    ** {i.notes.toUpperCase()}
                  </>
                )}
              </td>
              <td style={{ verticalAlign: "top", textAlign: "right", whiteSpace: "nowrap", paddingBottom: 4 }}>
                {money(i.unitPrice * i.qty)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="corte" style={{ margin: "6px 0" }} />
      <table style={{ width: "100%" }}>
        <tbody>
          <tr>
            <td>Subtotal</td>
            <td style={{ textAlign: "right" }}>{money(order.subtotal)}</td>
          </tr>
          <tr>
            <td>Entrega</td>
            <td style={{ textAlign: "right" }}>{order.deliveryFee ? money(order.deliveryFee) : "-"}</td>
          </tr>
          {order.discount > 0 && (
            <tr>
              <td>Desconto {order.couponCode}</td>
              <td style={{ textAlign: "right" }}>-{money(order.discount)}</td>
            </tr>
          )}
          <tr style={{ fontWeight: 700, fontSize: "13pt" }}>
            <td>TOTAL</td>
            <td style={{ textAlign: "right" }}>{money(order.total)}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 6 }}>
        {paymentLabel(order.payment).toUpperCase()}
        {order.payment === "dinheiro" && order.changeFor ? ` - TROCO P/ ${money(order.changeFor)}` : ""}
      </div>
      <div className="corte" style={{ margin: "8px 0 4px" }} />
      <div style={{ textAlign: "center" }}>Obrigado! Bom apetite.</div>
    </div>
  );
}
