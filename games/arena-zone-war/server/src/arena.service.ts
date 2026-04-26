import fs from "fs";
import path from "path";

import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  computeMerkleRoot,
  GameServer,
  hashLeaf,
  pdas,
  RitArena,
} from "@ritarena/sdk";
import type { GameAction, ScoreUpdate } from "@ritarena/sdk";

type ArenaServiceConfig = {
  mode: string;
  rpcUrl: string;
  walletPath?: string;
  profileName: string;
  arena: {
    entryFee: number;
    duration: number;
    minAgents: number;
    maxAgents: number;
    prizeSplit: number[];
    actionSchema: string;
  };
};

export interface ArenaWinner {
  arenaId: number;
  top3: Array<{
    rank: number;
    pubkey: string;
    name: string | null;
    prizeUsdc: number;
  }>;
  explorerUrl?: string;
}

export class ArenaService {
  private connection: Connection;
  private keypair: Keypair | null = null;
  private sdk: RitArena | null = null;
  private usdcMint: PublicKey | null = null;
  private arenaId: number | null = null;
  private roundNumber = 0;
  private mode: string;
  private profileName: string;
  private arenaConfig: ArenaServiceConfig["arena"];
  private participantEntries = new Map<string, PublicKey>();
  private historyCache: ArenaWinner[] = [];
  private historyCacheTime = 0;
  private readonly historyCacheTtl = 30_000;

  public server!: GameServer;

  constructor(config: ArenaServiceConfig) {
    this.mode = config.mode;
    this.connection = new Connection(config.rpcUrl, "confirmed");
    this.profileName = config.profileName;
    this.arenaConfig = config.arena;

    if (this.isMockMode()) {
      console.log("Arena mode: mock");
      return;
    }

    const walletPath =
      config.walletPath || path.resolve(process.cwd(), "wallet.json");

    if (!fs.existsSync(walletPath)) {
      throw new Error(`Wallet not found: ${walletPath}`);
    }

    const secret = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
    this.keypair = Keypair.fromSecretKey(new Uint8Array(secret));

    console.log("Arena mode: onchain");
    console.log("Wallet:", this.keypair.publicKey.toBase58());
  }

  get currentArenaId() {
    return this.arenaId;
  }

  isMockMode() {
    return this.mode === "mock";
  }

  get publicKey(): PublicKey | null {
    return this.keypair?.publicKey ?? null;
  }

  async init() {
    if (this.isMockMode()) {
      this.server = this.createGameServer();
      this.bindServerEvents();
      return;
    }

    const keypair = this.requireKeypair();
    this.sdk = RitArena.fromKeypair(this.connection, keypair);

    const protocol = await this.sdk.getProtocol();
    if (!protocol) {
      throw new Error("Protocol not initialized. Run SDK devnet setup first.");
    }

    this.usdcMint = protocol.usdcMint;
    console.log("USDC Mint:", this.usdcMint.toBase58());

    await this.ensureUsdcAccount();
    await this.ensureProfile();

    this.server = this.createGameServer();
    this.bindServerEvents();
  }

  /**
   * After a match finalizes on-chain, create a fresh oracle session so another arena can run.
   */
  async recycleSession() {
    this.server = this.createGameServer();
    this.bindServerEvents();
    this.arenaId = await this.server.createAndWait();
    this.roundNumber = 0;
    this.participantEntries.clear();
    console.log("Arena (new session):", this.arenaId);
  }

  private createGameServer() {
    if (this.isMockMode()) {
      return new GameServer(null, null, {
        entryFee: this.arenaConfig.entryFee,
        duration: this.arenaConfig.duration,
        minAgents: this.arenaConfig.minAgents,
        maxAgents: this.arenaConfig.maxAgents,
        prizeSplit: this.arenaConfig.prizeSplit,
        actionSchema: this.arenaConfig.actionSchema,
        mock: true,
      });
    }

    const keypair = this.requireKeypair();
    return new GameServer(this.connection, keypair, {
      entryFee: this.arenaConfig.entryFee,
      duration: this.arenaConfig.duration,
      minAgents: this.arenaConfig.minAgents,
      maxAgents: this.arenaConfig.maxAgents,
      prizeSplit: this.arenaConfig.prizeSplit,
      actionSchema: this.arenaConfig.actionSchema,
    });
  }

