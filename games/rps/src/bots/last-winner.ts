import type { Bot } from "./types";
import { randomChoice } from "./types";
import type { RpsChoice } from "@ritarena/sdk";

export const lastWinner: Bot = {
  name: "@last-winner",
  tagline: "I play what won last round.",
  pickChoice(ctx) {
    if (ctx.round === 0) return randomChoice();
    const previousRound = ctx.history[ctx.round - 1];

    // Aggregate round score per choice (since multiple players can play same choice
    // and each earns their own score).
    const totalByChoice: Record<RpsChoice, number> = { rock: 0, paper: 0, scissors: 0 };
    for (let i = 0; i < previousRound.choices.length; i++) {
      totalByChoice[previousRound.choices[i]] += previousRound.scores[i];
    }

    // Deterministic tiebreak: rock > paper > scissors.
    const order: RpsChoice[] = ["rock", "paper", "scissors"];
    let topChoice: RpsChoice = "rock";
    let topTotal = -1;
    for (const c of order) {
      if (totalByChoice[c] > topTotal) {
        topTotal = totalByChoice[c];
        topChoice = c;
      }
    }
    return topChoice;
  },
};
