import "server-only";

/**
 * Acesso ao Redis da Vercel.
 *
 * Três transportes, escolhidos automaticamente:
 *  1. TCP  — `REDIS_URL` (variável criada pelo Vercel Redis / Redis Cloud).
 *  2. REST — `KV_REST_API_URL` + `KV_REST_API_TOKEN` (Upstash pela Vercel Marketplace).
 *  3. Arquivo local — só em desenvolvimento, quando nada está configurado,
 *     para dar `npm run dev` sem depender de nuvem.
 */

const REST_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const REST_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const TCP_URL = process.env.REDIS_URL || process.env.KV_URL || "";

export type Transport = "tcp" | "rest" | "arquivo";

export const transport: Transport = TCP_URL ? "tcp" : REST_URL && REST_TOKEN ? "rest" : "arquivo";

export const redisConfigured = transport !== "arquivo";

/**
 * Em produção sem Redis configurado o app não pode gravar nada — melhor avisar
 * do que fingir que salvou. `BDV_ALLOW_FILE_STORAGE=1` libera o modo arquivo
 * para testar o build na própria máquina.
 */
const fileStorageAllowed = process.env.BDV_ALLOW_FILE_STORAGE === "1";
export const redisMissingInProduction =
  !redisConfigured && !fileStorageAllowed && process.env.NODE_ENV === "production";

/* ------------------------------------------------------------------ *
 * Transporte TCP (pacote `redis`)
 * ------------------------------------------------------------------ */

type MinimalClient = { sendCommand: (args: string[]) => Promise<unknown> };

const globalForRedis = globalThis as unknown as {
  __bdvRedis?: Promise<MinimalClient>;
};

async function tcpClient(): Promise<MinimalClient> {
  globalForRedis.__bdvRedis ??= (async () => {
    const { createClient } = await import("redis");
    const client = createClient({
      url: TCP_URL,
      socket: { reconnectStrategy: (tries) => Math.min(tries * 200, 3000) },
    });
    client.on("error", (e: unknown) => console.error("[redis]", e));
    await client.connect();
    return client as unknown as MinimalClient;
  })();
  try {
    return await globalForRedis.__bdvRedis;
  } catch (e) {
    globalForRedis.__bdvRedis = undefined;
    throw e;
  }
}

/* ------------------------------------------------------------------ *
 * Transporte REST (Upstash)
 * ------------------------------------------------------------------ */

async function restCommand(args: string[]): Promise<unknown> {
  const res = await fetch(REST_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REST_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Redis REST ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { result?: unknown; error?: string };
  if (json.error) throw new Error(`Redis REST: ${json.error}`);
  return json.result ?? null;
}

/* ------------------------------------------------------------------ *
 * Transporte arquivo (desenvolvimento)
 * ------------------------------------------------------------------ */

type FileEntry = { v: string; exp?: number };

async function fileCommand(args: string[]): Promise<unknown> {
  const { readFile, writeFile, mkdir } = await import("node:fs/promises");
  const path = await import("node:path");
  const dir = path.join(process.cwd(), ".data");
  const file = path.join(dir, "kv.json");

  const load = async (): Promise<Record<string, FileEntry>> => {
    try {
      return JSON.parse(await readFile(file, "utf8")) as Record<string, FileEntry>;
    } catch {
      return {};
    }
  };
  const save = async (db: Record<string, FileEntry>) => {
    await mkdir(dir, { recursive: true });
    await writeFile(file, JSON.stringify(db), "utf8");
  };

  const db = await load();
  const now = Date.now();
  for (const [k, e] of Object.entries(db)) if (e.exp && e.exp < now) delete db[k];

  const [cmdRaw, key, ...rest] = args;
  const cmd = cmdRaw.toUpperCase();

  switch (cmd) {
    case "GET":
      return db[key]?.v ?? null;
    case "SET": {
      const value = rest[0];
      const flags = rest.slice(1).map((f) => f.toUpperCase());
      if (flags.includes("NX") && db[key]) return null;
      const pxIndex = flags.indexOf("PX");
      const exp = pxIndex >= 0 ? now + Number(rest.slice(1)[pxIndex + 1]) : undefined;
      db[key] = { v: value, exp };
      await save(db);
      return "OK";
    }
    case "DEL": {
      const existed = Boolean(db[key]);
      delete db[key];
      await save(db);
      return existed ? 1 : 0;
    }
    case "INCR": {
      const next = Number(db[key]?.v ?? 0) + 1;
      db[key] = { v: String(next), exp: db[key]?.exp };
      await save(db);
      return next;
    }
    case "EXPIRE": {
      if (!db[key]) return 0;
      db[key].exp = now + Number(rest[0]) * 1000;
      await save(db);
      return 1;
    }
    case "PING":
      return "PONG";
    default:
      throw new Error(`Comando não suportado no modo arquivo: ${cmd}`);
  }
}

/* ------------------------------------------------------------------ *
 * API pública
 * ------------------------------------------------------------------ */

export async function command(args: string[]): Promise<unknown> {
  if (transport === "tcp") return (await tcpClient()).sendCommand(args);
  if (transport === "rest") return restCommand(args);
  return fileCommand(args);
}

export const kv = {
  async get(key: string): Promise<string | null> {
    const v = await command(["GET", key]);
    return v === null || v === undefined ? null : String(v);
  },
  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await kv.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  async set(key: string, value: string): Promise<void> {
    await command(["SET", key, value]);
  },
  async setJSON(key: string, value: unknown): Promise<void> {
    await kv.set(key, JSON.stringify(value));
  },
  async del(key: string): Promise<void> {
    await command(["DEL", key]);
  },
  async incr(key: string): Promise<number> {
    return Number(await command(["INCR", key]));
  },
  async expire(key: string, seconds: number): Promise<void> {
    await command(["EXPIRE", key, String(seconds)]);
  },
  /** `true` quando conseguiu criar a chave (base do lock e do rate limit). */
  async setIfAbsent(key: string, value: string, ttlMs: number): Promise<boolean> {
    const r = await command(["SET", key, value, "NX", "PX", String(ttlMs)]);
    return r === "OK" || r === 1;
  },
  async ping(): Promise<boolean> {
    try {
      await command(["PING"]);
      return true;
    } catch {
      return false;
    }
  },
};
