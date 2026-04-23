import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { createHash } from "crypto";
import { PROGRAM_ID } from "./constants";
import { pdas } from "./pda";
import { IDL } from "./idl";
import type { Arena, AgentProfile, ArenaEntry, ProtocolConfig, ArenaFilter } from "./types";

const dummyWallet = {
  publicKey: PublicKey.default,
  signTransaction: async (tx: any) => tx,
  signAllTransactions: async (txs: any) => txs,
};

export class RitArenaReader {
  protected program: Program;
  protected connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
    const provider = new AnchorProvider(
      connection,
      dummyWallet as any,
      AnchorProvider.defaultOptions()
    );
    this.program = new Program(IDL as Idl, provider);
  }

  async getProtocol(): Promise<ProtocolConfig | null> {
    try {
      const pda = pdas.protocol();
      return await (this.program.account as any).protocolConfig.fetch(pda);
    } catch {
      return null;
    }
  }

  async getArena(arenaId: number): Promise<Arena | null> {
    try {
      const pda = pdas.arena(arenaId);
      return await (this.program.account as any).arena.fetch(pda);
    } catch {
      return null;
    }
  }

  async getProfile(owner: PublicKey): Promise<AgentProfile | null> {
    try {
      const pda = pdas.agentProfile(owner);
      return await (this.program.account as any).agentProfile.fetch(pda);
    } catch {
      return null;
    }
  }

  async getAgentDetails(
    arenaId: number,
    profileOwner: PublicKey
  ): Promise<ArenaEntry | null> {
    try {
      const arenaPda = pdas.arena(arenaId);
      const profilePda = pdas.agentProfile(profileOwner);
      const entryPda = pdas.arenaEntry(arenaPda, profilePda);
      return await (this.program.account as any).arenaEntry.fetch(entryPda);
    } catch {
      return null;
    }
  }

  async getArenaEntries(arenaId: number): Promise<ArenaEntry[]> {
    const arenaPda = pdas.arena(arenaId);
    const entries = await (this.program.account as any).arenaEntry.all([
      {
        memcmp: {
          offset: 8, // discriminator
          bytes: arenaPda.toBase58(),
        },
      },
    ]);
    return entries.map((e: any) => e.account);
  }

  async getProfileHistory(owner: PublicKey): Promise<ArenaEntry[]> {
    const profilePda = pdas.agentProfile(owner);
    const entries = await (this.program.account as any).arenaEntry.all([
      {
        memcmp: {
          offset: 8 + 32, // discriminator + arena (32 bytes)
          bytes: profilePda.toBase58(),
        },
      },
    ]);
    return entries.map((e: any) => e.account);
  }

  async getEliminationLog(arenaId: number): Promise<ArenaEntry[]> {
    const entries = await this.getArenaEntries(arenaId);
    return entries
      .filter((e) => !e.alive)
      .sort((a, b) => Number(b.score) - Number(a.score));
  }

  verifyMerkleProof(
    root: Uint8Array,
    leaf: Uint8Array,
    proof: Uint8Array[]
  ): boolean {
    let hash = Buffer.from(leaf);
    for (const sibling of proof) {
      const sibBuf = Buffer.from(sibling);
      const combined =
        Buffer.compare(hash, sibBuf) < 0
          ? Buffer.concat([hash, sibBuf])
          : Buffer.concat([sibBuf, hash]);
      hash = createHash("sha256").update(combined).digest();
    }
    return hash.equals(Buffer.from(root));
  }

  async verifyAction(
    arenaId: number,
    leaf: Uint8Array,
    proof: Uint8Array[]
  ): Promise<boolean> {
    const arena = await this.getArena(arenaId);
    if (!arena) return false;
    return this.verifyMerkleProof(
      new Uint8Array(arena.latestMerkleRoot),
      leaf,
      proof
    );
  }

  async listArenas(filter?: ArenaFilter): Promise<Arena[]> {
    const accounts = await (this.program.account as any).arena.all();
    let arenas: Arena[] = accounts.map((a: any) => a.account);

    if (filter?.state) {
      arenas = arenas.filter((a) => filter.state! in a.state);
    }
    if (filter?.maxEntryFee !== undefined) {
      arenas = arenas.filter((a) => Number(a.entryFee) <= filter.maxEntryFee!);
    }
    if (filter?.creator) {
      arenas = arenas.filter((a) => a.creator.equals(filter.creator!));
    }

    return arenas;
  }

  /**
   * List every AgentProfile on-chain. Use for leaderboards + directories.
   * No filter in v0.5.2 — caller sorts/slices. Fine for devnet volume; if
   * mainnet profile count passes a few thousand, switch to getProgramAccounts
   * with a memcmp filter on registeredAt or similar.
   */
  async listProfiles(): Promise<AgentProfile[]> {
    const accounts = await (this.program.account as any).agentProfile.all();
    return accounts.map((a: any) => a.account);
  }

  watchArena(
    arenaId: number,
    callback: (arena: Arena) => void
  ): () => void {
    const arenaPda = pdas.arena(arenaId);
    const subId = this.connection.onAccountChange(
      arenaPda,
      (accountInfo) => {
        try {
          const decoded = (this.program.coder.accounts as any).decode(
            "arena",
            accountInfo.data
          );
          callback(decoded);
        } catch {
          // ignore decode errors
        }
      },
      "confirmed"
    );
    return () => {
      this.connection.removeAccountChangeListener(subId);
    };
  }

  watchEntry(
    arenaId: number,
    agentOwner: PublicKey,
    callback: (entry: ArenaEntry) => void
  ): () => void {
    const arenaPda = pdas.arena(arenaId);
    const profilePda = pdas.agentProfile(agentOwner);
    const entryPda = pdas.arenaEntry(arenaPda, profilePda);

    const subId = this.connection.onAccountChange(
      entryPda,
      (accountInfo) => {
        try {
          const decoded = (this.program.coder.accounts as any).decode(
            "arenaEntry",
            accountInfo.data
          );
          callback(decoded);
        } catch {
          // ignore decode errors
        }
      },
      "confirmed"
    );
    return () => {
      this.connection.removeAccountChangeListener(subId);
    };
  }
}
