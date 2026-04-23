use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::RitArenaError;
use crate::state::AgentProfile;

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

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<RegisterProfile>, name: String) -> Result<()> {
    require!(name.len() <= MAX_NAME_LEN, RitArenaError::NameTooLong);

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
