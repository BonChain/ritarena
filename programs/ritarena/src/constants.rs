use anchor_lang::prelude::*;

// PDA seeds
pub const PROTOCOL_SEED: &[u8] = b"protocol";
pub const AGENT_PROFILE_SEED: &[u8] = b"agent_profile";
pub const ARENA_SEED: &[u8] = b"arena";
pub const ARENA_ENTRY_SEED: &[u8] = b"arena_entry";
pub const ARENA_VAULT_SEED: &[u8] = b"arena_vault";
pub const BOND_VAULT_SEED: &[u8] = b"bond_vault";
pub const TREASURY_SEED: &[u8] = b"treasury";

// Fees
pub const PROTOCOL_FEE_BPS: u16 = 100; // 1%
pub const MAX_CREATOR_FEE_BPS: u16 = 2000; // 20%
pub const REGISTRATION_FEE: u64 = 5_000_000; // 5 USDC (6 decimals)

// Limits
pub const MAX_AGENTS_PER_ARENA: u16 = 100;
pub const MAX_NAME_LEN: usize = 32;
pub const MAX_PRIZE_SLOTS: usize = 10;
pub const MAX_ACTION_SCHEMA_LEN: usize = 256;
