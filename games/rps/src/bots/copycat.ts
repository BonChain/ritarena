import type { Bot } from "./types";
import { randomChoice } from "./types";

export const copycat: Bot = {
  name: "@copycat",
  tagline: "I mirror your last move.",
  pickChoice(ctx) {
    if (ctx.humanIndex === null || ctx.round === 0) return randomChoice();
    const previousRound = ctx.history[ctx.round - 1];
    return previousRound.choices[ctx.humanIndex];
  },
};
