use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum ArenaState {
    Registration,
    Active,
    Eliminating,
    Finished,
    Cancelled,
    Abandoned,
}

#[account]
#[derive(InitSpace)]
pub struct Arena {
    pub id: u64,
    pub creator: Pubkey,
    pub oracle: Pubkey,
    pub usdc_mint: Pubkey,

    // Config
    pub entry_fee: u64,
    pub max_agents: u16,
    pub min_agents: u16,
    pub duration: i64,
    pub elimination_interval: i64,
    pub elimination_percent: u8,
    pub creator_fee_bps: u16,
    #[max_len(10)]
    pub prize_split: Vec<u16>,
    #[max_len(256)]
    pub action_schema: String,
    pub rules_hash: [u8; 32],

    // Min entry requirements
    pub min_arenas_completed: u64,
    pub min_wins: u64,
    pub min_registration_age: i64,

    // State
    pub state: ArenaState,
    pub current_agents: u16,
    pub alive_agents: u16,
    pub current_round: u32,
    pub started_at: i64,
    pub last_submission_at: i64,

    // Merkle roots
    pub latest_merkle_root: [u8; 32],

    // Financials
    pub total_entry_fees: u64,
    pub sponsor_deposit: u64,
    pub stake_bond_amount: u64,
    pub creator_fee_claimed: bool,
    pub bond_returned: bool,

    // Bumps
    pub bump: u8,
    pub vault_bump: u8,
    pub bond_vault_bump: u8,
}
