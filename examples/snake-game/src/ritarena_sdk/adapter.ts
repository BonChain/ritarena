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

export interface ArenaAdapterEvents {
  onLog: (message: string) => void;
}

export interface ArenaAdapter {
  createArena(config: CreateArenaConfig): Promise<{ arenaId: number; tx: string }>;
  registerProfile(botName: string, keypair: Keypair): Promise<void>;
  enterArena(arenaId: number, keypair: Keypair): Promise<string>;
  startArena(arenaId: number): Promise<void>;
  submitElimination(arenaId: number, round: RoundResult): Promise<void>;
  finalizeArena(arenaId: number, winner: BotIdentity, allBots: BotIdentity[]): Promise<void>;
}
