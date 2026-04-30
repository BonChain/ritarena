import type { RpsChoice } from "@ritarena/sdk";

export type MatchPhase =
  | { kind: "waiting" }
  | { kind: "round-start"; round: number; deadline: number }
  | { kind: "round-resolved"; round: number; choices: RpsChoice[]; scores: number[]; pubkeys: string[]; tx: string }
  | { kind: "complete"; finalRanks: { pubkey: string; rank: number; score: number }[]; tx: string };

export type RunningState = {
  /** Choices from the most recently resolved round, ordered by `lastPubkeys`. Null until round 1 resolves. */
  lastChoices: RpsChoice[] | null;
  /** Pubkey order for `lastChoices` and `runningScores`. */
  lastPubkeys: string[] | null;
  /** Cumulative score per pubkey, same order as `lastPubkeys`. Null until round 1 resolves. */
  runningScores: number[] | null;
};

export const EMPTY_RUNNING: RunningState = {
  lastChoices: null,
  lastPubkeys: null,
  runningScores: null,
};
