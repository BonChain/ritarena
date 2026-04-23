import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet, Idl, BN } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountIdempotentInstruction,
} from "@solana/spl-token";
import { pdas } from "./pda";
import { IDL } from "./idl";
import { RitArenaReader } from "./reader";
import { RitArenaError, arenaStateLabel } from "./errors";
import type {
  CreateArenaConfig,
  SubmitEliminationParams,
  FinalizeArenaParams,
} from "./types";

/**
 * Full RitArena client with read + write methods.
 * Use `RitArena.fromKeypair()` for server/CLI, `new RitArena()` for browser wallets.
 * @example
 * // Server/CLI
 * const sdk = RitArena.fromKeypair(connection, keypair);
 *
 * // Browser wallet
 * const sdk = new RitArena(connection, walletAdapter);
 *
 * // Read-only (no wallet)
 * const reader = RitArena.readOnly(connection);
 */
export class RitArena extends RitArenaReader {
  private wallet: Wallet;

  /** Create with a browser wallet adapter. For server/CLI use `fromKeypair()`. */
  constructor(connection: Connection, wallet: Wallet) {
    super(connection);
    this.wallet = wallet;
    const provider = new AnchorProvider(
      connection,
      wallet,
      AnchorProvider.defaultOptions()
    );
    this.program = new Program(IDL as Idl, provider);
  }

  /**
   * Create from a Keypair (server-side, CLI, game servers).
   * @example const sdk = RitArena.fromKeypair(connection, keypair);
   */
  static fromKeypair(connection: Connection, keypair: Keypair): RitArena {
    const wallet = new Wallet(keypair);
    return new RitArena(connection, wallet);
  }

  /**
   * Read-only client — no wallet needed. For dashboards, leaderboards, spectators.
   * @example const reader = RitArena.readOnly(connection);
   */
  static readOnly(connection: Connection): RitArenaReader {
    return new RitArenaReader(connection);
  }

  // --- Profile ---

  /**
   * Register an agent profile. One profile per wallet. Free since @ritarena/sdk 0.5.0.
   * @param name Display name (max MAX_NAME_LEN chars).
   * @returns Transaction signature.
   * @example
   * const existing = await sdk.getProfile(keypair.publicKey);
   * if (!existing) {
   *   await sdk.registerProfile("MyBot");
   * }
   */
  async registerProfile(name: string): Promise<string> {
    const owner = this.wallet.publicKey;
    const profilePda = pdas.agentProfile(owner);

    return await (this.program.methods as any)
      .registerProfile(name)
      .accounts({
        owner,
        agentProfile: profilePda,
      })
      .rpc();
  }

  // --- Devnet Faucet ---

  /**
   * Mint test USDC to a recipient. Devnet faucet — anyone can call. Capped at 1,000 USDC per call.
   * Only works for the protocol's registered test mint (mainnet real-USDC will reject).
   * Recipient ATA is created automatically if it doesn't exist (idempotent).
   * @param amount Amount in USDC micro-units (6 decimals). Max 1_000_000_000 (1,000 USDC).
   * @param recipient Optional recipient wallet. Defaults to the connected wallet.
   * @returns Transaction signature
   */
  async mintTestUsdc(amount: number, recipient?: PublicKey): Promise<string> {
    const caller = this.wallet.publicKey;
    const recipientOwner = recipient ?? caller;
    const protocolPda = pdas.protocol();
    const mintAuthority = pdas.testUsdcMintAuthority();

    const protocol = await this.getProtocol();
    if (!protocol) {
      throw new RitArenaError("PROTOCOL_NOT_INITIALIZED",
        "RitArena protocol not initialized on this network",
        "Run sdk/scripts/test-devnet.ts first.");
    }

    const recipientUsdc = await getAssociatedTokenAddress(
      protocol.usdcMint,
      recipientOwner
    );

    // Idempotently create the recipient ATA in the same tx — no-op if it already exists.
    const createAtaIx = createAssociatedTokenAccountIdempotentInstruction(
      caller,                // payer
      recipientUsdc,
      recipientOwner,        // owner of the ATA
      protocol.usdcMint
    );

    return await (this.program.methods as any)
      .mintTestUsdc(new BN(amount))
      .accounts({
        caller,
        protocol: protocolPda,
        usdcMint: protocol.usdcMint,
        recipientUsdc,
        mintAuthority,
      })
      .preInstructions([createAtaIx])
      .rpc();
  }

  // --- Arena Creation ---

