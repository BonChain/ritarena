import type { RpsChoice } from "@ritarena/sdk";

export type MatchPhase =
  | { kind: "waiting" }
  | { kind: "round-start"; round: number; deadline: number }
  | { kind: "round-resolved"; round: number; choices: RpsChoice[]; scores: number[]; pubkeys: string[]; tx: string }
  | { kind: "complete"; finalRanks: { pubkey: string; rank: number; score: number }[]; tx: string };
