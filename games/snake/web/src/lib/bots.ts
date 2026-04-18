// games/snake/web/src/lib/bots.ts
export interface BotPersonality {
  id: string;           // matches server-side bot.id
  name: string;         // display name
  color: string;        // hex color for snake + leaderboard
  strategy: "greedy" | "cautious" | "aggressive" | "random";
  avatar: string;       // single char or emoji
}

/**
 * 8 named bots with unique colors. IDs must match the BOT_ROSTER
 * in games/snake/src/server.ts. Names/colors are cosmetic.
 */
export const BOT_PERSONALITIES: BotPersonality[] = [
  { id: "greedy-1",    name: "ALPHA",   color: "#14F195", strategy: "greedy",     avatar: "A" },
  { id: "greedy-2",    name: "WHALE",   color: "#00C2FF", strategy: "greedy",     avatar: "W" },
  { id: "cautious-1",  name: "CHAD",    color: "#9945FF", strategy: "cautious",   avatar: "C" },
  { id: "cautious-2",  name: "DIAMOND", color: "#FFC53D", strategy: "cautious",   avatar: "D" },
  { id: "aggressive-1",name: "DEGEN",   color: "#FF5555", strategy: "aggressive", avatar: "G" },
  { id: "aggressive-2",name: "SAVAGE",  color: "#FF8C00", strategy: "aggressive", avatar: "S" },
  { id: "random-1",    name: "PAPER",   color: "#B0B0B0", strategy: "random",     avatar: "P" },
  { id: "random-2",    name: "RUGGED",  color: "#666666", strategy: "random",     avatar: "R" },
];

const BY_ID = new Map(BOT_PERSONALITIES.map((b) => [b.id, b]));

export function getPersonality(botId: string): BotPersonality | undefined {
  return BY_ID.get(botId);
}
