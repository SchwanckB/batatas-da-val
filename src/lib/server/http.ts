import "server-only";

import { NextResponse } from "next/server";
import { UnauthorizedError } from "./auth";
import { BusyError } from "./state";
import { redisMissingInProduction } from "./redis";

export const noStore = { "Cache-Control": "no-store, max-age=0" };

export const json = <T>(data: T, status = 200) =>
  NextResponse.json(data, { status, headers: noStore });

export const fail = (error: string, status = 400) => json({ error }, status);

/** Converte exceções conhecidas em respostas em pt-BR. */
export function handleError(e: unknown): NextResponse {
  if (e instanceof UnauthorizedError) return fail(e.message, 401);
  if (e instanceof BusyError) return fail(e.message, 503);
  console.error("[api]", e);
  const detail = e instanceof Error ? e.message : "";
  if (/redis|econnrefused|enotfound|etimedout/i.test(detail))
    return fail("Não foi possível falar com o banco de dados. Tente de novo em alguns segundos.", 503);
  return fail("Algo deu errado do nosso lado. Tente de novo.", 500);
}

/** Bloqueia a API inteira se subirmos para produção sem Redis. */
export function assertStorage() {
  if (redisMissingInProduction)
    throw new Error("Redis não configurado: defina REDIS_URL (ou KV_REST_API_URL + KV_REST_API_TOKEN).");
}

export function clientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("cf-connecting-ip") ||
    "local"
  );
}
