import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "5fYaY6696pCJfPQvxC3GwHEDS91hXs1JZNpEK4ZmhCfH"
);

// PDA seeds — must match programs/ritarena/src/constants.rs
export const PROTOCOL_SEED = Buffer.from("protocol");
export const TREASURY_SEED = Buffer.from("treasury");
export const AGENT_PROFILE_SEED = Buffer.from("agent_profile");
export const ARENA_SEED = Buffer.from("arena");
export const ARENA_ENTRY_SEED = Buffer.from("arena_entry");
export const ARENA_VAULT_SEED = Buffer.from("arena_vault");
export const BOND_VAULT_SEED = Buffer.from("bond_vault");

// Fee constants
export const REGISTRATION_FEE = 5_000_000; // 5 USDC (6 decimals)
export const PROTOCOL_FEE_BPS = 100; // 1%
export const MAX_CREATOR_FEE_BPS = 2000; // 20%

// Limits
export const MAX_AGENTS_PER_ARENA = 100;
export const MAX_NAME_LEN = 32;
export const MAX_PRIZE_SLOTS = 10;
export const MAX_ACTION_SCHEMA_LEN = 256;
