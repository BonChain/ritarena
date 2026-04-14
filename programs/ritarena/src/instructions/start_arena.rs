use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::RitArenaError;
use crate::state::{Arena, ArenaState};

#[derive(Accounts)]
pub struct StartArena<'info> {
    pub oracle: Signer<'info>,

    #[account(
        mut,
        seeds = [ARENA_SEED, &arena.id.to_le_bytes()],
        bump = arena.bump,
        constraint = arena.oracle == oracle.key() @ RitArenaError::UnauthorizedOracle,
    )]
    pub arena: Box<Account<'info, Arena>>,
}

pub fn handler(ctx: Context<StartArena>) -> Result<()> {
    let arena = &mut ctx.accounts.arena;

    require!(
        arena.state == ArenaState::Registration,
        RitArenaError::ArenaNotRegistering
    );
    require!(
        arena.current_agents >= arena.min_agents,
        RitArenaError::MinAgentsNotReached
    );

    let now = Clock::get()?.unix_timestamp;
    arena.state = ArenaState::Active;
    arena.started_at = now;
    arena.last_submission_at = now;

    Ok(())
}
