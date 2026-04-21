/**
 * Maps an on-chain arena id to its YouTube video id. The /explore/[arenaId]
 * detail page renders a Replay section iff the id has an entry here.
 *
 * To add a replay for a new arena: push one line `[id]: "<youtubeVideoId>"`.
 */
export const ARENA_REPLAYS: Record<number, string> = {
  32: "qKjHR0ufbHg",
};

export function getArenaReplay(arenaId: number): string | null {
  return ARENA_REPLAYS[arenaId] ?? null;
}
