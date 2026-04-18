import { PublicKey } from "@solana/web3.js";
import {
  PROGRAM_ID,
  PROTOCOL_SEED,
  TREASURY_SEED,
  AGENT_PROFILE_SEED,
  ARENA_SEED,
  ARENA_ENTRY_SEED,
  ARENA_VAULT_SEED,
  BOND_VAULT_SEED,
  TEST_USDC_MINT_AUTHORITY_SEED,
} from "./constants";

function arenaIdToBuffer(arenaId: number): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(arenaId));
  return buf;
}

export const pdas = {
  protocol(): PublicKey {
    return PublicKey.findProgramAddressSync(
      [PROTOCOL_SEED],
      PROGRAM_ID
    )[0];
  },

  treasury(): PublicKey {
    return PublicKey.findProgramAddressSync(
      [TREASURY_SEED],
      PROGRAM_ID
    )[0];
  },

  agentProfile(owner: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [AGENT_PROFILE_SEED, owner.toBuffer()],
      PROGRAM_ID
    )[0];
  },

  arena(arenaId: number): PublicKey {
    return PublicKey.findProgramAddressSync(
      [ARENA_SEED, arenaIdToBuffer(arenaId)],
      PROGRAM_ID
    )[0];
  },

  arenaEntry(arena: PublicKey, profile: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [ARENA_ENTRY_SEED, arena.toBuffer(), profile.toBuffer()],
      PROGRAM_ID
    )[0];
  },

  arenaVault(arena: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [ARENA_VAULT_SEED, arena.toBuffer()],
      PROGRAM_ID
    )[0];
  },

  bondVault(arena: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [BOND_VAULT_SEED, arena.toBuffer()],
      PROGRAM_ID
    )[0];
  },

  testUsdcMintAuthority(): PublicKey {
    return PublicKey.findProgramAddressSync(
      [TEST_USDC_MINT_AUTHORITY_SEED],
      PROGRAM_ID
    )[0];
  },
};
