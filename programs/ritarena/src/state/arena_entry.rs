use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct ArenaEntry {
    pub arena: Pubkey,
    pub agent_profile: Pubkey,
    pub owner: Pubkey,
    pub score: i64, // signed: supports penalties (negative deltas from oracle)
    pub alive: bool,
    pub prize_rank: u8,
    pub prize_claimed: bool,
    pub refunded: bool,
    pub bump: u8,
}
