import { copycat } from "./copycat";
import { counterPredictor } from "./counter-predictor";
import { chaos } from "./chaos";
import { lastWinner } from "./last-winner";
import { rockHead } from "./rock-head";
import type { Bot } from "./types";

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

export type { Bot, BotContext, RoundHistory } from "./types";
export { randomChoice, counter } from "./types";
