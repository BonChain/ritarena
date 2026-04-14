use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use crate::constants::*;
use crate::error::RitArenaError;
use crate::state::ProtocolConfig;

#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        constraint = usdc_mint.decimals == USDC_DECIMALS @ RitArenaError::InvalidUsdcMint,
    )]
    pub usdc_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        space = 8 + ProtocolConfig::INIT_SPACE,
        seeds = [PROTOCOL_SEED],
        bump,
    )]
    pub protocol: Account<'info, ProtocolConfig>,

    /// CHECK: PDA used as treasury authority for token accounts.
    /// The treasury USDC ATA is created lazily in register_profile (init_if_needed).
    #[account(
        seeds = [TREASURY_SEED],
        bump,
    )]
    pub treasury: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeProtocol>) -> Result<()> {
    let protocol = &mut ctx.accounts.protocol;
    protocol.authority = ctx.accounts.authority.key();
    protocol.usdc_mint = ctx.accounts.usdc_mint.key();
    protocol.treasury = ctx.accounts.treasury.key();
    protocol.total_arenas = 0;
    protocol.bump = ctx.bumps.protocol;
    Ok(())
}