  /**
   * Create a new arena. The caller becomes the creator AND oracle (game server).
   * Requires a registered profile.
   * @param config Arena configuration. Use `{ ...BATTLE_ROYALE_TEMPLATE, ...overrides }` for defaults.
   * @returns `{ arenaId, tx }` — the arena ID and transaction signature
   * @example
   * const { arenaId } = await sdk.createArena({
   *   ...BATTLE_ROYALE_TEMPLATE,
   *   entryFee: 10_000_000,         // 10 USDC
   *   maxAgents: 20,
   *   actionSchema: "up,down,left,right",
   * });
   */
  async createArena(
    config: CreateArenaConfig
  ): Promise<{ arenaId: number; tx: string }> {
    const creator = this.wallet.publicKey;
    const protocolPda = pdas.protocol();
    const protocol = await this.getProtocol();
    if (!protocol) {
      throw new RitArenaError("PROTOCOL_NOT_INITIALIZED",
        "RitArena protocol not initialized on this network",
        "Run the protocol initialization script first. See sdk/ README.");
    }

    const arenaId = Number(protocol.totalArenas);
    const arenaPda = pdas.arena(arenaId);
    const arenaVault = pdas.arenaVault(arenaPda);
    const bondVault = pdas.bondVault(arenaPda);
    const usdcMint = protocol.usdcMint;
    const creatorUsdc = await getAssociatedTokenAddress(usdcMint, creator);

    const tx = await (this.program.methods as any)
      .createArena(
        new BN(config.entryFee),
        config.maxAgents,
        config.minAgents,
        new BN(config.duration),
        new BN(config.eliminationInterval),
        config.eliminationPercent,
        config.creatorFeeBps,
        config.prizeSplit,
        config.actionSchema,
        Array.from(config.rulesHash),
        new BN(config.minArenasCompleted ?? 0),
        new BN(config.minWins ?? 0),
        new BN(config.minRegistrationAge ?? 0),
        new BN(config.stakeBondAmount ?? 0)
      )
      .accounts({
        creator,
        protocol: protocolPda,
        arena: arenaPda,
        usdcMint,
        arenaVault,
        bondVault,
        creatorUsdc,
      })
      .rpc();

    return { arenaId, tx };
  }

  // --- Arena Entry ---

  /**
   * Enter an arena. Deposits the entry fee into the on-chain escrow vault.
   * Requires a registered profile. Arena must be in Registration state.
   * @param arenaId Arena ID to enter
   * @returns Transaction signature
   * @example await sdk.enterArena(0);
   */
  async enterArena(arenaId: number): Promise<string> {
    const agentOwner = this.wallet.publicKey;
    const arenaPda = pdas.arena(arenaId);
    const profilePda = pdas.agentProfile(agentOwner);
    const entryPda = pdas.arenaEntry(arenaPda, profilePda);
    const arenaVault = pdas.arenaVault(arenaPda);

    const arena = await this.getArena(arenaId);
    if (!arena) {
      throw new RitArenaError("ARENA_NOT_FOUND",
        `Arena ${arenaId} not found on-chain`,
        "Arena may not have propagated yet. Use GameServer.createAndWait() for automatic polling.");
    }
    if (!("registration" in arena.state)) {
      throw new RitArenaError("ARENA_NOT_REGISTRATION",
        `Arena ${arenaId} is in ${arenaStateLabel(arena.state)} state`,
        "Agents can only enter during Registration phase.");
    }

    const agentUsdc = await getAssociatedTokenAddress(
      arena.usdcMint,
      agentOwner
    );

    // Pre-instruction: idempotently create the caller's USDC ATA if missing.
    // Required because the on-chain enter_arena handler expects agent_usdc to
    // exist, and new wallets (including humans arriving via /play on web)
    // have never held USDC.
    const preInstructions: import("@solana/web3.js").TransactionInstruction[] = [];
    const ataInfo = await this.connection.getAccountInfo(agentUsdc);
    if (ataInfo === null) {
      const { createAssociatedTokenAccountIdempotentInstruction } = await import(
        "@solana/spl-token"
      );
      preInstructions.push(
        createAssociatedTokenAccountIdempotentInstruction(
          agentOwner,
          agentUsdc,
          agentOwner,
          arena.usdcMint
        )
      );
    }

    return await (this.program.methods as any)
      .enterArena()
      .accounts({
        agentOwner,
        agentProfile: profilePda,
        arena: arenaPda,
        arenaEntry: entryPda,
        agentUsdc,
        arenaVault,
        usdcMint: arena.usdcMint,
      })
      .preInstructions(preInstructions)
      .rpc();
  }

  // --- Oracle Methods ---

