use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::RitArenaError;
use crate::state::{Arena, ArenaEntry, ArenaState};

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ScoreUpdate {
    pub entry: Pubkey,
    pub score: i64,
}

#[derive(Accounts)]
pub struct SubmitElimination<'info> {
    pub oracle: Signer<'info>,

    #[account(
        mut,
        seeds = [ARENA_SEED, &arena.id.to_le_bytes()],
        bump = arena.bump,
        constraint = arena.oracle == oracle.key() @ RitArenaError::UnauthorizedOracle,
    )]
    pub arena: Box<Account<'info, Arena>>,
}

pub fn handler(
    ctx: Context<SubmitElimination>,
    merkle_root: [u8; 32],
    round_number: u32,
    eliminated: Vec<Pubkey>,
    scores: Vec<ScoreUpdate>,
) -> Result<()> {
    let arena = &mut ctx.accounts.arena;

    // 1. Arena must be Active or Eliminating
    require!(
        arena.state == ArenaState::Active || arena.state == ArenaState::Eliminating,
        RitArenaError::ArenaNotActive
    );

    // 2. round_number must equal current_round + 1
    require!(
        round_number == arena.current_round + 1,
        RitArenaError::InvalidRoundNumber
    );

    // 3. Update arena fields
    arena.latest_merkle_root = merkle_root;
    arena.current_round = round_number;
    arena.last_submission_at = Clock::get()?.unix_timestamp;

    // 4. Transition Active -> Eliminating
    if arena.state == ArenaState::Active {
        arena.state = ArenaState::Eliminating;
    }

    // 5. Process remaining accounts: update scores and mark eliminations
    let arena_key = arena.key();
    let remaining = &ctx.remaining_accounts;

    for account_info in remaining.iter() {
        // Verify account is owned by this program
        if account_info.owner != &crate::ID {
            continue;
        }

        // Deserialize the ArenaEntry (skip 8-byte discriminator)
        let mut data = account_info.try_borrow_mut_data()?;

        // Verify minimum size: 8 (discriminator) + ArenaEntry::INIT_SPACE
        if data.len() < 8 {
            continue;
        }

        // Verify discriminator matches ArenaEntry
        let discriminator = &data[..8];
        let expected = ArenaEntry::DISCRIMINATOR;
        if discriminator != expected {
            continue;
        }

        // Deserialize (after discriminator)
        let mut entry =
            ArenaEntry::try_deserialize(&mut &data[..]).map_err(|_| error!(RitArenaError::ArenaNotActive))?;

        // Verify it belongs to this arena
        if entry.arena != arena_key {
            continue;
        }

        let entry_key = *account_info.key;

        // Apply score update if present
        for su in scores.iter() {
            if su.entry == entry_key {
                entry.score = su.score;
                break;
            }
        }

        // Mark eliminated if in the list
        if eliminated.contains(&entry_key) && entry.alive {
            entry.alive = false;
            arena.alive_agents = arena.alive_agents.saturating_sub(1);
        }

        // Re-serialize back into the account data (skip discriminator)
        let mut writer = &mut data[8..];
        entry.serialize(&mut writer)?;
    }

    Ok(())
}