  async createArena() {
    this.arenaId = await this.server.createAndWait();
    this.roundNumber = 0;
    this.participantEntries.clear();
    console.log("Arena:", this.arenaId);
  }

  async startArena() {
    await this.server.start();
    console.log("Arena started");
  }

  async registerParticipant(pubkeyInput: string): Promise<{ owner: PublicKey; name: string | null }> {
    if (this.arenaId === null) {
      throw new Error("Arena is not ready yet");
    }

    const owner = new PublicKey(pubkeyInput);

    if (this.participantEntries.has(owner.toBase58())) {
      throw new Error("Player already registered in this arena");
    }

    if (this.isMockMode()) {
      this.participantEntries.set(owner.toBase58(), owner);
      return { owner, name: null };
    }

    const sdk = this.requireSdk();
    const profile = await sdk.getProfile(owner);
    if (!profile) {
      throw new Error("Player profile not found on RitArena");
    }

    const entry = await sdk.getAgentDetails(this.arenaId, owner);
    if (!entry) {
      throw new Error("Player has not entered the active arena");
    }

    const arenaPda = pdas.arena(this.arenaId);
    const profilePda = pdas.agentProfile(owner);
    const entryPda = pdas.arenaEntry(arenaPda, profilePda);

    this.participantEntries.set(owner.toBase58(), entryPda);
    return { owner, name: profile.name };
  }

  async reportRound(
    eliminated: PublicKey[],
    scores: ScoreUpdate[],
    actions: GameAction[],
  ) {
    if (this.participantEntries.size === 0) {
      return null;
    }

    if (this.isMockMode()) {
      return this.server.reportRound(eliminated, scores, actions);
    }

    const arenaId = this.requireArenaId();
    const sdk = this.requireSdk();
    const nextRound = this.roundNumber + 1;

    const eliminatedEntries = eliminated.map((pubkey) => {
      const entry = this.participantEntries.get(pubkey.toBase58());
      if (!entry) {
        throw new Error(`Missing arena entry for ${pubkey.toBase58()}`);
      }
      return entry;
    });

    const scoreUpdates = scores.map((score) => ({
      entry: this.participantEntries.get(score.entry.toBase58()) ?? score.entry,
      score: score.score,
    }));

    const merkleRoot = computeMerkleRoot(
      actions.map((action) =>
        hashLeaf({
          snakeId: action.snakeId,
          round: action.round,
          tick: action.tick,
          action: action.action,
          result: action.result,
          score: action.score,
        }),
      ),
    );

    const tx = await sdk.submitElimination(arenaId, {
      merkleRoot: new Uint8Array(merkleRoot),
      roundNumber: nextRound,
      eliminated: eliminatedEntries,
      scores: scoreUpdates,
      entryAccounts: [...this.participantEntries.values()],
    });

    this.roundNumber = nextRound;
    console.log("Round reported:", nextRound, tx);

    return { round: nextRound, tx };
  }

  async finishArena(winners: Array<{ pubkey: PublicKey; rank: number }>) {
    if (this.isMockMode()) {
      await this.server.finish(winners);
      console.log("Game finished");
      return;
    }

    const arenaId = this.requireArenaId();
    const sdk = this.requireSdk();

    const assignments = winners.map((winner) => {
      const entry = this.participantEntries.get(winner.pubkey.toBase58());
      if (!entry) {
        throw new Error(`Missing winner entry for ${winner.pubkey.toBase58()}`);
      }

      return {
        entry,
        rank: winner.rank,
      };
    });

    const merkleRoot = computeMerkleRoot(
      winners.map((winner) =>
        hashLeaf({
          snakeId: winner.pubkey.toBase58(),
          round: this.roundNumber,
          tick: winner.rank,
          action: "finish",
          result: `rank:${winner.rank}`,
          score: winner.rank,
        }),
      ),
    );

    await sdk.finalizeArena(arenaId, {
      merkleRoot: new Uint8Array(merkleRoot),
      winners: assignments,
      entryAccounts: [...this.participantEntries.values()],
    });

    try {
      await sdk.collectProtocolFee(arenaId);
    } catch (error) {
      console.warn("collectProtocolFee skipped:", error);
    }

    try {
      await sdk.claimCreatorFee(arenaId);
      console.log("Creator fee claimed");
    } catch (error) {
      console.warn("claimCreatorFee skipped:", error);
    }

    try {
      await sdk.returnStakeBond(arenaId);
      console.log("Stake bond returned");
    } catch (error) {
      console.warn("returnStakeBond skipped:", error);
    }

    console.log("Game finished");
  }

