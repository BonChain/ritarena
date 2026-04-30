// sdk/src/game-server.ts

import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { createHash } from "crypto";
import { EventEmitter } from "events";

import { RitArena } from "./client";
import { RitArenaReader } from "./reader";
import { pdas } from "./pda";
import { RitArenaError } from "./errors";
import type {
  CreateArenaConfig,
  GameServerConfig,
  GameAction,
  RoundReport,
  ArenaInfo,
  ScoreUpdate,
  SubmitEliminationParams,
  FinalizeArenaParams,
  PrizeAssignment,
} from "./types";
import { BATTLE_ROYALE_TEMPLATE } from "./types";
import { hashLeaf, computeMerkleRoot } from "./merkle";

type Phase = "idle" | "setup" | "active" | "finished" | "cancelled";

export interface LogEntry {
  message: string;
  kind: string;
  tx?: string;
  explorerUrl?: string;
}

export class GameServer extends EventEmitter {
  private connection: Connection | null;
  private oracleKeypair: Keypair | null;
  private sdk: RitArena | null;
  private config: GameServerConfig;

  private _arenaId: number | null = null;
  private _phase: Phase = "idle";
  private onChainRound = 0;
  private entryPdas: Map<string, PublicKey> = new Map();
  private allEntryPdas: PublicKey[] = [];
  private roundLock = false;

  private retryAttempts: number;
  private retryBaseDelay: number;
  private isMock: boolean;

  constructor(
    connection: Connection | null,
    oracleKeypair: Keypair | null,
    config: GameServerConfig
  ) {
    super();
    this.connection = connection;
    this.oracleKeypair = oracleKeypair;
    this.config = config;
    this.retryAttempts = config.retryAttempts ?? 3;
    this.retryBaseDelay = config.retryBaseDelay ?? 1000;
    this.isMock = config.mock ?? false;

    if (!this.isMock) {
      if (!connection) throw new Error("Connection required for non-mock mode");
      if (!oracleKeypair) throw new Error("Oracle keypair required for non-mock mode");
      this.sdk = RitArena.fromKeypair(connection, oracleKeypair);
    } else {
      this.sdk = null;
    }
  }

  get arenaId(): number | null { return this._arenaId; }
  get phase(): Phase { return this._phase; }
  get currentRound(): number { return this.onChainRound; }

  // --- Lifecycle: Create ---

  async createAndWait(): Promise<number> {
    this.assertPhase("idle", "createAndWait");
    const arenaConfig = this.buildArenaConfig();
    this.setPhase("setup");

    if (this.isMock) {
      this._arenaId = 0;
      this.log("createArena -> arenaId: 0 (mock)", "create");
      return 0;
    }

    const { arenaId, tx } = await this.retryRpc(
      () => this.sdk!.createArena(arenaConfig),
      "createArena"
    );
    this._arenaId = arenaId;
    this.log(`createArena -> arenaId: ${arenaId}`, "create", tx);

    this.log("Waiting for arena account to propagate...", "info");
    const reader = RitArena.readOnly(this.connection!);
    for (let i = 0; i < 15; i++) {
      const found = await reader.getArena(arenaId);
      if (found) break;
      await this.sleep(2000);
    }

    return arenaId;
  }

  // --- Lifecycle: Setup with bots (demo mode) ---

  async setupWithBots(keypairs: Keypair[]): Promise<number> {
    const arenaId = await this.createAndWait();

    if (!this.isMock) {
      for (const kp of keypairs) {
        const profile = await this.sdk!.getProfile(kp.publicKey);
        if (!profile) {
          const botSdk = RitArena.fromKeypair(this.connection!, kp);
          const tx = await this.retryRpc(
            () => botSdk.registerProfile(kp.publicKey.toBase58().slice(0, 8)),
            "registerProfile"
          );
          this.log(`registerProfile -> ${kp.publicKey.toBase58().slice(0, 8)}`, "register", tx);
        } else {
          this.log(`registerProfile -> ${kp.publicKey.toBase58().slice(0, 8)} (exists)`, "register");
        }

        const botSdk = RitArena.fromKeypair(this.connection!, kp);
        const tx = await this.retryRpc(
          () => botSdk.enterArena(arenaId),
          "enterArena"
        );
        this.log(`enterArena -> ${kp.publicKey.toBase58().slice(0, 8)}`, "enter", tx);

        const profilePda = pdas.agentProfile(kp.publicKey);
        const arenaPda = pdas.arena(arenaId);
        const entryPda = pdas.arenaEntry(arenaPda, profilePda);
        this.entryPdas.set(kp.publicKey.toBase58(), entryPda);
        this.allEntryPdas.push(entryPda);
      }
    } else {
      for (let i = 0; i < (keypairs.length || this.config.maxAgents); i++) {
        this.log(`registerProfile -> bot-${i} (mock)`, "register");
        this.log(`enterArena -> bot-${i} (mock)`, "enter");
      }
    }

    await this.start();
    return arenaId;
  }

