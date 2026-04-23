import { copycat } from "./copycat.js";
import { counterPredictor } from "./counter-predictor.js";
import { chaos } from "./chaos.js";
import { lastWinner } from "./last-winner.js";
import { rockHead } from "./rock-head.js";
import type { Bot } from "./types.js";

/**
 * The ordered roster of bots. Arena #2 always uses all 5 (one human + 5 bots
 * = 6 total players).
 */
export const BOT_ROSTER: readonly Bot[] = [
  copycat,
  counterPredictor,
  chaos,
  lastWinner,
  rockHead,
];

export type { Bot, BotContext, RoundHistory } from "./types.js";
export { randomChoice, counter } from "./types.js";
