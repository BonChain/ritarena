// examples/snake-game/src/ritarena_sdk/devnet-adapter.ts

import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  RitArena,
  pdas,
  type CreateArenaConfig,
  type SubmitEliminationParams,
  type FinalizeArenaParams,
} from "@ritarena/sdk";
import type { ArenaAdapter, RoundResult, BotIdentity, ArenaAdapterEvents } from "./adapter.js";
import { hashLeaf, computeMerkleRoot } from "./merkle.js";

const RPC_URL = "https://api.devnet.solana.com";
const EXPLORER_BASE = "https://explorer.solana.com/tx";

export class DevnetAdapter implements ArenaAdapter {
  private connection: Connection;
  private oracleKeypair: Keypair;
  private sdk: RitArena;
  private events: ArenaAdapterEvents;
  private botPdas: Map<string, { profilePda: PublicKey; entryPda: PublicKey }> = new Map();
  private allEntryPdas: PublicKey[] = [];

  constructor(oracleKeypair: Keypair, events: ArenaAdapterEvents) {
    this.connection = new Connection(RPC_URL, "confirmed");
    this.oracleKeypair = oracleKeypair;
    this.sdk = RitArena.fromKeypair(this.connection, oracleKeypair);
    this.events = events;
  }

  private log(msg: string): void {
    const formatted = `[RitArena] ${msg}`;
    console.log(formatted);
    this.events.onLog(formatted);
  }

  async createArena(config: CreateArenaConfig): Promise<{ arenaId: number; tx: string }> {
    const result = await this.sdk.createArena(config);
    this.log(`createArena -> arenaId: ${result.arenaId}, tx: ${result.tx}`);
    this.log(`  Explorer: ${EXPLORER_BASE}/${result.tx}?cluster=devnet`);
    return result;
  }

  async registerProfile(botName: string, keypair: Keypair): Promise<void> {
    const botSdk = RitArena.fromKeypair(this.connection, keypair);
    const existing = await botSdk.getProfile(keypair.publicKey);
    if (existing) {
      this.log(`registerProfile -> "${botName}" already registered`);
      return;
    }
    const tx = await botSdk.registerProfile(botName);
    this.log(`registerProfile -> "${botName}" registered (tx: ${tx})`);
  }

  async enterArena(arenaId: number, keypair: Keypair): Promise<string> {
    const botSdk = RitArena.fromKeypair(this.connection, keypair);
    const tx = await botSdk.enterArena(arenaId);

    const profilePda = pdas.agentProfile(keypair.publicKey);
    const arenaPda = pdas.arena(arenaId);
    const entryPda = pdas.arenaEntry(arenaPda, profilePda);
    const pubkey58 = keypair.publicKey.toBase58();
    this.botPdas.set(pubkey58, { profilePda, entryPda });
    this.allEntryPdas.push(entryPda);

    this.log(`enterArena -> ${pubkey58.slice(0, 8)}... (tx: ${tx})`);
    return tx;
  }

  async startArena(arenaId: number): Promise<void> {
    const tx = await this.sdk.startArena(arenaId);
    this.log(`startArena -> arena ${arenaId} (tx: ${tx})`);
  }

  async submitElimination(arenaId: number, round: RoundResult): Promise<void> {
    const leaves = round.actions.map(hashLeaf);
    const merkleRoot = computeMerkleRoot(leaves);

    const eliminated = round.deaths.map((d) => {
      const pubkey58 = d.keypair.publicKey.toBase58();
      const pdaInfo = this.botPdas.get(pubkey58);
      if (!pdaInfo) throw new Error(`No entry PDA for bot ${d.botId}`);
      return pdaInfo.entryPda;
    });

    const scores = this.allEntryPdas.map((entryPda) => ({
      entry: entryPda,
      score: 0,
    }));

    const params: SubmitEliminationParams = {
      merkleRoot: new Uint8Array(merkleRoot),
      roundNumber: round.roundNumber,
      eliminated,
      scores,
      entryAccounts: this.allEntryPdas,
    };

    const tx = await this.sdk.submitElimination(arenaId, params);
    this.log(`submitElimination -> round ${round.roundNumber} (tx: ${tx})`);
    this.log(`  Explorer: ${EXPLORER_BASE}/${tx}?cluster=devnet`);
  }

  async finalizeArena(arenaId: number, winner: BotIdentity, _allBots: BotIdentity[]): Promise<void> {
    const pubkey58 = winner.keypair.publicKey.toBase58();
    const winnerPda = this.botPdas.get(pubkey58);
    if (!winnerPda) throw new Error(`No entry PDA for winner ${winner.botId}`);

    const leaves = [Buffer.from(`final:${winner.botId}`)];
    const merkleRoot = computeMerkleRoot(leaves);

    const params: FinalizeArenaParams = {
      merkleRoot: new Uint8Array(merkleRoot),
      winners: [{ entry: winnerPda.entryPda, rank: 1 }],
      entryAccounts: this.allEntryPdas,
    };

    const tx = await this.sdk.finalizeArena(arenaId, params);
    this.log(`finalizeArena -> winner: ${winner.botId} (tx: ${tx})`);
    this.log(`  Explorer: ${EXPLORER_BASE}/${tx}?cluster=devnet`);
  }
}
