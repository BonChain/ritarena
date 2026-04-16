use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::RitArenaError;
use crate::state::{Arena, ArenaEntry, ArenaState};

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PrizeAssignment {
    pub entry: Pubkey,
    pub rank: u8,
}

#[derive(Accounts)]
pub struct FinalizeArena<'info> {
    pub oracle: Signer<'info>,

    #[account(
        mut,
        seeds = [ARENA_SEED, &arena.id.to_le_bytes()],
        bump = arena.bump,
        constraint = arena.oracle == oracle.key() @ RitArenaError::UnauthorizedOracle,
        constraint = arena.state == ArenaState::Active || arena.state == ArenaState::Eliminating @ RitArenaError::ArenaNotActive,
    )]
    pub arena: Box<Account<'info, Arena>>,
}

pub fn handler(
    ctx: Context<FinalizeArena>,
    final_merkle_root: [u8; 32],
    winners: Vec<PrizeAssignment>,
) -> Result<()> {
    let arena = &mut ctx.accounts.arena;

    arena.latest_merkle_root = final_merkle_root;
    arena.state = ArenaState::Finished;

    // Process remaining accounts: assign prize ranks
    let arena_key = arena.key();
    let remaining = &ctx.remaining_accounts;

    for account_info in remaining.iter() {
        // Verify account is owned by this program
        if account_info.owner != &crate::ID {
            continue;
        }

        let mut data = account_info.try_borrow_mut_data()?;

        if data.len() < 8 {
            continue;
        }

        let discriminator = &data[..8];
        let expected = ArenaEntry::DISCRIMINATOR;
        if discriminator != expected {
            continue;
        }

        let mut entry = ArenaEntry::try_deserialize(&mut &data[..])
            .map_err(|_| error!(RitArenaError::ArenaNotActive))?;

        if entry.arena != arena_key {
            continue;
        }

        let entry_key = *account_info.key;

        for w in winners.iter() {
            if w.entry == entry_key {
                entry.prize_rank = w.rank;
                break;
            }
        }

        // Re-serialize back (skip discriminator)
        let mut writer = &mut data[8..];
        entry.serialize(&mut writer)?;
    }

    Ok(())
}
