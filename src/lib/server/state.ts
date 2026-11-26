import "server-only";

import { STATE_VERSION, createSeed, SEED_SETTINGS } from "@/lib/data";
import type { PublicState, SharedState } from "@/lib/types";
import { kv } from "./redis";

const KEY = `bdv:state:v${STATE_VERSION}`;
const REV_KEY = "bdv:rev";
const LOCK_KEY = "bdv:lock";

/** Erro de concorrência: alguém está gravando ao mesmo tempo. */
export class BusyError extends Error {
  constructor() {
    super("O servidor está ocupado salvando outra alteração. Tente de novo.");
    this.name = "BusyError";
  }
}

/** Preenche campos novos sem perder o que já existe no Redis. */
function migrate(raw: Partial<SharedState> | null): SharedState {
  const seed = createSeed();
  if (!raw) return seed;
  if (raw.version === STATE_VERSION) {
    return {
      ...seed,
      ...raw,
      settings: { ...SEED_SETTINGS, ...(raw.settings ?? {}) },
      version: STATE_VERSION,
    } as SharedState;
  }
  // Versão antiga: mantém o que é seguro reaproveitar.
  return {
    ...seed,
    users: raw.users ?? [],
    settings: { ...SEED_SETTINGS, ...(raw.settings ?? {}) },
  };
}

export async function getRev(): Promise<number> {
  const v = await kv.get(REV_KEY);
  return Number(v ?? 0);
}

export async function loadState(): Promise<SharedState> {
  const raw = await kv.getJSON<SharedState>(KEY);
  const state = migrate(raw);
  if (!raw || raw.version !== STATE_VERSION) await writeState(state);
  return state;
}

async function writeState(state: SharedState): Promise<number> {
  await kv.setJSON(KEY, state);
  return kv.incr(REV_KEY);
}

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const token = Math.random().toString(36).slice(2);
  for (let i = 0; i < 25; i++) {
    if (await kv.setIfAbsent(LOCK_KEY, token, 5000)) {
      try {
        return await fn();
      } finally {
        await kv.del(LOCK_KEY);
      }
    }
    await new Promise((r) => setTimeout(r, 80));
  }
  throw new BusyError();
}

/**
 * Lê, altera e grava o estado com trava — evita corrida entre o pedido do
 * cliente e o clique do painel (baixa de estoque, numeração, uso de cupom).
 */
export async function mutate<T>(
  fn: (state: SharedState) => { state: SharedState; result: T } | Promise<{ state: SharedState; result: T }>,
): Promise<{ state: SharedState; rev: number; result: T }> {
  return withLock(async () => {
    const current = await loadState();
    const { state, result } = await fn(current);
    const rev = state === current ? await getRev() : await writeState(state);
    return { state, rev, result };
  });
}

/** O que o cliente pode ver: cardápio, áreas de entrega e dados públicos da loja. */
export function publicState(state: SharedState, rev: number): PublicState {
  // A chave Pix nunca sai para o navegador do cliente.
  const settings = { ...state.settings };
  delete (settings as Partial<SharedState["settings"]>).pixKey;
  delete (settings as Partial<SharedState["settings"]>).pixName;
  delete (settings as Partial<SharedState["settings"]>).pixCity;
  return {
    rev,
    // Só seções ativas e com ao menos um produto
    sections: state.sections
      .filter((s) => s.active && state.products.some((p) => p.category === s.id))
      .sort((a, b) => a.order - b.order),
    products: state.products.filter((p) => state.sections.some((s) => s.active && s.id === p.category)),
    extras: state.extras.filter((e) => e.active),
    neighborhoods: state.neighborhoods.filter((n) => n.active).sort((a, b) => a.order - b.order),
    settings,
  };
}

/** Painel: tudo, menos o hash das senhas. */
export function adminState(state: SharedState): SharedState {
  return { ...state, users: state.users.map((u) => ({ ...u, passwordHash: "", salt: "" })) };
}
