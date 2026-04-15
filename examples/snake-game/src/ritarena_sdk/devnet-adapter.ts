// examples/snake-game/src/ritarena_sdk/devnet-adapter.ts

import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createHash } from "crypto";
import {
  RitArena,
  pdas,
  type CreateArenaConfig,
  type SubmitEliminationParams,
  type FinalizeArenaParams,
} from "@ritarena/sdk";
import type {
  ArenaAdapter, RoundResult, BotIdentity, ArenaAdapterEvents,
  LogKind, PreflightCheck,
} from "./adapter.js";
import { hashLeaf, computeMerkleRoot } from "./merkle.js";

const RPC_URL = "https://api.devnet.solana.com";
const EXPLORER_TX = "https://explorer.solana.com/tx";
const EXPLORER_ADDR = "https://explorer.solana.com/address";

export class DevnetAdapter implements ArenaAdapter {
  private connection: Connection;
  private oracleKeypair: Keypair;
  private sdk: RitArena;
  private events: ArenaAdapterEvents;
  private botPdas: Map<string, { profilePda: PublicKey; entryPda: PublicKey }> = new Map();
  private allEntryPdas: PublicKey[] = [];
  private botKeypairs: Keypair[] = [];
  private entryFee = 5_000_000;

  constructor(oracleKeypair: Keypair, events: ArenaAdapterEvents) {
    this.connection = new Connection(RPC_URL, "confirmed");
    this.oracleKeypair = oracleKeypair;
    this.sdk = RitArena.fromKeypair(this.connection, oracleKeypair);
    this.events = events;
  }

  private log(message: string, kind: LogKind, tx?: string): void {
    const formatted = `[RitArena] ${message}`;
    const explorerUrl = tx ? `${EXPLORER_TX}/${tx}?cluster=devnet` : undefined;
    console.log(formatted);
    if (explorerUrl) console.log(`  Explorer: ${explorerUrl}`);
    this.events.onLog({ message: formatted, kind, tx, explorerUrl });
  }

  getArenaAddress(arenaId: number): string {
    return pdas.arena(arenaId).toBase58();
  }

  getArenaExplorerUrl(arenaId: number): string {
    return `${EXPLORER_ADDR}/${this.getArenaAddress(arenaId)}?cluster=devnet`;
  }

  async preflight(): Promise<PreflightCheck[]> {
    const checks: PreflightCheck[] = [];

    try {
      const balance = await this.connection.getBalance(this.oracleKeypair.publicKey);
      const solBalance = balance / LAMPORTS_PER_SOL;
      checks.push({
        name: "Oracle wallet SOL",
        status: solBalance >= 0.01 ? "ok" : "fail",
        detail: `${solBalance.toFixed(4)} SOL`,
      });
    } catch {
      checks.push({ name: "Oracle wallet SOL", status: "fail", detail: "Cannot connect to devnet" });
    }

    try {
      const protocol = await this.sdk.getProtocol();
      checks.push({
        name: "Protocol initialized",
        status: protocol ? "ok" : "fail",
        detail: protocol ? "Found" : "Not initialized. See packages/sdk README",
      });
    } catch {
      checks.push({ name: "Protocol initialized", status: "fail", detail: "Cannot read protocol" });
    }

    for (let i = 0; i < 8; i++) {
      const seed = createHash("sha256")
        .update(Buffer.from(this.oracleKeypair.secretKey))
        .update(Buffer.from([i]))
        .digest();
      const botKp = Keypair.fromSeed(seed.slice(0, 32));
      this.botKeypairs.push(botKp);

      try {
        const balance = await this.connection.getBalance(botKp.publicKey);
        const solBalance = balance / LAMPORTS_PER_SOL;
        checks.push({
          name: `Bot ${i} SOL`,
          status: solBalance >= 0.05 ? "ok" : "fail",
          detail: `${solBalance.toFixed(4)} SOL`,
        });
      } catch {
        checks.push({ name: `Bot ${i} SOL`, status: "fail", detail: "Cannot check" });
      }
    }

    return checks;
  }

  async createArena(config: CreateArenaConfig): Promise<{ arenaId: number; tx: string }> {
    this.entryFee = config.entryFee;
    const result = await this.sdk.createArena(config);
    this.log(`createArena -> arenaId: ${result.arenaId}`, "create", result.tx);
    return result;
  }

  async registerProfile(botName: string, keypair: Keypair): Promise<void> {
    const botSdk = RitArena.fromKeypair(this.connection, keypair);
    const existing = await botSdk.getProfile(keypair.publicKey);
    if (existing) {
      this.log(`registerProfile -> "${botName}" already registered`, "register");
      return;
    }
    const tx = await botSdk.registerProfile(botName);
    this.log(`registerProfile -> "${botName}" registered`, "register", tx);
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

    this.log(`enterArena -> ${pubkey58.slice(0, 8)}...`, "enter", tx);
    return tx;
  }

  async startArena(arenaId: number): Promise<void> {
    const tx = await this.sdk.startArena(arenaId);
    this.log(`startArena -> arena ${arenaId}`, "start", tx);
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
    this.log(`submitElimination -> round ${round.roundNumber}`, "eliminate", tx);
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
    this.log(`finalizeArena -> winner: ${winner.botId}`, "finalize", tx);
  }
}
