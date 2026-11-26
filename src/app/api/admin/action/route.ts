import { applyAction, canDo } from "@/lib/actions";
import { requireSession } from "@/lib/server/auth";
import { assertStorage, fail, handleError, json } from "@/lib/server/http";
import { actionSchema } from "@/lib/server/schemas";
import { adminState, mutate } from "@/lib/server/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Executa uma ação do painel. O servidor é quem decide o resultado. */
export async function POST(req: Request) {
  try {
    assertStorage();
    const session = await requireSession();

    const parsed = actionSchema.safeParse(await req.json());
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return fail(`Dados inválidos${issue?.path.length ? ` em "${issue.path.join(".")}"` : ""}: ${issue?.message ?? ""}`);
    }
    const action = parsed.data;

    if (!canDo(session.role, action.type))
      return fail("Seu perfil não tem permissão para esta ação.", 403);

    const { state, rev } = await mutate((current) => ({
      state: applyAction(current, action, { now: Date.now(), actor: session.name }),
      result: null,
    }));

    return json({ rev, state: adminState(state) });
  } catch (e) {
    return handleError(e);
  }
}
