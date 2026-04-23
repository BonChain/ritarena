import type { Bot } from "./types";
import { randomChoice, counter } from "./types";
import type { RpsChoice } from "@ritarena/sdk";

export const counterPredictor: Bot = {
  name: "@counter-predictor",
  tagline: "I counter whatever you play most.",
  pickChoice(ctx) {
    if (ctx.humanIndex === null || ctx.round === 0) return randomChoice();

    const counts: Record<RpsChoice, number> = { rock: 0, paper: 0, scissors: 0 };
    for (const past of ctx.history) {
      counts[past.choices[ctx.humanIndex]] += 1;
    }
    // Pick the choice that counters the most-frequent one. Ties: rock > paper > scissors
    // (deterministic order).
    const order: RpsChoice[] = ["rock", "paper", "scissors"];
    let topChoice: RpsChoice = "rock";
    let topCount = -1;
    for (const c of order) {
      if (counts[c] > topCount) {
        topCount = counts[c];
        topChoice = c;
      }
    }
    return counter(topChoice);
  },
};
