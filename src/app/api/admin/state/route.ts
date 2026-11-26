import { requireSession } from "@/lib/server/auth";
import { assertStorage, handleError, json } from "@/lib/server/http";
import { adminState, getRev, loadState } from "@/lib/server/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Estado completo do painel. `?rev=N` evita baixar tudo quando nada mudou. */
export async function GET(req: Request) {
  try {
    assertStorage();
    const session = await requireSession();
    const since = Number(new URL(req.url).searchParams.get("rev") ?? NaN);
    const rev = await getRev();
    if (Number.isFinite(since) && since === rev && rev > 0) return json({ rev, unchanged: true });

    const state = await loadState();
    return json({
      rev: await getRev(),
      state: adminState(state),
      session: { name: session.name, login: session.login, role: session.role },
    });
  } catch (e) {
    return handleError(e);
  }
}
