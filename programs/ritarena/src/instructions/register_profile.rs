use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

use crate::constants::*;
use crate::error::RitArenaError;
use crate::state::{AgentProfile, ProtocolConfig};

#[derive(Accounts)]
pub struct RegisterProfile<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + AgentProfile::INIT_SPACE,
        seeds = [AGENT_PROFILE_SEED, owner.key().as_ref()],
        bump,
    )]
    pub agent_profile: Account<'info, AgentProfile>,

    #[account(
        seeds = [PROTOCOL_SEED],
        bump = protocol.bump,
    )]
    pub protocol: Account<'info, ProtocolConfig>,

    #[account(address = protocol.usdc_mint)]
    pub usdc_mint: Account<'info, Mint>,

    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = owner,
    )]
    pub owner_usdc: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = owner,
        associated_token::mint = usdc_mint,
        associated_token::authority = treasury,
    )]
    pub treasury_usdc: Account<'info, TokenAccount>,

    /// CHECK: PDA used as treasury authority for token accounts.
    #[account(
        seeds = [TREASURY_SEED],
        bump,
    )]
    pub treasury: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<RegisterProfile>, name: String) -> Result<()> {
    require!(name.len() <= MAX_NAME_LEN, RitArenaError::NameTooLong);

    // Transfer registration fee
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.key(),
            Transfer {
                from: ctx.accounts.owner_usdc.to_account_info(),
                to: ctx.accounts.treasury_usdc.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            },
        ),
        REGISTRATION_FEE,
    )?;

    // Initialize profile
    let profile = &mut ctx.accounts.agent_profile;
    profile.owner = ctx.accounts.owner.key();
    profile.name = name;
    profile.registered_at = Clock::get()?.unix_timestamp;
    profile.arenas_entered = 0;
    profile.arenas_completed = 0;
    profile.wins = 0;
    profile.top3 = 0;
    profile.eliminations = 0;
    profile.total_earnings = 0;
    profile.bump = ctx.bumps.agent_profile;

    Ok(())
}
