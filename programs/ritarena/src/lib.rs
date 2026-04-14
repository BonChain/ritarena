pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use instructions::finalize_arena::PrizeAssignment;
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

    pub fn finalize_arena(
        ctx: Context<FinalizeArena>,
        final_merkle_root: [u8; 32],
        winners: Vec<PrizeAssignment>,
    ) -> Result<()> {
        instructions::finalize_arena::handler(ctx, final_merkle_root, winners)
    }

    pub fn claim_prize(ctx: Context<ClaimPrize>) -> Result<()> {
        instructions::claim_prize::handler(ctx)
    }

    pub fn claim_creator_fee(ctx: Context<ClaimCreatorFee>) -> Result<()> {
        instructions::claim_creator_fee::handler(ctx)
    }

    pub fn return_stake_bond(ctx: Context<ReturnStakeBond>) -> Result<()> {
        instructions::return_stake_bond::handler(ctx)
    }

    pub fn refund_entry(ctx: Context<RefundEntry>) -> Result<()> {
        instructions::refund_entry::handler(ctx)
    }

    pub fn abandon_arena(ctx: Context<AbandonArena>) -> Result<()> {
        instructions::abandon_arena::handler(ctx)
    }

    pub fn cancel_arena(ctx: Context<CancelArena>) -> Result<()> {
        instructions::cancel_arena::handler(ctx)
    }

    pub fn collect_protocol_fee(ctx: Context<CollectProtocolFee>) -> Result<()> {
        instructions::collect_protocol_fee::handler(ctx)
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
