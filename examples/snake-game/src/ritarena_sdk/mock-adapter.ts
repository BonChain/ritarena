// examples/snake-game/src/ritarena_sdk/mock-adapter.ts

import { Keypair } from "@solana/web3.js";
import type { CreateArenaConfig } from "@ritarena/sdk";
import type {
  ArenaAdapter, RoundResult, BotIdentity, ArenaAdapterEvents,
  LogKind, PreflightCheck,
} from "./adapter.js";
import { hashLeaf, computeMerkleRoot } from "./merkle.js";

export class MockAdapter implements ArenaAdapter {
  private arenaCount = 0;
  private events: ArenaAdapterEvents;

  constructor(events: ArenaAdapterEvents) {
    this.events = events;
  }

  private log(message: string, kind: LogKind, tx?: string): void {
    const formatted = `[RitArena] ${message}`;
    console.log(formatted);
    this.events.onLog({ message: formatted, kind, tx });
  }

  async preflight(): Promise<PreflightCheck[]> {
    return [
      { name: "Mock mode", status: "ok", detail: "No checks needed" },
    ];
  }

  async createArena(config: CreateArenaConfig): Promise<{ arenaId: number; tx: string }> {
    const arenaId = this.arenaCount++;
    const tx = `mock-tx-create-${arenaId}`;
    this.log(
      `createArena -> arenaId: ${arenaId}, maxAgents: ${config.maxAgents}, prizeSplit: [${config.prizeSplit}]`,
      "create", tx
    );
    return { arenaId, tx };
  }

  async registerProfile(botName: string, _keypair: Keypair): Promise<void> {
    this.log(`registerProfile -> "${botName}" registered`, "register");
  }

  async enterArena(arenaId: number, keypair: Keypair): Promise<string> {
    const tx = `mock-tx-enter-${keypair.publicKey.toBase58().slice(0, 8)}`;
    this.log(
      `enterArena -> ${keypair.publicKey.toBase58().slice(0, 8)}... entered arena ${arenaId}`,
      "enter", tx
    );
    return tx;
  }

  async startArena(arenaId: number): Promise<void> {
    this.log(`startArena -> arena ${arenaId} now Active`, "start");
  }

  async submitElimination(arenaId: number, round: RoundResult): Promise<void> {
    const leaves = round.actions.map(hashLeaf);
    const root = computeMerkleRoot(leaves);
    const deathNames = round.deaths.map((d) => d.botId).join(", ") || "none";
    const scores = Array.from(round.scores.entries())
      .map(([id, s]) => `${id}:${s}`)
      .join(", ");
    this.log(
      `submitElimination -> round ${round.roundNumber}, eliminated: [${deathNames}], ` +
      `scores: [${scores}], merkle: ${root.toString("hex").slice(0, 12)}...`,
      "eliminate"
    );
  }

  async finalizeArena(arenaId: number, winner: BotIdentity, _allBots: BotIdentity[]): Promise<void> {
    this.log(`finalizeArena -> arena ${arenaId}, winner: ${winner.botId} (rank 1)`, "finalize");
  }

  async claimPrize(arenaId: number, winner: BotIdentity): Promise<void> {
    this.log(`claimPrize -> ${winner.botId} claimed prize from arena ${arenaId}`, "finalize");
  }
}
