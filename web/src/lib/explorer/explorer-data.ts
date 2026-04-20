import type { Arena, AgentProfile, ArenaFilter } from "@ritarena/sdk";
import { PublicKey } from "@solana/web3.js";
import { getReader } from "./sdk-client";

const HARD_LIMIT = 50;

export interface ArenaWithCreator {
  arena: Arena;
  creatorProfile: AgentProfile | null;
}

/**
 * Fetch arenas + each unique creator's profile in batched parallel calls.
 *
 * - Calls listArenas() once.
 * - Sorts newest-first by arena.id (BN-safe).
 * - Trims to HARD_LIMIT.
 * - Dedupes creators, then Promise.all over getProfile for each unique key.
 * - Returns a list pairing each arena with its creator's profile (or null
 *   if the fetch failed / profile doesn't exist).
 */
export async function listArenasWithCreators(
  filter?: ArenaFilter
): Promise<ArenaWithCreator[]> {
  const reader = getReader();
  const all = await reader.listArenas(filter);

  const sorted = [...all].sort((a, b) => {
    const ai = BigInt(a.id.toString());
    const bi = BigInt(b.id.toString());
    if (bi > ai) return 1;
    if (bi < ai) return -1;
    return 0;
  });
  const arenas = sorted.slice(0, HARD_LIMIT);

  const uniqueCreatorKeys = new Map<string, PublicKey>();
  for (const a of arenas) {
    const k = a.creator.toBase58();
    if (!uniqueCreatorKeys.has(k)) uniqueCreatorKeys.set(k, a.creator);
  }

  const profileEntries = await Promise.all(
    Array.from(uniqueCreatorKeys.values()).map(async (pk) => {
      try {
        const profile = await reader.getProfile(pk);
        return [pk.toBase58(), profile] as const;
      } catch {
        return [pk.toBase58(), null] as const;
      }
    })
  );
  const profileByCreator = new Map<string, AgentProfile | null>(profileEntries);

  return arenas.map((arena) => ({
    arena,
    creatorProfile: profileByCreator.get(arena.creator.toBase58()) ?? null,
  }));
}

/** Convenience for the detail page: arena + creator profile in parallel. */
export async function getArenaWithCreator(
  arenaId: number
): Promise<ArenaWithCreator | null> {
  const reader = getReader();
  const arena = await reader.getArena(arenaId);
  if (!arena) return null;
  let creatorProfile: AgentProfile | null = null;
  try {
    creatorProfile = await reader.getProfile(arena.creator);
  } catch {
    creatorProfile = null;
  }
  return { arena, creatorProfile };
}
