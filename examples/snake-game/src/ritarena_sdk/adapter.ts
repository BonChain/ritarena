// examples/snake-game/src/ritarena_sdk/adapter.ts

import type { Keypair } from "@solana/web3.js";
import type { CreateArenaConfig } from "@ritarena/sdk";

export interface GameAction {
  snakeId: string;
  round: number;
  tick: number;
  action: string;
  result: string;
  score: number;
}

export interface BotIdentity {
  botId: string;
  keypair: Keypair;
}

export interface RoundResult {
  roundNumber: number;
  deaths: BotIdentity[];
  scores: Map<string, number>;
  actions: GameAction[];
}

export type LogKind = "create" | "register" | "enter" | "start" | "eliminate" | "finalize" | "info";

export interface LogEntry {
  message: string;
  kind: LogKind;
  tx?: string;
  explorerUrl?: string;
}

export interface PreflightCheck {
  name: string;
  status: "pending" | "ok" | "fail";
  detail: string;
}

export interface ArenaAdapterEvents {
  onLog: (entry: LogEntry) => void;
}

export interface ArenaAdapter {
  preflight(): Promise<PreflightCheck[]>;
  createArena(config: CreateArenaConfig): Promise<{ arenaId: number; tx: string }>;
  registerProfile(botName: string, keypair: Keypair): Promise<void>;
  enterArena(arenaId: number, keypair: Keypair): Promise<string>;
  startArena(arenaId: number): Promise<void>;
  submitElimination(arenaId: number, round: RoundResult): Promise<void>;
  finalizeArena(arenaId: number, winner: BotIdentity, allBots: BotIdentity[]): Promise<void>;
  claimPrize(arenaId: number, winner: BotIdentity): Promise<void>;
}
