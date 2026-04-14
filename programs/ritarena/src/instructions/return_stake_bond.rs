use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::error::RitArenaError;
use crate::state::{Arena, ArenaState};

#[derive(Accounts)]
pub struct ReturnStakeBond<'info> {
    pub creator: Signer<'info>,

    #[account(
        mut,
        seeds = [ARENA_SEED, &arena.id.to_le_bytes()],
        bump = arena.bump,
        constraint = arena.state == ArenaState::Finished @ RitArenaError::ArenaNotFinished,
        constraint = arena.creator == creator.key(),
        constraint = !arena.bond_returned @ RitArenaError::BondAlreadyReturned,
        constraint = arena.stake_bond_amount > 0 @ RitArenaError::NoStakeBond,
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
        token::authority = creator,
    )]
    pub creator_usdc: Account<'info, TokenAccount>,

    #[account(address = arena.usdc_mint)]
    pub usdc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<ReturnStakeBond>) -> Result<()> {
    let arena = &ctx.accounts.arena;

    let arena_id_bytes = arena.id.to_le_bytes();
    let signer_seeds: &[&[&[u8]]] = &[&[ARENA_SEED, &arena_id_bytes, &[arena.bump]]];

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            Transfer {
                from: ctx.accounts.bond_vault.to_account_info(),
                to: ctx.accounts.creator_usdc.to_account_info(),
                authority: ctx.accounts.arena.to_account_info(),
            },
            signer_seeds,
        ),
        arena.stake_bond_amount,
    )?;

    let arena = &mut ctx.accounts.arena;
    arena.bond_returned = true;

    Ok(())
}
