use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};

use crate::constants::*;
use crate::error::RitArenaError;
use crate::state::ProtocolConfig;

#[derive(Accounts)]
pub struct MintTestUsdc<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,

    #[account(
        seeds = [PROTOCOL_SEED],
        bump = protocol.bump,
    )]
    pub protocol: Account<'info, ProtocolConfig>,

    #[account(
        mut,
        address = protocol.usdc_mint,
    )]
    pub usdc_mint: Account<'info, Mint>,

    #[account(
        mut,
        token::mint = usdc_mint,
    )]
    pub recipient_usdc: Account<'info, TokenAccount>,

    /// CHECK: PDA used as the mint authority. Verified by seeds + the SPL Token mint_to CPI.
    #[account(
        seeds = [TEST_USDC_MINT_AUTHORITY_SEED],
        bump,
    )]
    pub mint_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<MintTestUsdc>, amount: u64) -> Result<()> {
    require!(amount <= MAX_TEST_USDC_PER_CALL, RitArenaError::MintAmountTooLarge);

    let bump = ctx.bumps.mint_authority;
    let signer_seeds: &[&[&[u8]]] = &[&[TEST_USDC_MINT_AUTHORITY_SEED, &[bump]]];

    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            MintTo {
                mint: ctx.accounts.usdc_mint.to_account_info(),
                to: ctx.accounts.recipient_usdc.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
    )?;

    Ok(())
}