  /**
   * Start the arena. Transitions Registration → Active. Oracle only.
   * @example await sdk.startArena(arenaId);
   */
  async startArena(arenaId: number): Promise<string> {
    const oracle = this.wallet.publicKey;
    const arenaPda = pdas.arena(arenaId);

    const arena = await this.getArena(arenaId);
    if (!arena) {
      throw new RitArenaError("ARENA_NOT_FOUND",
        `Arena ${arenaId} not found on-chain`,
        "Create the arena first with createArena().");
    }
    if (!("registration" in arena.state)) {
      throw new RitArenaError("ARENA_NOT_REGISTRATION",
        `Arena ${arenaId} is in ${arenaStateLabel(arena.state)} state`,
        "Arena can only be started from Registration state.");
    }
    if (arena.currentAgents < arena.minAgents) {
      throw new RitArenaError("NOT_ENOUGH_AGENTS",
        `Arena ${arenaId} has ${arena.currentAgents} agents, needs ${arena.minAgents}`,
        "Wait for more agents to enter before starting.");
    }

    return await (this.program.methods as any)
      .startArena()
      .accounts({ oracle, arena: arenaPda })
      .rpc();
  }

  /**
   * Submit scores, Merkle root, and elimination list for a round. Oracle only.
   * Prefer `GameServer.reportRound()` which handles merkle computation automatically.
   */
  async submitElimination(
    arenaId: number,
    params: SubmitEliminationParams
  ): Promise<string> {
    const oracle = this.wallet.publicKey;
    const arenaPda = pdas.arena(arenaId);

    const arena = await this.getArena(arenaId);
    if (!arena) {
      throw new RitArenaError("ARENA_NOT_FOUND",
        `Arena ${arenaId} not found on-chain`,
        "Create and start the arena first.");
    }
    if ("finished" in arena.state || "cancelled" in arena.state || "abandoned" in arena.state) {
      throw new RitArenaError("ARENA_ALREADY_FINISHED",
        `Arena ${arenaId} is ${arenaStateLabel(arena.state)}`,
        "Cannot submit elimination after arena has ended.");
    }
    if (params.roundNumber !== arena.currentRound + 1) {
      throw new RitArenaError("INVALID_ROUND",
        `Expected round ${arena.currentRound + 1}, got ${params.roundNumber}`,
        "Use GameServer which tracks round numbers automatically.");
    }

    return await (this.program.methods as any)
      .submitElimination(
        Array.from(params.merkleRoot),
        params.roundNumber,
        params.eliminated,
        params.scores.map((s) => ({
          entry: s.entry,
          score: new BN(s.score),
        }))
      )
      .accounts({
        oracle,
        arena: arenaPda,
      })
      .remainingAccounts(
        params.entryAccounts.map((pk) => ({
          pubkey: pk,
          isSigner: false,
          isWritable: true,
        }))
      )
      .rpc();
  }

  /**
   * End the arena and assign prize ranks. Oracle only.
   * Prefer `GameServer.finish()` which handles merkle + retry automatically.
   */
  async finalizeArena(
    arenaId: number,
    params: FinalizeArenaParams
  ): Promise<string> {
    const oracle = this.wallet.publicKey;
    const arenaPda = pdas.arena(arenaId);

    const arena = await this.getArena(arenaId);
    if (!arena) {
      throw new RitArenaError("ARENA_NOT_FOUND",
        `Arena ${arenaId} not found on-chain`,
        "Create and start the arena first.");
    }
    if ("finished" in arena.state) {
      throw new RitArenaError("ARENA_ALREADY_FINISHED",
        `Arena ${arenaId} is already Finished`,
        "Arena has already been finalized.");
    }

    return await (this.program.methods as any)
      .finalizeArena(
        Array.from(params.merkleRoot),
        params.winners.map((w) => ({
          entry: w.entry,
          rank: w.rank,
        }))
      )
      .accounts({
        oracle,
        arena: arenaPda,
      })
      .remainingAccounts(
        params.entryAccounts.map((pk) => ({
          pubkey: pk,
          isSigner: false,
          isWritable: true,
        }))
      )
      .rpc();
  }

  // --- Claims ---

