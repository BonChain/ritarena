use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::error::RitArenaError;
use crate::state::{Arena, ArenaEntry, ArenaState};

#[derive(Accounts)]
pub struct RefundEntry<'info> {
    pub agent_owner: Signer<'info>,

    #[account(
        mut,
        seeds = [ARENA_SEED, &arena.id.to_le_bytes()],
        bump = arena.bump,
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
    // Refund allowed if:
    // 1. Arena is Cancelled or Abandoned (normal path), OR
    // 2. Arena is still in Registration and REGISTRATION_TIMEOUT has elapsed (stuck arena rescue)
    let state = ctx.accounts.arena.state.clone();
    let refundable = state == ArenaState::Cancelled
        || state == ArenaState::Abandoned
        || (state == ArenaState::Registration && {
            let now = Clock::get()?.unix_timestamp;
            let elapsed = now.saturating_sub(ctx.accounts.arena.created_at);
            elapsed >= REGISTRATION_TIMEOUT
        });

    require!(refundable, RitArenaError::ArenaNotRefundable);

    // Auto-cancel the registration arena if it timed out
    if state == ArenaState::Registration {
        ctx.accounts.arena.state = ArenaState::Cancelled;
    }

    // Transfer entry fee back (skip if zero-fee arena)
    let entry_fee = ctx.accounts.arena.entry_fee;
    if entry_fee > 0 {
        let arena_id_bytes = ctx.accounts.arena.id.to_le_bytes();
        let bump = ctx.accounts.arena.bump;
        let signer_seeds: &[&[&[u8]]] = &[&[ARENA_SEED, &arena_id_bytes, &[bump]]];

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
            entry_fee,
        )?;
    }

    ctx.accounts.arena_entry.refunded = true;

    Ok(())
}
