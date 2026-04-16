use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::error::RitArenaError;
use crate::state::{Arena, ArenaState, ProtocolConfig};

#[derive(Accounts)]
pub struct AbandonArena<'info> {
    pub caller: Signer<'info>,

    #[account(
        seeds = [PROTOCOL_SEED],
        bump = protocol.bump,
    )]
    pub protocol: Account<'info, ProtocolConfig>,

    #[account(
        mut,
        seeds = [ARENA_SEED, &arena.id.to_le_bytes()],
        bump = arena.bump,
        constraint = arena.state == ArenaState::Active || arena.state == ArenaState::Eliminating @ RitArenaError::CannotAbandon,
    )]
    pub arena: Box<Account<'info, Arena>>,

    #[account(
        mut,
        seeds = [BOND_VAULT_SEED, arena.key().as_ref()],
        bump = arena.bond_vault_bump,
    )]
    pub bond_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = usdc_mint,
        constraint = treasury_usdc.owner == protocol.treasury @ RitArenaError::InvalidTreasury,
    )]
    pub treasury_usdc: Account<'info, TokenAccount>,

    #[account(address = arena.usdc_mint)]
    pub usdc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<AbandonArena>) -> Result<()> {
    let arena = &ctx.accounts.arena;
    let caller = ctx.accounts.caller.key();

    // Only protocol authority or arena creator can abandon
    require!(
        caller == ctx.accounts.protocol.authority || caller == arena.creator,
        RitArenaError::UnauthorizedOracle
    );

    // Check timeout
    let now = Clock::get()?.unix_timestamp;
    let elapsed = now
        .checked_sub(arena.last_submission_at)
        .ok_or(RitArenaError::MathOverflow)?;
    let timeout = arena
        .elimination_interval
        .checked_mul(2)
        .ok_or(RitArenaError::MathOverflow)?;
    require!(elapsed >= timeout, RitArenaError::ArenaNotTimedOut);

    // Slash bond to treasury if any
    if arena.stake_bond_amount > 0 {
        let arena_id_bytes = arena.id.to_le_bytes();
        let signer_seeds: &[&[&[u8]]] = &[&[ARENA_SEED, &arena_id_bytes, &[arena.bump]]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.key(),
                Transfer {
                    from: ctx.accounts.bond_vault.to_account_info(),
                    to: ctx.accounts.treasury_usdc.to_account_info(),
                    authority: ctx.accounts.arena.to_account_info(),
                },
                signer_seeds,
            ),
            arena.stake_bond_amount,
        )?;
    }

    let arena = &mut ctx.accounts.arena;
    arena.state = ArenaState::Abandoned;

    Ok(())
}
