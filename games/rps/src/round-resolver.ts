import { resolveRpsRound, type RpsChoice } from "@ritarena/sdk";

export type RoundInput = {
  pubkeys: readonly string[];
  choices: readonly RpsChoice[];
};

export type RoundResult = {
  pubkeys: readonly string[];
  choices: readonly RpsChoice[];
  scores: readonly number[];
};

/**
 * Compute per-player score for one RPS round.
 * Wraps @ritarena/sdk's resolveRpsRound to keep game server + web on
 * the same rules.
 */
export function resolveRound(input: RoundInput): RoundResult {
  if (input.pubkeys.length !== input.choices.length) {
    throw new Error(
      `pubkeys.length (${input.pubkeys.length}) !== choices.length (${input.choices.length})`
    );
  }
  const scores = resolveRpsRound(input.choices);
  return {
    pubkeys: input.pubkeys,
    choices: input.choices,
    scores,
  };
}
