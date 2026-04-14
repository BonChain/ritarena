pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use instructions::submit_elimination::ScoreUpdate;
pub use state::*;

declare_id!("5fYaY6696pCJfPQvxC3GwHEDS91hXs1JZNpEK4ZmhCfH");

#[program]
pub mod ritarena {
    use super::*;

    pub fn initialize_protocol(ctx: Context<InitializeProtocol>) -> Result<()> {
        instructions::initialize_protocol::handler(ctx)
    }

    pub fn register_profile(ctx: Context<RegisterProfile>, name: String) -> Result<()> {
        instructions::register_profile::handler(ctx, name)
    }

    pub fn enter_arena(ctx: Context<EnterArena>) -> Result<()> {
        instructions::enter_arena::handler(ctx)
    }

    pub fn start_arena(ctx: Context<StartArena>) -> Result<()> {
        instructions::start_arena::handler(ctx)
    }

    pub fn submit_elimination(
        ctx: Context<SubmitElimination>,
        merkle_root: [u8; 32],
        round_number: u32,
        eliminated: Vec<Pubkey>,
        scores: Vec<ScoreUpdate>,
    ) -> Result<()> {
        instructions::submit_elimination::handler(ctx, merkle_root, round_number, eliminated, scores)
    }

    #[allow(clippy::too_many_arguments)]
    pub fn create_arena(
        ctx: Context<CreateArena>,
        entry_fee: u64,
        max_agents: u16,
        min_agents: u16,
        duration: i64,
        elimination_interval: i64,
        elimination_percent: u8,
        creator_fee_bps: u16,
        prize_split: Vec<u16>,
        action_schema: String,
        rules_hash: [u8; 32],
        min_arenas_completed: u64,
        min_wins: u64,
        min_registration_age: i64,
        stake_bond_amount: u64,
    ) -> Result<()> {
        instructions::create_arena::handler(
            ctx,
            entry_fee,
            max_agents,
            min_agents,
            duration,
            elimination_interval,
            elimination_percent,
            creator_fee_bps,
            prize_split,
            action_schema,
            rules_hash,
            min_arenas_completed,
            min_wins,
            min_registration_age,
            stake_bond_amount,
        )
    }
}
