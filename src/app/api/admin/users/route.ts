import { uid } from "@/lib/format";
import { makeUser, requireSession, safeUsers } from "@/lib/server/auth";
import { assertStorage, fail, handleError, json } from "@/lib/server/http";
import { userSchema } from "@/lib/server/schemas";
import { adminState, mutate } from "@/lib/server/state";
import type { User } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Cria ou edita um acesso ao painel (só o dono). A senha nunca sai daqui. */
export async function POST(req: Request) {
  try {
    assertStorage();
    const session = await requireSession();
    if (session.role !== "dono") return fail("Só o dono pode gerenciar acessos.", 403);

    const parsed = userSchema.safeParse(await req.json());
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
    const data = parsed.data;

    const { state, rev, result } = await mutate<string | null>(async (current) => {
      const existing = data.id ? current.users.find((u) => u.id === data.id) : undefined;
      if (data.id && !existing) return { state: current, result: "Acesso não encontrado." };

      const login = data.login.trim().toLowerCase();
      if (current.users.some((u) => u.login === login && u.id !== existing?.id))
        return { state: current, result: "Já existe um acesso com este usuário." };

      if (!existing && !data.password) return { state: current, result: "Defina uma senha para o novo acesso." };

      // Rebaixar o último dono trancaria o painel para sempre.
      if (
        existing?.role === "dono" &&
        data.role !== "dono" &&
        current.users.filter((u) => u.role === "dono").length <= 1
      )
        return { state: current, result: "A loja precisa de pelo menos um dono." };

      let user: User;
      if (data.password) {
        user = await makeUser(
          { name: data.name, login, role: data.role, password: data.password },
          existing?.id ?? uid(),
        );
        if (existing) user.createdAt = existing.createdAt;
      } else {
        user = { ...existing!, name: data.name.trim(), login, role: data.role };
      }

      return {
        state: {
          ...current,
          users: existing ? current.users.map((u) => (u.id === user.id ? user : u)) : [...current.users, user],
          audit: [
            {
              id: `${Date.now()}-${current.audit.length}`,
              at: Date.now(),
              actor: session.name,
              summary: `${existing ? "Editou" : "Criou"} o acesso de ${user.name} (${user.role})`,
            },
            ...current.audit,
          ].slice(0, 400),
        },
        result: null,
      };
    });

    if (result) return fail(result);
    return json({ rev, state: adminState(state), users: safeUsers(state) });
  } catch (e) {
    return handleError(e);
  }
}
