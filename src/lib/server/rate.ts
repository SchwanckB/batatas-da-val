import "server-only";

import { kv } from "./redis";

/**
 * Contador por janela fixa no Redis. `true` = pode seguir.
 * Usado no envio de pedidos, no login e nas avaliações.
 */
export async function rateLimit(bucket: string, limit: number, windowSeconds: number): Promise<boolean> {
  const window = Math.floor(Date.now() / 1000 / windowSeconds);
  const key = `bdv:rl:${bucket}:${window}`;
  try {
    const count = await kv.incr(key);
    if (count === 1) await kv.expire(key, windowSeconds + 5);
    return count <= limit;
  } catch {
    // Se o contador falhar, não travamos a loja.
    return true;
  }
}
