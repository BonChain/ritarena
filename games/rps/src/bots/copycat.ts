import type { Bot, BotContext } from "./types.js";
import { randomChoice } from "./types.js";

export const copycat: Bot = {
  name: "@copycat",
  tagline: "I mirror your last move.",
  pickChoice(ctx: BotContext) {
    if (ctx.humanIndex === null || ctx.round === 0) return randomChoice();
    const previousRound = ctx.history[ctx.round - 1];
    return previousRound.choices[ctx.humanIndex];
  },
};
