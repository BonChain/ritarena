use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::RitArenaError;
use crate::state::{Arena, ArenaState};

#[derive(Accounts)]
pub struct CancelArena<'info> {
    pub creator: Signer<'info>,

    #[account(
        mut,
        seeds = [ARENA_SEED, &arena.id.to_le_bytes()],
        bump = arena.bump,
        constraint = arena.state == ArenaState::Registration @ RitArenaError::ArenaNotRegistering,
        constraint = arena.creator == creator.key(),
    )]
    pub arena: Box<Account<'info, Arena>>,
}

pub fn handler(ctx: Context<CancelArena>) -> Result<()> {
    ctx.accounts.arena.state = ArenaState::Cancelled;
    Ok(())
}
