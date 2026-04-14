use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::error::RitArenaError;
use crate::state::{Arena, ArenaState};

#[derive(Accounts)]
pub struct ClaimCreatorFee<'info> {
    pub creator: Signer<'info>,

    #[account(
        mut,
        seeds = [ARENA_SEED, &arena.id.to_le_bytes()],
        bump = arena.bump,
        constraint = arena.state == ArenaState::Finished @ RitArenaError::ArenaNotFinished,
        constraint = arena.creator == creator.key(),
        constraint = !arena.creator_fee_claimed @ RitArenaError::CreatorFeeAlreadyClaimed,
    )]
    pub arena: Box<Account<'info, Arena>>,

    #[account(
        mut,
        seeds = [ARENA_VAULT_SEED, arena.key().as_ref()],
        bump = arena.vault_bump,
    )]
    pub arena_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = creator,
    )]
    pub creator_usdc: Account<'info, TokenAccount>,

    #[account(address = arena.usdc_mint)]
    pub usdc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<ClaimCreatorFee>) -> Result<()> {
    let arena = &ctx.accounts.arena;

    let total_pool = arena
        .total_entry_fees
        .checked_add(arena.sponsor_deposit)
        .ok_or(RitArenaError::MathOverflow)?;
    let creator_fee = total_pool
        .checked_mul(arena.creator_fee_bps as u64)
        .ok_or(RitArenaError::MathOverflow)?
        / 10_000;

    let arena_id_bytes = arena.id.to_le_bytes();
    let signer_seeds: &[&[&[u8]]] = &[&[ARENA_SEED, &arena_id_bytes, &[arena.bump]]];

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            Transfer {
                from: ctx.accounts.arena_vault.to_account_info(),
                to: ctx.accounts.creator_usdc.to_account_info(),
                authority: ctx.accounts.arena.to_account_info(),
            },
            signer_seeds,
        ),
        creator_fee,
    )?;

    let arena = &mut ctx.accounts.arena;
    arena.creator_fee_claimed = true;

    Ok(())
}