  // --- Lifecycle: Start ---

  async start(): Promise<void> {
    this.assertPhase("setup", "start");
    if (this._arenaId === null) {
      throw new RitArenaError("ARENA_NOT_FOUND",
        "No arena created yet",
        "Call createAndWait() or setupWithBots() first.");
    }

    if (!this.isMock) {
      const tx = await this.retryRpc(
        () => this.sdk!.startArena(this._arenaId!),
        "startArena"
      );
      this.log(`startArena -> arena ${this._arenaId} now Active`, "start", tx);
    } else {
      this.log(`startArena -> arena ${this._arenaId} now Active (mock)`, "start");
    }

    this.setPhase("active");
  }

  // --- Gameplay: Report Round ---

  async reportRound(
    eliminated: PublicKey[],
    scores: ScoreUpdate[],
    actions: GameAction[]
  ): Promise<RoundReport> {
    this.assertPhase("active", "reportRound");

    if (this.roundLock) {
      throw new RitArenaError("ROUND_IN_PROGRESS",
        "A round submission is already in progress",
        "Wait for the previous reportRound() to complete.");
    }

    this.roundLock = true;
    const roundNumber = this.onChainRound + 1;

    try {
      if (this.isMock) {
        this.onChainRound++;
        const deathNames = eliminated.map((p) => p.toBase58().slice(0, 8)).join(", ") || "none";
        this.log(`submitElimination -> round ${roundNumber}, eliminated: [${deathNames}]`, "eliminate");
        return { confirmed: true, tx: `mock-tx-round-${roundNumber}`, round: roundNumber };
      }

      const leaves = actions.map((a) => hashLeaf(a as unknown as Record<string, string | number>));
      const merkleRoot = computeMerkleRoot(leaves);

      const eliminatedEntries = eliminated.map((pk) => {
        const entryPda = this.entryPdas.get(pk.toBase58());
        if (!entryPda) {
          throw new RitArenaError("ENTRY_NOT_FOUND",
            `No entry PDA for ${pk.toBase58().slice(0, 8)}`,
            "This public key was not registered via setupWithBots() or tracked via start().");
        }
        return entryPda;
      });

      const scoreUpdates = scores.map((s) => ({
        entry: this.entryPdas.get(s.entry.toBase58()) ?? s.entry,
        score: s.score,
      }));

      const params: SubmitEliminationParams = {
        merkleRoot: new Uint8Array(merkleRoot),
        roundNumber,
        eliminated: eliminatedEntries,
        scores: scoreUpdates,
        entryAccounts: this.allEntryPdas,
      };

      const tx = await this.retryRpc(
        () => this.sdk!.submitElimination(this._arenaId!, params),
        "submitElimination"
      );

      this.onChainRound++;
      this.log(`submitElimination -> round ${roundNumber}`, "eliminate", tx);
      return { confirmed: true, tx, round: roundNumber };

    } catch (err: any) {
      this.emit("error", err);
      this.log(`submitElimination failed: ${err.message}`, "info");
      return { confirmed: false, round: roundNumber };
    } finally {
      this.roundLock = false;
    }
  }

  // --- Lifecycle: Finish ---

