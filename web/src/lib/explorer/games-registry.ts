// Off-chain registry mapping `arena.actionSchema` to friendly game metadata.
// On-chain we only store the action schema string + rulesHash — there is no
// game name field. This registry is the canonical "what game is this arena?"
// lookup for the explorer UI.
//
// To add a new game: add a new entry here keyed by the exact string passed
// to `createArena({ actionSchema: ... })` for that game.

export interface GameMeta {
  /** Display name shown in the explorer UI. */
  name: string;
  /** Single-character emoji or short glyph for compact card UI. */
  icon: string;
  /** Hex accent color used for the game chip and detail header. */
  color: string;
  /** One-line description for tooltips / detail header. */
  description: string;
}

const GAMES: Record<string, GameMeta> = {
  "up,down,left,right": {
    name: "Snake Royale",
    icon: "🐍",
    color: "#14F195",
    description: "8-bot battle royale on a shrinking grid. Last snake alive wins.",
  },
  territory_auction: {
    name: "Territory Auction",
    icon: "🏰",
    color: "#9945FF",
    description: "Sealed-bid tile auctions with cluster scoring. Empire builders win.",
  },
  rps_mind_reader: {
    name: "RPS Mind Reader",
    icon: "🪨",
    color: "#FFC53D",
    description: "Heads-up rock-paper-scissors with bluff phases. Human vs AI.",
  },
};

const FALLBACK: GameMeta = {
  name: "Custom Game",
  icon: "🎮",
  color: "#888888",
  description: "Custom action schema — game logic defined off-chain by the creator.",
};

/** Look up a game's friendly metadata by its on-chain `actionSchema` string. */
export function getGameMeta(actionSchema: string): GameMeta {
  return GAMES[actionSchema] ?? FALLBACK;
}
