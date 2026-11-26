import { assertStorage, handleError, json } from "@/lib/server/http";
import { getRev, loadState, publicState } from "@/lib/server/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cardápio e dados públicos da loja.
 * `?rev=N` devolve só `{ rev }` quando nada mudou — é o que o cliente usa para
 * ficar ao vivo sem baixar o cardápio inteiro a cada checagem.
 */
export async function GET(req: Request) {
  try {
    assertStorage();
    const since = Number(new URL(req.url).searchParams.get("rev") ?? NaN);
    const rev = await getRev();
    if (Number.isFinite(since) && since === rev && rev > 0) return json({ rev, unchanged: true });

    const state = await loadState();
    return json(publicState(state, await getRev()));
  } catch (e) {
    return handleError(e);
  }
}
