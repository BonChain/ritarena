import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet, Idl, BN } from "@coral-xyz/anchor";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { pdas } from "./pda";
import { IDL } from "./idl";
import { RitArenaReader } from "./reader";
import type {
  CreateArenaConfig,
  SubmitEliminationParams,
  FinalizeArenaParams,
} from "./types";

export class RitArena extends RitArenaReader {
  private wallet: Wallet;

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

  static fromKeypair(connection: Connection, keypair: Keypair): RitArena {
    const wallet = new Wallet(keypair);
    return new RitArena(connection, wallet);
  }

  static readOnly(connection: Connection): RitArenaReader {
    return new RitArenaReader(connection);
  }

  // --- Profile ---

  async registerProfile(name: string): Promise<string> {
    const owner = this.wallet.publicKey;
    const profilePda = pdas.agentProfile(owner);
    const protocolPda = pdas.protocol();
    const treasuryPda = pdas.treasury();

    const protocol = await this.getProtocol();
    if (!protocol) throw new Error("Protocol not initialized");

    const usdcMint = protocol.usdcMint;
    const ownerUsdc = await getAssociatedTokenAddress(usdcMint, owner);
    const treasuryUsdc = await getAssociatedTokenAddress(
      usdcMint,
      treasuryPda,
      true
    );

    return await (this.program.methods as any)
      .registerProfile(name)
      .accounts({
        owner,
        agentProfile: profilePda,
        protocol: protocolPda,
        usdcMint,
        ownerUsdc,
        treasuryUsdc,
        treasury: treasuryPda,
      })
      .rpc();
  }

  // --- Arena Creation ---

  async createArena(
    config: CreateArenaConfig
  ): Promise<{ arenaId: number; tx: string }> {
    const creator = this.wallet.publicKey;
    const protocolPda = pdas.protocol();
    const protocol = await this.getProtocol();
    if (!protocol) throw new Error("Protocol not initialized");

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

  async enterArena(arenaId: number): Promise<string> {
    const agentOwner = this.wallet.publicKey;
    const arenaPda = pdas.arena(arenaId);
    const profilePda = pdas.agentProfile(agentOwner);
    const entryPda = pdas.arenaEntry(arenaPda, profilePda);
    const arenaVault = pdas.arenaVault(arenaPda);

    const arena = await this.getArena(arenaId);
    if (!arena) throw new Error("Arena not found");

    const agentUsdc = await getAssociatedTokenAddress(
      arena.usdcMint,
      agentOwner
    );

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
      .rpc();
  }

  // --- Oracle Methods ---

  async startArena(arenaId: number): Promise<string> {
    const oracle = this.wallet.publicKey;
    const arenaPda = pdas.arena(arenaId);

    return await (this.program.methods as any)
      .startArena()
      .accounts({
        oracle,
        arena: arenaPda,
      })
      .rpc();
  }

  async submitElimination(
    arenaId: number,
    params: SubmitEliminationParams
  ): Promise<string> {
    const oracle = this.wallet.publicKey;
    const arenaPda = pdas.arena(arenaId);

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

  async finalizeArena(
    arenaId: number,
    params: FinalizeArenaParams
  ): Promise<string> {
    const oracle = this.wallet.publicKey;
    const arenaPda = pdas.arena(arenaId);

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

  async claimPrize(arenaId: number): Promise<string> {
    const winner = this.wallet.publicKey;
    const arenaPda = pdas.arena(arenaId);
    const profilePda = pdas.agentProfile(winner);
    const entryPda = pdas.arenaEntry(arenaPda, profilePda);
    const arenaVault = pdas.arenaVault(arenaPda);

    const arena = await this.getArena(arenaId);
    if (!arena) throw new Error("Arena not found");

    const winnerUsdc = await getAssociatedTokenAddress(
      arena.usdcMint,
      winner
    );

    return await (this.program.methods as any)
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
  }

  async claimCreatorFee(arenaId: number): Promise<string> {
    const creator = this.wallet.publicKey;
    const arenaPda = pdas.arena(arenaId);
    const arenaVault = pdas.arenaVault(arenaPda);

    const arena = await this.getArena(arenaId);
    if (!arena) throw new Error("Arena not found");

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

  async returnStakeBond(arenaId: number): Promise<string> {
    const creator = this.wallet.publicKey;
    const arenaPda = pdas.arena(arenaId);
    const bondVault = pdas.bondVault(arenaPda);

    const arena = await this.getArena(arenaId);
    if (!arena) throw new Error("Arena not found");

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
