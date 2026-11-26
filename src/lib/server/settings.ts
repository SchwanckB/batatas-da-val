import "server-only";

import { SEED_SETTINGS } from "@/lib/data";
import type { StoreSettings } from "@/lib/types";
import { loadState } from "./state";

/**
 * Configurações da loja para metadados e JSON-LD. Se o Redis estiver fora,
 * cai no seed em vez de derrubar a página pública.
 */
export async function settingsOrSeed(): Promise<StoreSettings> {
  try {
    return (await loadState()).settings;
  } catch {
    return SEED_SETTINGS;
  }
}
