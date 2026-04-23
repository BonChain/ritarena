import type { RpsChoice } from "@ritarena/sdk";

/**
 * History passed to each bot's pickChoice call. The bot sees all past
 * rounds for the current match; it does NOT see the current round's
 * other choices (those are hidden until resolution).
 */
export type BotContext = {
  /** 0-indexed round number, 0 for the first round. */
  round: number;
  /**
   * All previous rounds' full results. Index 0 = round 0.
   * `history[r].choices[i]` is the choice player i made in round r.
   */
  history: readonly RoundHistory[];
  /** The bot's own index in `choices[]` arrays (stable across rounds). */
  selfIndex: number;
  /**
   * The human's index in `choices[]` arrays, or null if no human in this
   * arena (rare — arena is bot-only).
   */
  humanIndex: number | null;
};

export type RoundHistory = {
  choices: readonly RpsChoice[];
  scores: readonly number[];
};

export type Bot = {
  /** Display name shown in the lobby, e.g. "@copycat". */
  name: string;
  /** One-sentence strategy tagline shown in the lobby. */
  tagline: string;
  /** Pure function: given context, pick one of rock/paper/scissors. */
  pickChoice(ctx: BotContext): RpsChoice;
};

const ALL_CHOICES: readonly RpsChoice[] = ["rock", "paper", "scissors"];

export function randomChoice(): RpsChoice {
  const i = Math.floor(Math.random() * 3);
  return ALL_CHOICES[i];
}

/** rock → paper, paper → scissors, scissors → rock. */
export function counter(c: RpsChoice): RpsChoice {
  if (c === "rock") return "paper";
  if (c === "paper") return "scissors";
  return "rock";
}
