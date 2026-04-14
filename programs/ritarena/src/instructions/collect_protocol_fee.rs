use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::error::RitArenaError;
use crate::state::{Arena, ArenaState};

#[derive(Accounts)]
pub struct CollectProtocolFee<'info> {
    pub caller: Signer<'info>,

    #[account(
        mut,
        seeds = [ARENA_SEED, &arena.id.to_le_bytes()],
        bump = arena.bump,
        constraint = arena.state == ArenaState::Finished @ RitArenaError::ArenaNotFinished,
        constraint = !arena.protocol_fee_collected @ RitArenaError::AlreadyClaimed,
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
    )]
    pub treasury_usdc: Account<'info, TokenAccount>,

    #[account(address = arena.usdc_mint)]
    pub usdc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<CollectProtocolFee>) -> Result<()> {
    let arena = &ctx.accounts.arena;

    let total_pool = arena
        .total_entry_fees
        .checked_add(arena.sponsor_deposit)
        .ok_or(RitArenaError::MathOverflow)?;
    let protocol_fee = total_pool
        .checked_mul(PROTOCOL_FEE_BPS as u64)
        .ok_or(RitArenaError::MathOverflow)?
        / 10_000;

    let arena_id_bytes = arena.id.to_le_bytes();
    let signer_seeds: &[&[&[u8]]] = &[&[ARENA_SEED, &arena_id_bytes, &[arena.bump]]];

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            Transfer {
                from: ctx.accounts.arena_vault.to_account_info(),
                to: ctx.accounts.treasury_usdc.to_account_info(),
                authority: ctx.accounts.arena.to_account_info(),
            },
            signer_seeds,
        ),
        protocol_fee,
    )?;

    let arena = &mut ctx.accounts.arena;
    arena.protocol_fee_collected = true;

    Ok(())
}