  /** Withdraw prize winnings. Only for agents who finished in a prize position. Arena must be Finished. */
  async claimPrize(arenaId: number): Promise<string> {
    const winner = this.wallet.publicKey;
    const arenaPda = pdas.arena(arenaId);
    const profilePda = pdas.agentProfile(winner);
    const entryPda = pdas.arenaEntry(arenaPda, profilePda);
    const arenaVault = pdas.arenaVault(arenaPda);

    const arena = await this.getArena(arenaId);
    if (!arena) {
      throw new RitArenaError("ARENA_NOT_FOUND",
        `Arena ${arenaId} not found on-chain`,
        "Check the arena ID.");
    }
    if (!("finished" in arena.state)) {
      throw new RitArenaError("ARENA_NOT_ACTIVE",
        `Arena ${arenaId} is ${arenaStateLabel(arena.state)}, not Finished`,
        "Wait for the arena to be finalized before claiming prizes.");
    }

    const winnerUsdc = await getAssociatedTokenAddress(
      arena.usdcMint,
      winner
    );

    const tx = await (this.program.methods as any)
      .claimPrize()
      .accounts({
        winner,
        arena: arenaPda,
        arenaEntry: entryPda,
        arenaVault,
        winnerUsdc,
        usdcMint: arena.usdcMint,
      })
      .rpc();

    // Auto-collect protocol fee if not already collected
    if (!arena.protocolFeeCollected) {
      try {
        await this.collectProtocolFee(arenaId);
      } catch {
        // May fail if already collected by another caller — that's OK
      }
    }

    return tx;
  }

  /** Collect 1% protocol fee and send to treasury. Anyone can call after arena finishes. */
  async collectProtocolFee(arenaId: number): Promise<string> {
    const caller = this.wallet.publicKey;
    const arenaPda = pdas.arena(arenaId);
    const arenaVault = pdas.arenaVault(arenaPda);
    const treasuryPda = pdas.treasury();

    const arena = await this.getArena(arenaId);
    if (!arena) {
      throw new RitArenaError("ARENA_NOT_FOUND",
        `Arena ${arenaId} not found on-chain`,
        "Check the arena ID.");
    }

    const treasuryUsdc = await getAssociatedTokenAddress(
      arena.usdcMint,
      treasuryPda,
      true
    );

    const protocolPda = pdas.protocol();

    return await (this.program.methods as any)
      .collectProtocolFee()
      .accounts({
        caller,
        protocol: protocolPda,
        arena: arenaPda,
        arenaVault,
        treasuryUsdc,
        usdcMint: arena.usdcMint,
      })
      .rpc();
  }

  /** Withdraw creator's fee share. Creator only. Arena must be Finished. */
  async claimCreatorFee(arenaId: number): Promise<string> {
    const creator = this.wallet.publicKey;
    const arenaPda = pdas.arena(arenaId);
    const arenaVault = pdas.arenaVault(arenaPda);

    const arena = await this.getArena(arenaId);
    if (!arena) {
      throw new RitArenaError("ARENA_NOT_FOUND",
        `Arena ${arenaId} not found on-chain`,
        "Check the arena ID.");
    }

    const creatorUsdc = await getAssociatedTokenAddress(
      arena.usdcMint,
      creator
    );

    return await (this.program.methods as any)
      .claimCreatorFee()
      .accounts({
        creator,
        arena: arenaPda,
        arenaVault,
        creatorUsdc,
        usdcMint: arena.usdcMint,
      })
      .rpc();
  }

  /** Abandon an arena that has timed out (oracle inactive > 2x elimination interval). Only protocol authority or arena creator can call. */
  async abandonArena(arenaId: number): Promise<string> {
    const caller = this.wallet.publicKey;
    const arenaPda = pdas.arena(arenaId);
    const protocolPda = pdas.protocol();
    const bondVault = pdas.bondVault(arenaPda);
    const treasuryPda = pdas.treasury();

    const arena = await this.getArena(arenaId);
    if (!arena) {
      throw new RitArenaError("ARENA_NOT_FOUND",
        `Arena ${arenaId} not found on-chain`,
        "Check the arena ID.");
    }

    const treasuryUsdc = await getAssociatedTokenAddress(
      arena.usdcMint,
      treasuryPda,
      true
    );

    return await (this.program.methods as any)
      .abandonArena()
      .accounts({
        caller,
        protocol: protocolPda,
        arena: arenaPda,
        bondVault,
        treasuryUsdc,
        usdcMint: arena.usdcMint,
      })
      .rpc();
  }

  /** Reclaim creator's stake bond after successful arena completion. */
  async returnStakeBond(arenaId: number): Promise<string> {
    const creator = this.wallet.publicKey;
    const arenaPda = pdas.arena(arenaId);
    const bondVault = pdas.bondVault(arenaPda);

    const arena = await this.getArena(arenaId);
    if (!arena) {
      throw new RitArenaError("ARENA_NOT_FOUND",
        `Arena ${arenaId} not found on-chain`,
        "Check the arena ID.");
    }

    const creatorUsdc = await getAssociatedTokenAddress(
      arena.usdcMint,
      creator
    );

    return await (this.program.methods as any)
      .returnStakeBond()
      .accounts({
        creator,
        arena: arenaPda,
        bondVault,
        creatorUsdc,
        usdcMint: arena.usdcMint,
      })
      .rpc();
  }
}
