import { z } from "zod";
import { authenticate } from "@/lib/server/auth";
import { assertStorage, clientIp, fail, handleError, json } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate";
import { SESSION_COOKIE, authConfigured, sessionCookieOptions, signSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  login: z.string().min(1).max(80),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  try {
    assertStorage();
    if (!authConfigured())
      return fail("Painel indisponível: defina a variável AUTH_SECRET no ambiente.", 503);

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return fail("Informe usuário e senha.");

    const ip = clientIp(req);
    if (!(await rateLimit(`login:${ip}`, 10, 300)))
      return fail("Muitas tentativas. Espere alguns minutos e tente de novo.", 429);

    const result = await authenticate(parsed.data.login, parsed.data.password);
    if (!result.ok) return fail(result.error, 401);

    const res = json({ ok: true, user: { name: result.session.name, role: result.session.role } });
    res.cookies.set(SESSION_COOKIE, await signSession(result.session), sessionCookieOptions);
    return res;
  } catch (e) {
    return handleError(e);
  }
}
