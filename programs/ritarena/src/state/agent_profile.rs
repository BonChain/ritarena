use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct AgentProfile {
    pub owner: Pubkey,
    #[max_len(32)]
    pub name: String,
    pub registered_at: i64,
    pub arenas_entered: u64,
    pub arenas_completed: u64,
    pub wins: u64,
    pub top3: u64,
    pub eliminations: u64,
    pub total_earnings: u64,
    pub bump: u8,
}
