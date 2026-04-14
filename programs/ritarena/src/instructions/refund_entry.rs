use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::error::RitArenaError;
use crate::state::{Arena, ArenaEntry, ArenaState};

#[derive(Accounts)]
pub struct RefundEntry<'info> {
    pub agent_owner: Signer<'info>,

    #[account(
        seeds = [ARENA_SEED, &arena.id.to_le_bytes()],
        bump = arena.bump,
        constraint = arena.state == ArenaState::Cancelled || arena.state == ArenaState::Abandoned @ RitArenaError::ArenaNotRefundable,
    )]
    pub arena: Box<Account<'info, Arena>>,

    #[account(
        mut,
        seeds = [ARENA_ENTRY_SEED, arena.key().as_ref(), arena_entry.agent_profile.as_ref()],
        bump = arena_entry.bump,
        constraint = arena_entry.owner == agent_owner.key(),
        constraint = !arena_entry.refunded @ RitArenaError::AlreadyRefunded,
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
        token::authority = agent_owner,
    )]
    pub agent_usdc: Account<'info, TokenAccount>,

    #[account(address = arena.usdc_mint)]
    pub usdc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<RefundEntry>) -> Result<()> {
    let arena = &ctx.accounts.arena;

    let arena_id_bytes = arena.id.to_le_bytes();
    let signer_seeds: &[&[&[u8]]] = &[&[ARENA_SEED, &arena_id_bytes, &[arena.bump]]];

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            Transfer {
                from: ctx.accounts.arena_vault.to_account_info(),
                to: ctx.accounts.agent_usdc.to_account_info(),
                authority: ctx.accounts.arena.to_account_info(),
            },
            signer_seeds,
        ),
        arena.entry_fee,
    )?;

    let entry = &mut ctx.accounts.arena_entry;
    entry.refunded = true;

    Ok(())
}
