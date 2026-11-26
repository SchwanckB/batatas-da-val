import QRCode from "qrcode";
import { pixPayload } from "@/lib/pix";
import { assertStorage, fail, handleError, json } from "@/lib/server/http";
import { loadState } from "@/lib/server/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** "Copia e cola" + QR Code do Pix, gerados a partir da chave cadastrada no painel. */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    assertStorage();
    const { token } = await params;
    const state = await loadState();
    const order = state.orders.find((o) => o.token === token);
    if (!order) return fail("Pedido não encontrado.", 404);
    if (order.payment !== "pix") return fail("Este pedido não é pago com Pix.", 400);

    const { pixKey, pixName, pixCity } = state.settings;
    if (!pixKey) return fail("A loja ainda não cadastrou a chave Pix.", 409);

    const payload = pixPayload({
      key: pixKey,
      name: pixName || state.settings.name,
      city: pixCity || "BRASIL",
      amount: order.total,
      txid: `BDV${order.id}`,
    });

    const svg = await QRCode.toString(payload, {
      type: "svg",
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#151210", light: "#FFFFFF" },
    });

    return json({ payload, svg, total: order.total, key: pixKey, name: pixName || state.settings.name });
  } catch (e) {
    return handleError(e);
  }
}
