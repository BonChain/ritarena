use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::error::RitArenaError;
use crate::state::{AgentProfile, Arena, ArenaEntry, ArenaState};

#[derive(Accounts)]
pub struct EnterArena<'info> {
    #[account(mut)]
    pub agent_owner: Signer<'info>,

    #[account(
        mut,
        seeds = [AGENT_PROFILE_SEED, agent_owner.key().as_ref()],
        bump = agent_profile.bump,
        constraint = agent_profile.owner == agent_owner.key(),
    )]
    pub agent_profile: Account<'info, AgentProfile>,

    #[account(
        mut,
        seeds = [ARENA_SEED, &arena.id.to_le_bytes()],
        bump = arena.bump,
    )]
    pub arena: Box<Account<'info, Arena>>,

    #[account(
        init,
        payer = agent_owner,
        space = 8 + ArenaEntry::INIT_SPACE,
        seeds = [ARENA_ENTRY_SEED, arena.key().as_ref(), agent_profile.key().as_ref()],
        bump,
    )]
    pub arena_entry: Box<Account<'info, ArenaEntry>>,

    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = agent_owner,
    )]
    pub agent_usdc: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [ARENA_VAULT_SEED, arena.key().as_ref()],
        bump = arena.vault_bump,
    )]
    pub arena_vault: Account<'info, TokenAccount>,

    #[account(address = arena.usdc_mint)]
    pub usdc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<EnterArena>) -> Result<()> {
    let arena = &ctx.accounts.arena;
    let profile = &ctx.accounts.agent_profile;

    // 1. Verify arena is in Registration state
    require!(arena.state == ArenaState::Registration, RitArenaError::ArenaNotRegistering);

    // 2. Verify arena is not full
    require!(arena.current_agents < arena.max_agents, RitArenaError::ArenaFull);

    // 3. Check min requirements
    let now = Clock::get()?.unix_timestamp;
    let registration_age = now.saturating_sub(profile.registered_at);
    require!(
        profile.arenas_completed >= arena.min_arenas_completed
            && profile.wins >= arena.min_wins
            && registration_age >= arena.min_registration_age,
        RitArenaError::RequirementsNotMet
    );

    // 4. Transfer entry_fee from agent's USDC to arena vault
    if arena.entry_fee > 0 {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.key(),
                Transfer {
                    from: ctx.accounts.agent_usdc.to_account_info(),
                    to: ctx.accounts.arena_vault.to_account_info(),
                    authority: ctx.accounts.agent_owner.to_account_info(),
                },
            ),
            arena.entry_fee,
        )?;
    }

    // 5-6. Initialize ArenaEntry
    let entry = &mut ctx.accounts.arena_entry;
    entry.arena = ctx.accounts.arena.key();
    entry.agent_profile = ctx.accounts.agent_profile.key();
    entry.owner = ctx.accounts.agent_owner.key();
    entry.score = 0;
    entry.alive = true;
    entry.prize_rank = 0;
    entry.prize_claimed = false;
    entry.refunded = false;
    entry.bump = ctx.bumps.arena_entry;

    // 7. Increment arena counters
    let arena = &mut ctx.accounts.arena;
    arena.current_agents += 1;
    arena.alive_agents += 1;

    // 8. Add entry_fee to total_entry_fees
    arena.total_entry_fees = arena
        .total_entry_fees
        .checked_add(arena.entry_fee)
        .ok_or(RitArenaError::MathOverflow)?;

    // 9. Increment agent_profile.arenas_entered
    let profile = &mut ctx.accounts.agent_profile;
    profile.arenas_entered += 1;

    Ok(())
}