  async getHistory(count: number = 10): Promise<ArenaWinner[]> {
    if (this.isMockMode()) {
      return this.historyCache.slice(-count);
    }

    if (Date.now() - this.historyCacheTime < this.historyCacheTtl) {
      return this.historyCache.slice(-count);
    }

    const sdk = this.requireSdk();

    try {
      const arenas = await sdk.listArenas({ state: "finished" });
      const finishedArenas = arenas
        .filter((a) => "finished" in a.state)
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, count);

      const winners: ArenaWinner[] = [];

      for (const arena of finishedArenas) {
        const entries = await sdk.getArenaEntries(Number(arena.id));
        const prizeWinners = entries
          .filter((e) => e.prizeRank > 0)
          .sort((a, b) => a.prizeRank - b.prizeRank)
          .slice(0, 3);

        if (prizeWinners.length === 0) continue;

        const prizePool = Number(arena.totalEntryFees);
        const top3 = await Promise.all(
          prizeWinners.map(async (entry) => {
            const profile = await sdk.getProfile(entry.owner);
            const prizePercent = arena.prizeSplit[entry.prizeRank - 1] ?? 0;
            const prizeUsdc = (prizePool * prizePercent) / 100 / 1_000_000;
            return {
              rank: entry.prizeRank,
              pubkey: entry.owner.toBase58(),
              name: profile?.name ?? null,
              prizeUsdc,
            };
          })
        );

        let explorerUrl: string | undefined;
        try {
          const arenaPda = pdas.arena(Number(arena.id));
          const sigs = await this.connection.getSignaturesForAddress(arenaPda, { limit: 5 });
          const finalized = sigs.find(
            (s) => s.confirmationStatus === "finalized" && !s.err
          );
          if (finalized) {
            explorerUrl = `https://explorer.solana.com/tx/${finalized.signature}?cluster=devnet`;
          }
        } catch {}

        winners.push({
          arenaId: Number(arena.id),
          top3,
          explorerUrl,
        });
      }

      this.historyCache = winners;
      this.historyCacheTime = Date.now();
      return winners;
    } catch (error) {
      console.error("getHistory error:", error);
      return this.historyCache.slice(-count);
    }
  }

  private bindServerEvents() {
    this.server.on("phase", (phase) => console.log("Phase:", phase));
    this.server.on("error", (error) => console.error(error));
  }

  private async ensureUsdcAccount() {
    const sdk = this.requireSdk();
    const keypair = this.requireKeypair();
    const usdcMint = this.requireUsdcMint();

    console.log("Ensuring USDC ATA...");

    const ata = await getOrCreateAssociatedTokenAccount(
      this.connection,
      keypair,
      usdcMint,
      keypair.publicKey,
    );

    console.log("USDC ATA:", ata.address.toBase58());

    const balance = Number(ata.amount);
    if (balance < 10_000_000) {
      console.log("Low USDC -> using SDK faucet...");
      await sdk.mintTestUsdc(20_000_000, keypair.publicKey);
      console.log("Minted 20 USDC");
      return;
    }

    console.log(`USDC balance OK: ${(balance / 1_000_000).toFixed(2)}`);
  }

  private async ensureProfile() {
    const sdk = this.requireSdk();
    const keypair = this.requireKeypair();

    const existing = await sdk.getProfile(keypair.publicKey);
    if (existing) {
      console.log("Profile already exists");
      return;
    }

    console.log("No profile -> registering...");
    await sdk.registerProfile(this.profileName);
    console.log("Profile registered");
  }

  private requireArenaId() {
    if (this.arenaId === null) {
      throw new Error("Arena has not been created yet");
    }
    return this.arenaId;
  }

  private requireKeypair() {
    if (!this.keypair) {
      throw new Error("Keypair is required for on-chain arena mode");
    }
    return this.keypair;
  }

  private requireSdk() {
    if (!this.sdk) {
      throw new Error("SDK is not initialized");
    }
    return this.sdk;
  }

  private requireUsdcMint() {
    if (!this.usdcMint) {
      throw new Error("USDC mint is not initialized");
    }
    return this.usdcMint;
  }
}
