use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::error::RitArenaError;
use crate::state::{Arena, ArenaEntry, ArenaState};

#[derive(Accounts)]
pub struct ClaimPrize<'info> {
    #[account(mut)]
    pub winner: Signer<'info>,

    #[account(
        seeds = [ARENA_SEED, &arena.id.to_le_bytes()],
        bump = arena.bump,
        constraint = arena.state == ArenaState::Finished @ RitArenaError::ArenaNotFinished,
    )]
    pub arena: Box<Account<'info, Arena>>,

    #[account(
        mut,
        seeds = [ARENA_ENTRY_SEED, arena.key().as_ref(), arena_entry.agent_profile.as_ref()],
        bump = arena_entry.bump,
        constraint = arena_entry.owner == winner.key(),
        constraint = arena_entry.prize_rank > 0 @ RitArenaError::NotAWinner,
        constraint = !arena_entry.prize_claimed @ RitArenaError::AlreadyClaimed,
    )]
    pub arena_entry: Account<'info, ArenaEntry>,

    #[account(
        mut,
        seeds = [ARENA_VAULT_SEED, arena.key().as_ref()],
        bump = arena.vault_bump,
    )]
    pub arena_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = winner,
    )]
    pub winner_usdc: Account<'info, TokenAccount>,

    #[account(address = arena.usdc_mint)]
    pub usdc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<ClaimPrize>) -> Result<()> {
    let arena = &ctx.accounts.arena;
    let entry = &ctx.accounts.arena_entry;

    let total_pool = arena
        .total_entry_fees
        .checked_add(arena.sponsor_deposit)
        .ok_or(RitArenaError::MathOverflow)?;
    let protocol_fee = total_pool
        .checked_mul(PROTOCOL_FEE_BPS as u64)
        .ok_or(RitArenaError::MathOverflow)?
        / 10_000;
    let creator_fee = total_pool
        .checked_mul(arena.creator_fee_bps as u64)
        .ok_or(RitArenaError::MathOverflow)?
        / 10_000;
    let prize_pool = total_pool
        .checked_sub(protocol_fee)
        .ok_or(RitArenaError::MathOverflow)?
        .checked_sub(creator_fee)
        .ok_or(RitArenaError::MathOverflow)?;

    let rank_index = (entry.prize_rank - 1) as usize;
    let split_pct = arena.prize_split[rank_index] as u64;
    let prize_amount = prize_pool
        .checked_mul(split_pct)
        .ok_or(RitArenaError::MathOverflow)?
        / 100;

    // Transfer prize from arena_vault to winner
    let arena_id_bytes = arena.id.to_le_bytes();
    let signer_seeds: &[&[&[u8]]] = &[&[ARENA_SEED, &arena_id_bytes, &[arena.bump]]];

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            Transfer {
                from: ctx.accounts.arena_vault.to_account_info(),
                to: ctx.accounts.winner_usdc.to_account_info(),
                authority: ctx.accounts.arena.to_account_info(),
            },
            signer_seeds,
        ),
        prize_amount,
    )?;

    // Mark claimed
    let entry = &mut ctx.accounts.arena_entry;
    entry.prize_claimed = true;

    Ok(())
}
