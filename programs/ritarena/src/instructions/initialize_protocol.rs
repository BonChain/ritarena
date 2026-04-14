use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use crate::constants::*;
use crate::state::ProtocolConfig;

#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    pub usdc_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        space = 8 + ProtocolConfig::INIT_SPACE,
        seeds = [PROTOCOL_SEED],
        bump,
    )]
    pub protocol: Account<'info, ProtocolConfig>,

    /// CHECK: PDA used as treasury token account authority
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
