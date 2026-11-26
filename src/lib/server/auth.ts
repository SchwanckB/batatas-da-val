import "server-only";

import { cookies } from "next/headers";
import { uid } from "@/lib/format";
import type { Role, SharedState, User } from "@/lib/types";
import { SESSION_COOKIE, type SessionPayload, verifySession } from "@/lib/auth/session";
import { loadState, mutate } from "./state";

const ITERATIONS = 120_000;
const enc = new TextEncoder();

const toHex = (b: ArrayBuffer) =>
  Array.from(new Uint8Array(b))
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");

const fromHex = (h: string) => Uint8Array.from(h.match(/.{1,2}/g)?.map((x) => parseInt(x, 16)) ?? []);

export async function hashPassword(password: string, saltHex?: string) {
  const salt = saltHex ? fromHex(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: ITERATIONS, hash: "SHA-256" },
    base,
    256,
  );
  return { hash: toHex(bits), salt: saltHex ?? toHex(salt.buffer as ArrayBuffer) };
}

/** Comparação em tempo constante. */
function sameHash(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function makeUser(
  data: { name: string; login: string; role: Role; password: string },
  id = uid(),
): Promise<User> {
  const { hash, salt } = await hashPassword(data.password);
  return {
    id,
    name: data.name.trim().slice(0, 40) || data.login,
    login: data.login.trim().toLowerCase().slice(0, 60),
    role: data.role,
    passwordHash: hash,
    salt,
    createdAt: Date.now(),
  };
}

/** Senha do primeiro acesso: variável de ambiente (ou um padrão só em dev). */
export function bootstrapPassword(): { login: string; password: string } | null {
  const password = process.env.ADMIN_PASSWORD;
  const login = (process.env.ADMIN_LOGIN || "dono").toLowerCase();
  if (password) return { login, password };
  if (process.env.NODE_ENV !== "production") return { login: "dono", password: "batatas" };
  return null;
}

/** `true` quando dá para entrar no painel (há usuário ou senha de bootstrap). */
export async function loginAvailable(): Promise<boolean> {
  const state = await loadState();
  return state.users.length > 0 || bootstrapPassword() !== null;
}

export type LoginResult = { ok: true; session: SessionPayload } | { ok: false; error: string };

export async function authenticate(loginRaw: string, password: string): Promise<LoginResult> {
  const login = loginRaw.trim().toLowerCase();
  if (!login || !password) return { ok: false, error: "Informe usuário e senha." };

  const { result } = await mutate<LoginResult>(async (state) => {
    let next = state;
    let user = state.users.find((u) => u.login === login);

    // Primeiro acesso: cria o dono a partir da senha do ambiente.
    if (!user && state.users.length === 0) {
      const boot = bootstrapPassword();
      if (boot && boot.login === login && boot.password === password) {
        user = await makeUser({ name: "Val", login: boot.login, role: "dono", password });
        next = { ...state, users: [user] };
      }
    }
    if (!user) return { state, result: { ok: false, error: "Usuário ou senha incorretos." } };

    const { hash } = await hashPassword(password, user.salt);
    if (!sameHash(hash, user.passwordHash))
      return { state, result: { ok: false, error: "Usuário ou senha incorretos." } };

    return {
      state: next,
      result: {
        ok: true,
        session: {
          sub: user.id,
          name: user.name,
          login: user.login,
          role: user.role,
          exp: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60,
        },
      },
    };
  });

  return result;
}

/** Sessão do pedido atual (ou null). */
export async function currentSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  // O usuário pode ter sido removido depois do login.
  const state = await loadState();
  if (state.users.length && !state.users.some((u) => u.id === session.sub)) return null;
  return session;
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await currentSession();
  if (!session) throw new UnauthorizedError();
  return session;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Sessão expirada. Entre novamente.");
    this.name = "UnauthorizedError";
  }
}

/** Usuários sem dados sensíveis, para exibir no painel. */
export const safeUsers = (state: SharedState) =>
  state.users.map(({ id, name, login, role, createdAt }) => ({ id, name, login, role, createdAt }));
