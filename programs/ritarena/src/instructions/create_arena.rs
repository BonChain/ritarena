use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::error::RitArenaError;
use crate::state::{Arena, ArenaState, ProtocolConfig};

#[derive(Accounts)]
pub struct CreateArena<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        mut,
        seeds = [PROTOCOL_SEED],
        bump = protocol.bump,
    )]
    pub protocol: Account<'info, ProtocolConfig>,

    #[account(
        init,
        payer = creator,
        space = 8 + Arena::INIT_SPACE,
        seeds = [ARENA_SEED, &protocol.total_arenas.to_le_bytes()],
        bump,
    )]
    pub arena: Account<'info, Arena>,

    #[account(address = protocol.usdc_mint)]
    pub usdc_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = creator,
        token::mint = usdc_mint,
        token::authority = arena,
        seeds = [ARENA_VAULT_SEED, arena.key().as_ref()],
        bump,
    )]
    pub arena_vault: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = creator,
        token::mint = usdc_mint,
        token::authority = arena,
        seeds = [BOND_VAULT_SEED, arena.key().as_ref()],
        bump,
    )]
    pub bond_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = creator,
    )]
    pub creator_usdc: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[allow(clippy::too_many_arguments)]
pub fn handler(
    ctx: Context<CreateArena>,
    entry_fee: u64,
    max_agents: u16,
    min_agents: u16,
    duration: i64,
    elimination_interval: i64,
    elimination_percent: u8,
    creator_fee_bps: u16,
    prize_split: Vec<u16>,
    action_schema: String,
    rules_hash: [u8; 32],
    min_arenas_completed: u64,
    min_wins: u64,
    min_registration_age: i64,
    stake_bond_amount: u64,
) -> Result<()> {
    // Validate parameters
    require!(max_agents >= 2, RitArenaError::TooFewMaxAgents);
    require!(max_agents <= MAX_AGENTS_PER_ARENA, RitArenaError::TooManyMaxAgents);
    require!(creator_fee_bps <= MAX_CREATOR_FEE_BPS, RitArenaError::CreatorFeeTooHigh);
    require!(prize_split.len() <= MAX_PRIZE_SLOTS, RitArenaError::TooManyPrizeSlots);
    require!(duration > 0, RitArenaError::InvalidDuration);
    require!(elimination_interval > 0, RitArenaError::InvalidEliminationInterval);
    require!(
        elimination_percent >= 1 && elimination_percent <= 99,
        RitArenaError::InvalidEliminationPercent
    );
    require!(
        action_schema.len() <= MAX_ACTION_SCHEMA_LEN,
        RitArenaError::ActionSchemaTooLong
    );

    // min_agents must be <= max_agents
    require!(min_agents <= max_agents, RitArenaError::TooFewMaxAgents);

    // Validate prize_split sums to 100 (use u32 to avoid u16 overflow)
    let sum: u32 = prize_split.iter().map(|&v| v as u32).sum();
    require!(sum == 100, RitArenaError::InvalidPrizeSplit);

    // Transfer stake bond if > 0
    if stake_bond_amount > 0 {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.key(),
                Transfer {
                    from: ctx.accounts.creator_usdc.to_account_info(),
                    to: ctx.accounts.bond_vault.to_account_info(),
                    authority: ctx.accounts.creator.to_account_info(),
                },
            ),
            stake_bond_amount,
        )?;
    }

    // Initialize arena
    let arena = &mut ctx.accounts.arena;
    arena.id = ctx.accounts.protocol.total_arenas;
    arena.creator = ctx.accounts.creator.key();
    arena.oracle = ctx.accounts.creator.key();
    arena.usdc_mint = ctx.accounts.usdc_mint.key();

    arena.entry_fee = entry_fee;
    arena.max_agents = max_agents;
    arena.min_agents = min_agents;
    arena.duration = duration;
    arena.elimination_interval = elimination_interval;
    arena.elimination_percent = elimination_percent;
    arena.creator_fee_bps = creator_fee_bps;
    arena.prize_split = prize_split;
    arena.action_schema = action_schema;
    arena.rules_hash = rules_hash;

    arena.min_arenas_completed = min_arenas_completed;
    arena.min_wins = min_wins;
    arena.min_registration_age = min_registration_age;

    arena.state = ArenaState::Registration;
    arena.current_agents = 0;
    arena.alive_agents = 0;
    arena.current_round = 0;
    arena.started_at = 0;
    arena.last_submission_at = 0;

    arena.latest_merkle_root = [0u8; 32];

    arena.total_entry_fees = 0;
    arena.sponsor_deposit = 0;
    arena.stake_bond_amount = stake_bond_amount;
    arena.creator_fee_claimed = false;
    arena.bond_returned = false;
    arena.protocol_fee_collected = false;

    arena.bump = ctx.bumps.arena;
    arena.vault_bump = ctx.bumps.arena_vault;
    arena.bond_vault_bump = ctx.bumps.bond_vault;

    // Increment protocol arena count
    ctx.accounts.protocol.total_arenas += 1;

    Ok(())
}
