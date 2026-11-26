import { findNeighborhood } from "@/lib/data";
import { assertStorage, fail, handleError, json } from "@/lib/server/http";
import { getRev, loadState } from "@/lib/server/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Acompanhamento público pelo token do pedido (nunca pelo número sequencial). */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    assertStorage();
    const { token } = await params;
    const since = Number(new URL(req.url).searchParams.get("rev") ?? NaN);
    const rev = await getRev();
    if (Number.isFinite(since) && since === rev && rev > 0) return json({ rev, unchanged: true });

    const state = await loadState();
    const order = state.orders.find((o) => o.token === token);
    if (!order) return fail("Pedido não encontrado.", 404);

    const nb = findNeighborhood(state.neighborhoods, order.neighborhoodId);
    return json({
      rev,
      order,
      neighborhood: nb ?? null,
      store: {
        name: state.settings.name,
        phone: state.settings.phone,
        whatsapp: state.settings.whatsapp,
        prepMinutes: state.settings.prepMinutes,
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