  async finish(winners: Array<{ pubkey: PublicKey; rank: number }>): Promise<void> {
    this.assertPhase("active", "finish");

    if (winners.length !== this.config.prizeSplit.length) {
      throw new RitArenaError("WINNERS_MISMATCH",
        `${winners.length} winners provided but prizeSplit has ${this.config.prizeSplit.length} slots`,
        "Winners array length must match prizeSplit length.");
    }

    if (this.isMock) {
      this.log(`finalizeArena -> winners: ${winners.map((w) => w.pubkey.toBase58().slice(0, 8)).join(", ")}`, "finalize");
      this.log("collectProtocolFee -> collected (mock)", "finalize");
      this.setPhase("finished");
      return;
    }

    const winnerAssignments: PrizeAssignment[] = winners.map((w) => {
      const entryPda = this.entryPdas.get(w.pubkey.toBase58());
      if (!entryPda) {
        throw new RitArenaError("WINNER_NOT_FOUND",
          `No entry PDA for winner ${w.pubkey.toBase58().slice(0, 8)}`,
          "Winner must have entered the arena via enterArena().");
      }
      return { entry: entryPda, rank: w.rank };
    });

    const leaves = winners.map((w) => {
      const data = `final:${w.pubkey.toBase58()}:rank:${w.rank}`;
      return createHash("sha256").update(data).digest() as Buffer;
    });
    const merkleRoot = computeMerkleRoot(leaves);

    const params: FinalizeArenaParams = {
      merkleRoot: new Uint8Array(merkleRoot),
      winners: winnerAssignments,
      entryAccounts: this.allEntryPdas,
    };

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const tx = await this.sdk!.finalizeArena(this._arenaId!, params);
        this.log(`finalizeArena -> ${winners.length} winner(s)`, "finalize", tx);
        break;
      } catch (err: any) {
        if (attempt < 3) {
          this.log(`finalizeArena failed (attempt ${attempt}/3), retrying...`, "info");
          await this.sleep(2000);
        } else {
          this.log(`finalizeArena failed after 3 attempts: ${err.message}`, "info");
          this.emit("error", err);
        }
      }
    }

    try {
      await this.sdk!.collectProtocolFee(this._arenaId!);
      this.log("collectProtocolFee -> collected", "finalize");
    } catch {
      // Already collected or not applicable — OK
    }

    this.setPhase("finished");
  }

  // --- Lifecycle: Cancel / Abandon ---

  async cancel(): Promise<void> {
    this.assertPhase("setup", "cancel");
    if (this._arenaId === null) return;

    if (!this.isMock) {
      try {
        const tx = await this.retryRpc(
          () => (this.sdk! as any).cancelArena?.(this._arenaId!) ??
            Promise.reject(new Error("cancelArena not yet implemented in SDK")),
          "cancelArena"
        );
        this.log(`cancelArena -> arena ${this._arenaId}`, "info", tx as string);
      } catch (err: any) {
        this.log(`cancelArena failed: ${err.message}`, "info");
        this.emit("error", err);
      }
    }

    this.setPhase("cancelled");
  }

  async abandon(): Promise<void> {
    if (this._arenaId === null) return;

    if (!this.isMock) {
      try {
        const tx = await this.retryRpc(
          () => (this.sdk! as any).abandonArena?.(this._arenaId!) ??
            Promise.reject(new Error("abandonArena not yet implemented in SDK")),
          "abandonArena"
        );
        this.log(`abandonArena -> arena ${this._arenaId}`, "info", tx as string);
      } catch (err: any) {
        this.log(`abandonArena failed: ${err.message}`, "info");
        this.emit("error", err);
      }
    }

    this.setPhase("cancelled");
  }

  // --- Info ---

  getArenaInfo(): ArenaInfo | null {
    if (this._arenaId === null) return null;

    const arenaPda = pdas.arena(this._arenaId);
    return {
      arenaId: this._arenaId,
      entryFee: this.config.entryFee / 1_000_000,
      prizePool: (this.config.entryFee * this.config.maxAgents) / 1_000_000,
      prizeSplit: this.config.prizeSplit,
      currentRound: this.onChainRound,
      phase: this._phase,
      arenaPda: arenaPda.toBase58(),
    };
  }

  // --- Internal helpers ---

  private buildArenaConfig(): CreateArenaConfig {
    const rulesHash = createHash("sha256")
      .update(this.config.actionSchema)
      .digest();

    const duration = this.config.duration ?? 3600;

    return {
      ...BATTLE_ROYALE_TEMPLATE,
      entryFee: this.config.entryFee,
      maxAgents: this.config.maxAgents,
      minAgents: this.config.minAgents ?? 2,
      duration,
      eliminationInterval: this.config.eliminationInterval ?? duration + 100,
      eliminationPercent: 1,
      creatorFeeBps: this.config.creatorFeeBps ?? 0,
      prizeSplit: this.config.prizeSplit,
      actionSchema: this.config.actionSchema,
      rulesHash: new Uint8Array(rulesHash),
      stakeBondAmount: this.config.stakeBondAmount ?? 0,
    };
  }

  private assertPhase(expected: Phase, method: string): void {
    if (this._phase !== expected) {
      throw new RitArenaError("INVALID_PHASE",
        `${method}() requires phase "${expected}", current phase is "${this._phase}"`,
        "Call the lifecycle methods in order: createAndWait/setupWithBots -> start -> reportRound -> finish");
    }
  }

  private setPhase(phase: Phase): void {
    this._phase = phase;
    this.emit("phase", phase);
  }

  private log(message: string, kind: string, tx?: string): void {
    const formatted = `[RitArena] ${message}`;
    const explorerUrl = tx && !tx.startsWith("mock-")
      ? `https://explorer.solana.com/tx/${tx}?cluster=devnet`
      : undefined;
    const entry: LogEntry = { message: formatted, kind, tx, explorerUrl };
    console.log(formatted);
    if (explorerUrl) console.log(`  Explorer: ${explorerUrl}`);
    this.emit("log", entry);
  }

  private async retryRpc<T>(fn: () => Promise<T>, label: string): Promise<T> {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        const msg = err.message ?? "";
        const isRetryable = msg.includes("timeout") ||
          msg.includes("429") ||
          msg.includes("blockhash") ||
          msg.includes("Blockhash not found");

        if (!isRetryable || attempt === this.retryAttempts) throw err;

        const delay = Math.min(this.retryBaseDelay * Math.pow(2, attempt - 1), 8000);
        this.log(`${label} failed (attempt ${attempt}/${this.retryAttempts}), retrying in ${delay}ms...`, "info");
        await this.sleep(delay);
      }
    }
    throw new Error("unreachable");
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
