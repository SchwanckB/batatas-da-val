import type { Role } from "@/lib/types";

/**
 * Sessão do painel: um token assinado (HMAC-SHA256) guardado em cookie httpOnly.
 * Usa só Web Crypto, então roda igual no middleware (edge) e nas rotas (node).
 */

export const SESSION_COOKIE = "bdv_sessao";
export const SESSION_DAYS = 14;

export interface SessionPayload {
  /** Id do usuário. */
  sub: string;
  name: string;
  login: string;
  role: Role;
  /** Expiração em segundos (epoch). */
  exp: number;
}

const DEV_SECRET = "batatas-da-val-apenas-desenvolvimento";

export function authSecret(): string {
  const s = process.env.AUTH_SECRET || process.env.SESSION_SECRET || "";
  if (s) return s;
  if (process.env.NODE_ENV === "production") return "";
  return DEV_SECRET;
}

export const authConfigured = () => Boolean(authSecret());

const enc = new TextEncoder();

const b64url = (bytes: Uint8Array) => {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromB64url = (s: string) => {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(pad + "=".repeat((4 - (pad.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

async function key(secret: string) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const secret = authSecret();
  if (!secret) throw new Error("AUTH_SECRET não configurado");
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const mac = await crypto.subtle.sign("HMAC", await key(secret), enc.encode(body));
  return `${body}.${b64url(new Uint8Array(mac))}`;
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  const secret = authSecret();
  if (!token || !secret) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await key(secret), fromB64url(mac), enc.encode(body));
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body))) as SessionPayload;
    if (!payload?.sub || !payload.exp || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_DAYS * 24 * 60 * 60,
};
