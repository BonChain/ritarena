mod helpers;

use helpers::*;
use solana_instruction::{AccountMeta, Instruction};
use solana_keypair::Keypair;
use solana_program_pack::Pack;
use solana_pubkey::Pubkey;
use solana_signer::Signer;

// ── PDA helpers ──────────────────────────────────────────────────────

fn arena_pda(arena_id: u64) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"arena", &arena_id.to_le_bytes()], &PROGRAM_ID)
}

fn arena_vault_pda(arena: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"arena_vault", arena.as_ref()], &PROGRAM_ID)
}

fn bond_vault_pda(arena: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"bond_vault", arena.as_ref()], &PROGRAM_ID)
}

fn arena_entry_pda(arena: &Pubkey, agent_profile: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[b"arena_entry", arena.as_ref(), agent_profile.as_ref()],
        &PROGRAM_ID,
    )
}

// ── Instruction builders ─────────────────────────────────────────────

struct CreateArenaArgs {
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
}

impl Default for CreateArenaArgs {
    fn default() -> Self {
        Self {
            entry_fee: 10_000_000,
            max_agents: 10,
            min_agents: 2,
            duration: 3600,
            elimination_interval: 600,
            elimination_percent: 25,
            creator_fee_bps: 500,
            prize_split: vec![60, 40],
            action_schema: "{}".to_string(),
            rules_hash: [0u8; 32],
            min_arenas_completed: 0,
            min_wins: 0,
            min_registration_age: 0,
            stake_bond_amount: 50_000_000,
        }
    }
}

fn serialize_create_arena_data(args: &CreateArenaArgs) -> Vec<u8> {
    let disc = anchor_discriminator("create_arena");
    let mut data = Vec::new();
    data.extend_from_slice(&disc);
    data.extend_from_slice(&args.entry_fee.to_le_bytes());
    data.extend_from_slice(&args.max_agents.to_le_bytes());
    data.extend_from_slice(&args.min_agents.to_le_bytes());
    data.extend_from_slice(&args.duration.to_le_bytes());
    data.extend_from_slice(&args.elimination_interval.to_le_bytes());
    data.push(args.elimination_percent);
    data.extend_from_slice(&args.creator_fee_bps.to_le_bytes());
    data.extend_from_slice(&(args.prize_split.len() as u32).to_le_bytes());
    for &v in &args.prize_split {
        data.extend_from_slice(&v.to_le_bytes());
    }
    let schema_bytes = args.action_schema.as_bytes();
    data.extend_from_slice(&(schema_bytes.len() as u32).to_le_bytes());
    data.extend_from_slice(schema_bytes);
    data.extend_from_slice(&args.rules_hash);
    data.extend_from_slice(&args.min_arenas_completed.to_le_bytes());
    data.extend_from_slice(&args.min_wins.to_le_bytes());
    data.extend_from_slice(&args.min_registration_age.to_le_bytes());
    data.extend_from_slice(&args.stake_bond_amount.to_le_bytes());
    data
}

fn build_create_arena_ix(
    creator: &Pubkey,
    usdc_mint: &Pubkey,
    creator_usdc: &Pubkey,
    arena_id: u64,
    args: &CreateArenaArgs,
) -> Instruction {
    let (protocol_pda, _) = protocol_pda();
    let (arena, _) = arena_pda(arena_id);
    let (arena_vault, _) = arena_vault_pda(&arena);
    let (bond_vault, _) = bond_vault_pda(&arena);

    Instruction {
        program_id: PROGRAM_ID,
        accounts: vec![
            AccountMeta::new(*creator, true),
            AccountMeta::new(protocol_pda, false),
            AccountMeta::new(arena, false),
            AccountMeta::new_readonly(*usdc_mint, false),
            AccountMeta::new(arena_vault, false),
            AccountMeta::new(bond_vault, false),
            AccountMeta::new(*creator_usdc, false),
            AccountMeta::new_readonly(spl_token::id(), false),
            AccountMeta::new_readonly(
                solana_pubkey::pubkey!("11111111111111111111111111111111"),
                false,
            ),
        ],
        data: serialize_create_arena_data(args),
    }
}

fn build_register_profile_ix(owner: &Pubkey, name: &str) -> Instruction {
    let (agent_profile, _) = agent_profile_pda(owner);

    let disc = anchor_discriminator("register_profile");
    let name_bytes = name.as_bytes();
    let mut data = Vec::with_capacity(8 + 4 + name_bytes.len());
    data.extend_from_slice(&disc);
    data.extend_from_slice(&(name_bytes.len() as u32).to_le_bytes());
    data.extend_from_slice(name_bytes);

    Instruction {
        program_id: PROGRAM_ID,
        accounts: vec![
            AccountMeta::new(*owner, true),
            AccountMeta::new(agent_profile, false),
            AccountMeta::new_readonly(
                solana_pubkey::pubkey!("11111111111111111111111111111111"),
                false,
            ),
        ],
        data,
    }
}

fn build_enter_arena_ix(
    agent_owner: &Pubkey,
    usdc_mint: &Pubkey,
    agent_usdc: &Pubkey,
    arena_id: u64,
) -> Instruction {
    let (agent_profile, _) = agent_profile_pda(agent_owner);
    let (arena, _) = arena_pda(arena_id);
    let (arena_vault, _) = arena_vault_pda(&arena);
    let (arena_entry, _) = arena_entry_pda(&arena, &agent_profile);

    let disc = anchor_discriminator("enter_arena");

    Instruction {
        program_id: PROGRAM_ID,
        accounts: vec![
            AccountMeta::new(*agent_owner, true),
            AccountMeta::new(agent_profile, false),
            AccountMeta::new(arena, false),
            AccountMeta::new(arena_entry, false),
            AccountMeta::new(*agent_usdc, false),
            AccountMeta::new(arena_vault, false),
            AccountMeta::new_readonly(*usdc_mint, false),
            AccountMeta::new_readonly(spl_token::id(), false),
            AccountMeta::new_readonly(
                solana_pubkey::pubkey!("11111111111111111111111111111111"),
                false,
            ),
        ],
        data: disc.to_vec(),
    }
}

fn build_start_arena_ix(oracle: &Pubkey, arena_id: u64) -> Instruction {
    let (arena, _) = arena_pda(arena_id);
    let disc = anchor_discriminator("start_arena");

    Instruction {
        program_id: PROGRAM_ID,
        accounts: vec![
            AccountMeta::new_readonly(*oracle, true),
            AccountMeta::new(arena, false),
        ],
        data: disc.to_vec(),
    }
}

fn build_submit_elimination_ix(
    oracle: &Pubkey,
    arena_id: u64,
    merkle_root: [u8; 32],
    round_number: u32,
    eliminated: &[Pubkey],
    scores: &[(Pubkey, i64)],
    remaining_accounts: &[Pubkey],
) -> Instruction {
    let (arena, _) = arena_pda(arena_id);
    let disc = anchor_discriminator("submit_elimination");

    let mut data = Vec::new();
    data.extend_from_slice(&disc);
    data.extend_from_slice(&merkle_root);
    data.extend_from_slice(&round_number.to_le_bytes());
    data.extend_from_slice(&(eliminated.len() as u32).to_le_bytes());
    for pk in eliminated {
        data.extend_from_slice(&pk.to_bytes());
    }
    data.extend_from_slice(&(scores.len() as u32).to_le_bytes());
    for (pk, score) in scores {
        data.extend_from_slice(&pk.to_bytes());
        data.extend_from_slice(&score.to_le_bytes());
    }

    let mut accounts = vec![
        AccountMeta::new_readonly(*oracle, true),
        AccountMeta::new(arena, false),
    ];
    for pk in remaining_accounts {
        accounts.push(AccountMeta::new(*pk, false));
    }

    Instruction {
        program_id: PROGRAM_ID,
        accounts,
        data,
    }
}

fn build_finalize_arena_ix(
    oracle: &Pubkey,
    arena_id: u64,
    final_merkle_root: [u8; 32],
    winners: &[(Pubkey, u8)],
    remaining_accounts: &[Pubkey],
) -> Instruction {
    let (arena, _) = arena_pda(arena_id);
    let disc = anchor_discriminator("finalize_arena");

    let mut data = Vec::new();
    data.extend_from_slice(&disc);
    data.extend_from_slice(&final_merkle_root);
    data.extend_from_slice(&(winners.len() as u32).to_le_bytes());
    for (pk, rank) in winners {
        data.extend_from_slice(&pk.to_bytes());
        data.push(*rank);
    }

    let mut accounts = vec![
        AccountMeta::new_readonly(*oracle, true),
        AccountMeta::new(arena, false),
    ];
    for pk in remaining_accounts {
        accounts.push(AccountMeta::new(*pk, false));
    }

    Instruction {
        program_id: PROGRAM_ID,
        accounts,
        data,
    }
}

fn build_claim_prize_ix(
    winner: &Pubkey,
    arena_id: u64,
    agent_profile: &Pubkey,
    usdc_mint: &Pubkey,
    winner_usdc: &Pubkey,
) -> Instruction {
    let (arena, _) = arena_pda(arena_id);
    let (arena_entry, _) = arena_entry_pda(&arena, agent_profile);
    let (arena_vault, _) = arena_vault_pda(&arena);
    let disc = anchor_discriminator("claim_prize");

    Instruction {
        program_id: PROGRAM_ID,
        accounts: vec![
            AccountMeta::new(*winner, true),
            AccountMeta::new_readonly(arena, false),
            AccountMeta::new(arena_entry, false),
            AccountMeta::new(arena_vault, false),
            AccountMeta::new(*winner_usdc, false),
            AccountMeta::new_readonly(*usdc_mint, false),
            AccountMeta::new_readonly(spl_token::id(), false),
        ],
        data: disc.to_vec(),
    }
}

fn build_claim_creator_fee_ix(
    creator: &Pubkey,
    arena_id: u64,
    usdc_mint: &Pubkey,
    creator_usdc: &Pubkey,
) -> Instruction {
    let (arena, _) = arena_pda(arena_id);
    let (arena_vault, _) = arena_vault_pda(&arena);
    let disc = anchor_discriminator("claim_creator_fee");

    Instruction {
        program_id: PROGRAM_ID,
        accounts: vec![
            AccountMeta::new_readonly(*creator, true),
            AccountMeta::new(arena, false),
            AccountMeta::new(arena_vault, false),
            AccountMeta::new(*creator_usdc, false),
            AccountMeta::new_readonly(*usdc_mint, false),
            AccountMeta::new_readonly(spl_token::id(), false),
        ],
        data: disc.to_vec(),
    }
}

fn build_return_stake_bond_ix(
    creator: &Pubkey,
    arena_id: u64,
    usdc_mint: &Pubkey,
    creator_usdc: &Pubkey,
) -> Instruction {
    let (arena, _) = arena_pda(arena_id);
    let (bond_vault, _) = bond_vault_pda(&arena);
    let disc = anchor_discriminator("return_stake_bond");

    Instruction {
        program_id: PROGRAM_ID,
        accounts: vec![
            AccountMeta::new_readonly(*creator, true),
            AccountMeta::new(arena, false),
            AccountMeta::new(bond_vault, false),
            AccountMeta::new(*creator_usdc, false),
            AccountMeta::new_readonly(*usdc_mint, false),
            AccountMeta::new_readonly(spl_token::id(), false),
        ],
        data: disc.to_vec(),
    }
}

fn build_cancel_arena_ix(creator: &Pubkey, arena_id: u64) -> Instruction {
    let (arena, _) = arena_pda(arena_id);
    let disc = anchor_discriminator("cancel_arena");

    Instruction {
        program_id: PROGRAM_ID,
        accounts: vec![
            AccountMeta::new_readonly(*creator, true),
            AccountMeta::new(arena, false),
        ],
        data: disc.to_vec(),
    }
}

fn build_refund_entry_ix(
    agent_owner: &Pubkey,
    arena_id: u64,
    agent_profile: &Pubkey,
    usdc_mint: &Pubkey,
    agent_usdc: &Pubkey,
) -> Instruction {
    let (arena, _) = arena_pda(arena_id);
    let (arena_entry, _) = arena_entry_pda(&arena, agent_profile);
    let (arena_vault, _) = arena_vault_pda(&arena);
    let disc = anchor_discriminator("refund_entry");

    Instruction {
        program_id: PROGRAM_ID,
        accounts: vec![
            AccountMeta::new_readonly(*agent_owner, true),
            AccountMeta::new(arena, false),
            AccountMeta::new(arena_entry, false),
            AccountMeta::new(arena_vault, false),
            AccountMeta::new(*agent_usdc, false),
            AccountMeta::new_readonly(*usdc_mint, false),
            AccountMeta::new_readonly(spl_token::id(), false),
        ],
        data: disc.to_vec(),
    }
}

fn build_abandon_arena_ix(
    caller: &Pubkey,
    arena_id: u64,
    usdc_mint: &Pubkey,
    treasury_usdc: &Pubkey,
) -> Instruction {
    let (protocol_pda, _) = protocol_pda();
    let (arena, _) = arena_pda(arena_id);
    let (bond_vault, _) = bond_vault_pda(&arena);
    let disc = anchor_discriminator("abandon_arena");

    Instruction {
        program_id: PROGRAM_ID,
        accounts: vec![
            AccountMeta::new_readonly(*caller, true),
            AccountMeta::new_readonly(protocol_pda, false),
            AccountMeta::new(arena, false),
            AccountMeta::new(bond_vault, false),
            AccountMeta::new(*treasury_usdc, false),
            AccountMeta::new_readonly(*usdc_mint, false),
            AccountMeta::new_readonly(spl_token::id(), false),
        ],
        data: disc.to_vec(),
    }
}

fn build_collect_protocol_fee_ix(
    caller: &Pubkey,
    arena_id: u64,
    usdc_mint: &Pubkey,
    treasury_usdc: &Pubkey,
) -> Instruction {
    let (protocol_pda, _) = protocol_pda();
    let (arena, _) = arena_pda(arena_id);
    let (arena_vault, _) = arena_vault_pda(&arena);
    let disc = anchor_discriminator("collect_protocol_fee");

    Instruction {
        program_id: PROGRAM_ID,
        accounts: vec![
            AccountMeta::new_readonly(*caller, true),
            AccountMeta::new_readonly(protocol_pda, false),
            AccountMeta::new(arena, false),
            AccountMeta::new(arena_vault, false),
            AccountMeta::new(*treasury_usdc, false),
            AccountMeta::new_readonly(*usdc_mint, false),
            AccountMeta::new_readonly(spl_token::id(), false),
        ],
        data: disc.to_vec(),
    }
}

fn get_token_balance(svm: &litesvm::LiteSVM, account: &Pubkey) -> u64 {
    let acc = svm.get_account(account).unwrap();
    let token_account = spl_token::state::Account::unpack(&acc.data).unwrap();
    token_account.amount
}

// ── Scaffolding helpers ──────────────────────────────────────────────

/// Set up SVM with protocol initialized, creator funded, profile registered,
/// and treasury USDC token account created.
/// Returns (svm, creator, usdc_mint, creator_usdc).
fn setup_protocol() -> (litesvm::LiteSVM, Keypair, Pubkey, Pubkey) {
    let mut svm = setup();
    let creator = Keypair::new();
    svm.airdrop(&creator.pubkey(), 10_000_000_000).unwrap();

    let usdc_mint = create_usdc_mint(&mut svm, &creator);
    initialize_protocol(&mut svm, &creator, &usdc_mint);

    let creator_usdc = create_token_account(&mut svm, &creator, &usdc_mint, &creator.pubkey());
    mint_to(&mut svm, &creator, &usdc_mint, &creator_usdc, 1_000_000_000);

    let reg = build_register_profile_ix(&creator.pubkey(), "Creator");
    send_tx(&mut svm, &[reg], &creator, &[&creator]).unwrap();

    // Create treasury USDC token account (required by abandon_arena + collect_protocol_fee)
    let (treasury_pda_key, _) = treasury_pda();
    create_token_account(&mut svm, &creator, &usdc_mint, &treasury_pda_key);

    (svm, creator, usdc_mint, creator_usdc)
}

/// Create default arena (arena_id = 0) and return arena_id.
fn create_default_arena(
    svm: &mut litesvm::LiteSVM,
    creator: &Keypair,
    usdc_mint: &Pubkey,
    creator_usdc: &Pubkey,
    args: &CreateArenaArgs,
) -> u64 {
    // Read protocol to get current arena count (= next arena id)
    let (protocol_key, _) = protocol_pda();
    let protocol_acc = svm.get_account(&protocol_key).unwrap();
    let protocol: ritarena::ProtocolConfig =
        anchor_lang::AccountDeserialize::try_deserialize(&mut &protocol_acc.data[..]).unwrap();
    let arena_id = protocol.total_arenas;

    let ix = build_create_arena_ix(&creator.pubkey(), usdc_mint, creator_usdc, arena_id, args);
    send_tx(svm, &[ix], creator, &[creator]).unwrap();
    arena_id
}

/// Register an agent, fund with USDC, return (keypair, usdc_account).
fn register_agent(
    svm: &mut litesvm::LiteSVM,
    funder: &Keypair,
    usdc_mint: &Pubkey,
    name: &str,
    usdc_amount: u64,
) -> (Keypair, Pubkey) {
    let agent = Keypair::new();
    svm.airdrop(&agent.pubkey(), 10_000_000_000).unwrap();
    let agent_usdc = create_token_account(svm, funder, usdc_mint, &agent.pubkey());
    if usdc_amount > 0 {
        mint_to(svm, funder, usdc_mint, &agent_usdc, usdc_amount);
    }
    let reg = build_register_profile_ix(&agent.pubkey(), name);
    send_tx(svm, &[reg], &agent, &[&agent]).unwrap();
    (agent, agent_usdc)
}

/// Enter an agent into arena; returns agent's entry PDA.
fn enter_agent(
    svm: &mut litesvm::LiteSVM,
    agent: &Keypair,
    usdc_mint: &Pubkey,
    agent_usdc: &Pubkey,
    arena_id: u64,
) -> Pubkey {
    let ix = build_enter_arena_ix(&agent.pubkey(), usdc_mint, agent_usdc, arena_id);
    send_tx(svm, &[ix], agent, &[agent]).unwrap();
    let (agent_profile, _) = agent_profile_pda(&agent.pubkey());
    let (arena, _) = arena_pda(arena_id);
    let (entry, _) = arena_entry_pda(&arena, &agent_profile);
    entry
}

/// Run the full lifecycle: create arena, register 2 agents, enter, start, eliminate, finalize.
/// Returns (arena_id, agent1, agent1_usdc, agent2, agent2_usdc, entry1, entry2).
fn run_full_lifecycle(
    svm: &mut litesvm::LiteSVM,
    creator: &Keypair,
    usdc_mint: &Pubkey,
    creator_usdc: &Pubkey,
) -> (u64, Keypair, Pubkey, Keypair, Pubkey, Pubkey, Pubkey) {
    let args = CreateArenaArgs::default();
    let arena_id = create_default_arena(svm, creator, usdc_mint, creator_usdc, &args);

    let (agent1, agent1_usdc) = register_agent(svm, creator, usdc_mint, "A1", 500_000_000);
    let (agent2, agent2_usdc) = register_agent(svm, creator, usdc_mint, "A2", 500_000_000);

    let entry1 = enter_agent(svm, &agent1, usdc_mint, &agent1_usdc, arena_id);
    let entry2 = enter_agent(svm, &agent2, usdc_mint, &agent2_usdc, arena_id);

    // Start
    let start_ix = build_start_arena_ix(&creator.pubkey(), arena_id);
    send_tx(svm, &[start_ix], creator, &[creator]).unwrap();

    // Eliminate agent2
    let submit_ix = build_submit_elimination_ix(
        &creator.pubkey(),
        arena_id,
        [1u8; 32],
        1,
        &[entry2],
        &[(entry1, 100), (entry2, 10)],
        &[entry1, entry2],
    );
    send_tx(svm, &[submit_ix], creator, &[creator]).unwrap();

    // Finalize: agent1=1st, agent2=2nd
    let finalize_ix = build_finalize_arena_ix(
        &creator.pubkey(),
        arena_id,
        [99u8; 32],
        &[(entry1, 1), (entry2, 2)],
        &[entry1, entry2],
    );
    send_tx(svm, &[finalize_ix], creator, &[creator]).unwrap();

    (arena_id, agent1, agent1_usdc, agent2, agent2_usdc, entry1, entry2)
}

fn get_treasury_usdc(usdc_mint: &Pubkey) -> Pubkey {
    let (treasury_pda_key, _) = treasury_pda();
    spl_associated_token_account::get_associated_token_address(&treasury_pda_key, usdc_mint)
}

// ═══════════════════════════════════════════════════════════════════════
// create_arena edge cases
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn test_create_arena_creator_fee_too_high() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs {
        creator_fee_bps: 2001,
        ..Default::default()
    };
    let ix = build_create_arena_ix(&creator.pubkey(), &usdc_mint, &creator_usdc, 0, &args);
    let result = send_tx(&mut svm, &[ix], &creator, &[&creator]);
    assert!(result.is_err(), "creator_fee_bps=2001 should fail");
}

#[test]
fn test_create_arena_too_few_max_agents() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs {
        max_agents: 1,
        min_agents: 1,
        ..Default::default()
    };
    let ix = build_create_arena_ix(&creator.pubkey(), &usdc_mint, &creator_usdc, 0, &args);
    let result = send_tx(&mut svm, &[ix], &creator, &[&creator]);
    assert!(result.is_err(), "max_agents=1 should fail");
}

#[test]
fn test_create_arena_too_many_max_agents() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs {
        max_agents: 101,
        ..Default::default()
    };
    let ix = build_create_arena_ix(&creator.pubkey(), &usdc_mint, &creator_usdc, 0, &args);
    let result = send_tx(&mut svm, &[ix], &creator, &[&creator]);
    assert!(result.is_err(), "max_agents=101 should fail");
}

#[test]
fn test_create_arena_invalid_elimination_percent_zero() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs {
        elimination_percent: 0,
        ..Default::default()
    };
    let ix = build_create_arena_ix(&creator.pubkey(), &usdc_mint, &creator_usdc, 0, &args);
    let result = send_tx(&mut svm, &[ix], &creator, &[&creator]);
    assert!(result.is_err(), "elimination_percent=0 should fail");
}

#[test]
fn test_create_arena_invalid_elimination_percent_100() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs {
        elimination_percent: 100,
        ..Default::default()
    };
    let ix = build_create_arena_ix(&creator.pubkey(), &usdc_mint, &creator_usdc, 0, &args);
    let result = send_tx(&mut svm, &[ix], &creator, &[&creator]);
    assert!(result.is_err(), "elimination_percent=100 should fail");
}

#[test]
fn test_create_arena_zero_duration() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs {
        duration: 0,
        ..Default::default()
    };
    let ix = build_create_arena_ix(&creator.pubkey(), &usdc_mint, &creator_usdc, 0, &args);
    let result = send_tx(&mut svm, &[ix], &creator, &[&creator]);
    assert!(result.is_err(), "duration=0 should fail");
}

#[test]
fn test_create_arena_zero_elimination_interval() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs {
        elimination_interval: 0,
        ..Default::default()
    };
    let ix = build_create_arena_ix(&creator.pubkey(), &usdc_mint, &creator_usdc, 0, &args);
    let result = send_tx(&mut svm, &[ix], &creator, &[&creator]);
    assert!(result.is_err(), "elimination_interval=0 should fail");
}

#[test]
fn test_create_arena_min_agents_gt_max() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs {
        max_agents: 3,
        min_agents: 5,
        ..Default::default()
    };
    let ix = build_create_arena_ix(&creator.pubkey(), &usdc_mint, &creator_usdc, 0, &args);
    let result = send_tx(&mut svm, &[ix], &creator, &[&creator]);
    assert!(result.is_err(), "min_agents > max_agents should fail");
}

#[test]
fn test_create_arena_no_bond() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs {
        stake_bond_amount: 0,
        ..Default::default()
    };
    let arena_id = create_default_arena(&mut svm, &creator, &usdc_mint, &creator_usdc, &args);
    let (arena_key, _) = arena_pda(arena_id);
    let (bond_vault_key, _) = bond_vault_pda(&arena_key);
    assert_eq!(get_token_balance(&svm, &bond_vault_key), 0);
}

#[test]
fn test_create_arena_free_entry() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs {
        entry_fee: 0,
        ..Default::default()
    };
    let arena_id = create_default_arena(&mut svm, &creator, &usdc_mint, &creator_usdc, &args);

    // Agent needs 5 USDC for registration fee, but 0 for entry
    let (agent, agent_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "FreeAgent", 5_000_000);
    let ix = build_enter_arena_ix(&agent.pubkey(), &usdc_mint, &agent_usdc, arena_id);
    let result = send_tx(&mut svm, &[ix], &agent, &[&agent]);
    assert!(result.is_ok(), "free entry should succeed");

    let (arena_key, _) = arena_pda(arena_id);
    let (arena_vault_key, _) = arena_vault_pda(&arena_key);
    assert_eq!(get_token_balance(&svm, &arena_vault_key), 0);
}

// ═══════════════════════════════════════════════════════════════════════
// enter_arena edge cases
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn test_enter_arena_not_registering() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs::default();
    let arena_id = create_default_arena(&mut svm, &creator, &usdc_mint, &creator_usdc, &args);

    let (agent1, agent1_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A1", 500_000_000);
    let (agent2, agent2_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A2", 500_000_000);
    enter_agent(&mut svm, &agent1, &usdc_mint, &agent1_usdc, arena_id);
    enter_agent(&mut svm, &agent2, &usdc_mint, &agent2_usdc, arena_id);

    // Start the arena
    let start_ix = build_start_arena_ix(&creator.pubkey(), arena_id);
    send_tx(&mut svm, &[start_ix], &creator, &[&creator]).unwrap();

    // Try to enter Active arena
    let (agent3, agent3_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A3", 500_000_000);
    let ix = build_enter_arena_ix(&agent3.pubkey(), &usdc_mint, &agent3_usdc, arena_id);
    let result = send_tx(&mut svm, &[ix], &agent3, &[&agent3]);
    assert!(result.is_err(), "entering Active arena should fail");
}

#[test]
fn test_enter_arena_full() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs {
        max_agents: 2,
        min_agents: 2,
        ..Default::default()
    };
    let arena_id = create_default_arena(&mut svm, &creator, &usdc_mint, &creator_usdc, &args);

    let (agent1, agent1_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A1", 500_000_000);
    let (agent2, agent2_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A2", 500_000_000);
    enter_agent(&mut svm, &agent1, &usdc_mint, &agent1_usdc, arena_id);
    enter_agent(&mut svm, &agent2, &usdc_mint, &agent2_usdc, arena_id);

    // Third agent should fail
    let (agent3, agent3_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A3", 500_000_000);
    let ix = build_enter_arena_ix(&agent3.pubkey(), &usdc_mint, &agent3_usdc, arena_id);
    let result = send_tx(&mut svm, &[ix], &agent3, &[&agent3]);
    assert!(result.is_err(), "entering full arena should fail");
}

#[test]
fn test_enter_arena_duplicate() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs::default();
    let arena_id = create_default_arena(&mut svm, &creator, &usdc_mint, &creator_usdc, &args);

    let (agent1, agent1_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A1", 500_000_000);
    enter_agent(&mut svm, &agent1, &usdc_mint, &agent1_usdc, arena_id);

    // Try entering again (PDA already exists)
    let ix = build_enter_arena_ix(&agent1.pubkey(), &usdc_mint, &agent1_usdc, arena_id);
    let result = send_tx(&mut svm, &[ix], &agent1, &[&agent1]);
    assert!(result.is_err(), "duplicate entry should fail");
}

#[test]
fn test_enter_arena_insufficient_funds() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs {
        entry_fee: 10_000_000, // 10 USDC
        ..Default::default()
    };
    let arena_id = create_default_arena(&mut svm, &creator, &usdc_mint, &creator_usdc, &args);

    // Agent with just enough for registration (5 USDC) but not entry fee (10 USDC)
    let (agent, agent_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "Broke", 5_000_000);
    let ix = build_enter_arena_ix(&agent.pubkey(), &usdc_mint, &agent_usdc, arena_id);
    let result = send_tx(&mut svm, &[ix], &agent, &[&agent]);
    assert!(result.is_err(), "entering with 0 USDC should fail");
}

#[test]
fn test_enter_arena_no_profile() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs::default();
    let arena_id = create_default_arena(&mut svm, &creator, &usdc_mint, &creator_usdc, &args);

    // Create agent WITHOUT registering a profile
    let agent = Keypair::new();
    svm.airdrop(&agent.pubkey(), 10_000_000_000).unwrap();
    let agent_usdc = create_token_account(&mut svm, &creator, &usdc_mint, &agent.pubkey());
    mint_to(&mut svm, &creator, &usdc_mint, &agent_usdc, 500_000_000);

    let ix = build_enter_arena_ix(&agent.pubkey(), &usdc_mint, &agent_usdc, arena_id);
    let result = send_tx(&mut svm, &[ix], &agent, &[&agent]);
    assert!(result.is_err(), "entering without profile should fail");
}

// ═══════════════════════════════════════════════════════════════════════
// start_arena edge cases
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn test_start_arena_unauthorized() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs::default();
    let arena_id = create_default_arena(&mut svm, &creator, &usdc_mint, &creator_usdc, &args);

    let (agent1, agent1_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A1", 500_000_000);
    let (agent2, agent2_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A2", 500_000_000);
    enter_agent(&mut svm, &agent1, &usdc_mint, &agent1_usdc, arena_id);
    enter_agent(&mut svm, &agent2, &usdc_mint, &agent2_usdc, arena_id);

    // Non-oracle tries to start
    let imposter = Keypair::new();
    svm.airdrop(&imposter.pubkey(), 10_000_000_000).unwrap();
    let ix = build_start_arena_ix(&imposter.pubkey(), arena_id);
    let result = send_tx(&mut svm, &[ix], &imposter, &[&imposter]);
    assert!(result.is_err(), "non-oracle should not start arena");
}

#[test]
fn test_start_arena_min_agents_not_met() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs {
        min_agents: 2,
        ..Default::default()
    };
    let arena_id = create_default_arena(&mut svm, &creator, &usdc_mint, &creator_usdc, &args);

    // Only 1 agent enters
    let (agent1, agent1_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A1", 500_000_000);
    enter_agent(&mut svm, &agent1, &usdc_mint, &agent1_usdc, arena_id);

    let ix = build_start_arena_ix(&creator.pubkey(), arena_id);
    let result = send_tx(&mut svm, &[ix], &creator, &[&creator]);
    assert!(result.is_err(), "starting with fewer than min_agents should fail");
}

#[test]
fn test_start_arena_already_active() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs::default();
    let arena_id = create_default_arena(&mut svm, &creator, &usdc_mint, &creator_usdc, &args);

    let (agent1, agent1_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A1", 500_000_000);
    let (agent2, agent2_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A2", 500_000_000);
    enter_agent(&mut svm, &agent1, &usdc_mint, &agent1_usdc, arena_id);
    enter_agent(&mut svm, &agent2, &usdc_mint, &agent2_usdc, arena_id);

    // Start once
    let ix = build_start_arena_ix(&creator.pubkey(), arena_id);
    send_tx(&mut svm, &[ix], &creator, &[&creator]).unwrap();

    // Try to start again
    let ix2 = build_start_arena_ix(&creator.pubkey(), arena_id);
    let result = send_tx(&mut svm, &[ix2], &creator, &[&creator]);
    assert!(result.is_err(), "starting already-Active arena should fail");
}

// ═══════════════════════════════════════════════════════════════════════
// submit_elimination edge cases
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn test_submit_elimination_wrong_round() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs::default();
    let arena_id = create_default_arena(&mut svm, &creator, &usdc_mint, &creator_usdc, &args);

    let (agent1, agent1_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A1", 500_000_000);
    let (agent2, agent2_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A2", 500_000_000);
    let entry1 = enter_agent(&mut svm, &agent1, &usdc_mint, &agent1_usdc, arena_id);
    let entry2 = enter_agent(&mut svm, &agent2, &usdc_mint, &agent2_usdc, arena_id);

    let start_ix = build_start_arena_ix(&creator.pubkey(), arena_id);
    send_tx(&mut svm, &[start_ix], &creator, &[&creator]).unwrap();

    // Submit round 5 when current is 0 (expects 1)
    let ix = build_submit_elimination_ix(
        &creator.pubkey(),
        arena_id,
        [1u8; 32],
        5,
        &[],
        &[],
        &[entry1, entry2],
    );
    let result = send_tx(&mut svm, &[ix], &creator, &[&creator]);
    assert!(result.is_err(), "wrong round number should fail");
}

#[test]
fn test_submit_elimination_not_active() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs::default();
    let arena_id = create_default_arena(&mut svm, &creator, &usdc_mint, &creator_usdc, &args);

    let (agent1, agent1_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A1", 500_000_000);
    let entry1 = enter_agent(&mut svm, &agent1, &usdc_mint, &agent1_usdc, arena_id);

    // Arena is still in Registration — submit should fail
    let ix = build_submit_elimination_ix(
        &creator.pubkey(),
        arena_id,
        [1u8; 32],
        1,
        &[],
        &[],
        &[entry1],
    );
    let result = send_tx(&mut svm, &[ix], &creator, &[&creator]);
    assert!(result.is_err(), "submitting to Registration arena should fail");
}

// ═══════════════════════════════════════════════════════════════════════
// finalize_arena edge cases
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn test_finalize_unauthorized() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs::default();
    let arena_id = create_default_arena(&mut svm, &creator, &usdc_mint, &creator_usdc, &args);

    let (agent1, agent1_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A1", 500_000_000);
    let (agent2, agent2_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A2", 500_000_000);
    let entry1 = enter_agent(&mut svm, &agent1, &usdc_mint, &agent1_usdc, arena_id);
    let entry2 = enter_agent(&mut svm, &agent2, &usdc_mint, &agent2_usdc, arena_id);

    let start_ix = build_start_arena_ix(&creator.pubkey(), arena_id);
    send_tx(&mut svm, &[start_ix], &creator, &[&creator]).unwrap();

    // Non-oracle tries to finalize
    let imposter = Keypair::new();
    svm.airdrop(&imposter.pubkey(), 10_000_000_000).unwrap();
    let ix = build_finalize_arena_ix(
        &imposter.pubkey(),
        arena_id,
        [99u8; 32],
        &[(entry1, 1), (entry2, 2)],
        &[entry1, entry2],
    );
    let result = send_tx(&mut svm, &[ix], &imposter, &[&imposter]);
    assert!(result.is_err(), "non-oracle should not finalize");
}

// ═══════════════════════════════════════════════════════════════════════
// claim_prize edge cases
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn test_claim_prize_not_finished() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs::default();
    let arena_id = create_default_arena(&mut svm, &creator, &usdc_mint, &creator_usdc, &args);

    let (agent1, agent1_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A1", 500_000_000);
    let (agent2, agent2_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A2", 500_000_000);
    enter_agent(&mut svm, &agent1, &usdc_mint, &agent1_usdc, arena_id);
    enter_agent(&mut svm, &agent2, &usdc_mint, &agent2_usdc, arena_id);

    let start_ix = build_start_arena_ix(&creator.pubkey(), arena_id);
    send_tx(&mut svm, &[start_ix], &creator, &[&creator]).unwrap();

    // Try to claim from Active arena
    let (agent1_profile, _) = agent_profile_pda(&agent1.pubkey());
    let ix = build_claim_prize_ix(
        &agent1.pubkey(),
        arena_id,
        &agent1_profile,
        &usdc_mint,
        &agent1_usdc,
    );
    let result = send_tx(&mut svm, &[ix], &agent1, &[&agent1]);
    assert!(result.is_err(), "claiming from Active arena should fail");
}

#[test]
fn test_claim_prize_not_winner() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs {
        prize_split: vec![100],
        ..Default::default()
    };
    let arena_id = create_default_arena(&mut svm, &creator, &usdc_mint, &creator_usdc, &args);

    let (agent1, agent1_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A1", 500_000_000);
    let (agent2, agent2_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A2", 500_000_000);
    let entry1 = enter_agent(&mut svm, &agent1, &usdc_mint, &agent1_usdc, arena_id);
    let entry2 = enter_agent(&mut svm, &agent2, &usdc_mint, &agent2_usdc, arena_id);

    let start_ix = build_start_arena_ix(&creator.pubkey(), arena_id);
    send_tx(&mut svm, &[start_ix], &creator, &[&creator]).unwrap();

    // Finalize: only agent1 is winner (rank=1), agent2 has rank=0 (not assigned)
    let finalize_ix = build_finalize_arena_ix(
        &creator.pubkey(),
        arena_id,
        [99u8; 32],
        &[(entry1, 1)],
        &[entry1, entry2],
    );
    send_tx(&mut svm, &[finalize_ix], &creator, &[&creator]).unwrap();

    // Agent2 (prize_rank=0) tries to claim
    let (agent2_profile, _) = agent_profile_pda(&agent2.pubkey());
    let ix = build_claim_prize_ix(
        &agent2.pubkey(),
        arena_id,
        &agent2_profile,
        &usdc_mint,
        &agent2_usdc,
    );
    let result = send_tx(&mut svm, &[ix], &agent2, &[&agent2]);
    assert!(result.is_err(), "non-winner should not claim prize");
}

#[test]
fn test_claim_prize_double_claim() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let (arena_id, agent1, agent1_usdc, _agent2, _agent2_usdc, _entry1, _entry2) =
        run_full_lifecycle(&mut svm, &creator, &usdc_mint, &creator_usdc);

    let (agent1_profile, _) = agent_profile_pda(&agent1.pubkey());

    // First claim succeeds
    let ix = build_claim_prize_ix(
        &agent1.pubkey(),
        arena_id,
        &agent1_profile,
        &usdc_mint,
        &agent1_usdc,
    );
    send_tx(&mut svm, &[ix], &agent1, &[&agent1]).unwrap();

    // Second claim should fail
    let ix2 = build_claim_prize_ix(
        &agent1.pubkey(),
        arena_id,
        &agent1_profile,
        &usdc_mint,
        &agent1_usdc,
    );
    let result = send_tx(&mut svm, &[ix2], &agent1, &[&agent1]);
    assert!(result.is_err(), "double claim should fail");
}

// ═══════════════════════════════════════════════════════════════════════
// claim_creator_fee edge cases
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn test_claim_creator_fee_not_creator() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let (arena_id, _agent1, _agent1_usdc, _agent2, _agent2_usdc, _entry1, _entry2) =
        run_full_lifecycle(&mut svm, &creator, &usdc_mint, &creator_usdc);

    // Non-creator tries to claim
    let imposter = Keypair::new();
    svm.airdrop(&imposter.pubkey(), 10_000_000_000).unwrap();
    let imposter_usdc = create_token_account(&mut svm, &creator, &usdc_mint, &imposter.pubkey());

    let ix = build_claim_creator_fee_ix(
        &imposter.pubkey(),
        arena_id,
        &usdc_mint,
        &imposter_usdc,
    );
    let result = send_tx(&mut svm, &[ix], &imposter, &[&imposter]);
    assert!(result.is_err(), "non-creator should not claim fee");
}

#[test]
fn test_claim_creator_fee_double_claim() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let (arena_id, _agent1, _agent1_usdc, _agent2, _agent2_usdc, _entry1, _entry2) =
        run_full_lifecycle(&mut svm, &creator, &usdc_mint, &creator_usdc);

    // First claim
    let ix = build_claim_creator_fee_ix(&creator.pubkey(), arena_id, &usdc_mint, &creator_usdc);
    send_tx(&mut svm, &[ix], &creator, &[&creator]).unwrap();

    // Second claim should fail
    let ix2 = build_claim_creator_fee_ix(&creator.pubkey(), arena_id, &usdc_mint, &creator_usdc);
    let result = send_tx(&mut svm, &[ix2], &creator, &[&creator]);
    assert!(result.is_err(), "double creator fee claim should fail");
}

// ═══════════════════════════════════════════════════════════════════════
// return_stake_bond edge cases
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn test_return_bond_not_finished() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs::default();
    let arena_id = create_default_arena(&mut svm, &creator, &usdc_mint, &creator_usdc, &args);

    let (agent1, agent1_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A1", 500_000_000);
    let (agent2, agent2_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A2", 500_000_000);
    enter_agent(&mut svm, &agent1, &usdc_mint, &agent1_usdc, arena_id);
    enter_agent(&mut svm, &agent2, &usdc_mint, &agent2_usdc, arena_id);

    let start_ix = build_start_arena_ix(&creator.pubkey(), arena_id);
    send_tx(&mut svm, &[start_ix], &creator, &[&creator]).unwrap();

    // Try to return bond from Active arena
    let ix = build_return_stake_bond_ix(&creator.pubkey(), arena_id, &usdc_mint, &creator_usdc);
    let result = send_tx(&mut svm, &[ix], &creator, &[&creator]);
    assert!(result.is_err(), "returning bond from Active arena should fail");
}

#[test]
fn test_return_bond_double_return() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let (arena_id, _agent1, _agent1_usdc, _agent2, _agent2_usdc, _entry1, _entry2) =
        run_full_lifecycle(&mut svm, &creator, &usdc_mint, &creator_usdc);

    // First return
    let ix = build_return_stake_bond_ix(&creator.pubkey(), arena_id, &usdc_mint, &creator_usdc);
    send_tx(&mut svm, &[ix], &creator, &[&creator]).unwrap();

    // Second return should fail
    let ix2 = build_return_stake_bond_ix(&creator.pubkey(), arena_id, &usdc_mint, &creator_usdc);
    let result = send_tx(&mut svm, &[ix2], &creator, &[&creator]);
    assert!(result.is_err(), "double bond return should fail");
}

// ═══════════════════════════════════════════════════════════════════════
// cancel_arena edge cases
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn test_cancel_arena_not_creator() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs::default();
    let arena_id = create_default_arena(&mut svm, &creator, &usdc_mint, &creator_usdc, &args);

    let imposter = Keypair::new();
    svm.airdrop(&imposter.pubkey(), 10_000_000_000).unwrap();

    let ix = build_cancel_arena_ix(&imposter.pubkey(), arena_id);
    let result = send_tx(&mut svm, &[ix], &imposter, &[&imposter]);
    assert!(result.is_err(), "non-creator should not cancel arena");
}

#[test]
fn test_cancel_arena_already_active() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs::default();
    let arena_id = create_default_arena(&mut svm, &creator, &usdc_mint, &creator_usdc, &args);

    let (agent1, agent1_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A1", 500_000_000);
    let (agent2, agent2_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A2", 500_000_000);
    enter_agent(&mut svm, &agent1, &usdc_mint, &agent1_usdc, arena_id);
    enter_agent(&mut svm, &agent2, &usdc_mint, &agent2_usdc, arena_id);

    let start_ix = build_start_arena_ix(&creator.pubkey(), arena_id);
    send_tx(&mut svm, &[start_ix], &creator, &[&creator]).unwrap();

    let ix = build_cancel_arena_ix(&creator.pubkey(), arena_id);
    let result = send_tx(&mut svm, &[ix], &creator, &[&creator]);
    assert!(result.is_err(), "cancelling Active arena should fail");
}

#[test]
fn test_cancel_then_refund() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs::default();
    let arena_id = create_default_arena(&mut svm, &creator, &usdc_mint, &creator_usdc, &args);

    let (agent1, agent1_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A1", 500_000_000);
    enter_agent(&mut svm, &agent1, &usdc_mint, &agent1_usdc, arena_id);

    let balance_after_entry = get_token_balance(&svm, &agent1_usdc);

    // Cancel
    let cancel_ix = build_cancel_arena_ix(&creator.pubkey(), arena_id);
    send_tx(&mut svm, &[cancel_ix], &creator, &[&creator]).unwrap();

    // Refund
    let (agent1_profile, _) = agent_profile_pda(&agent1.pubkey());
    let refund_ix = build_refund_entry_ix(
        &agent1.pubkey(),
        arena_id,
        &agent1_profile,
        &usdc_mint,
        &agent1_usdc,
    );
    send_tx(&mut svm, &[refund_ix], &agent1, &[&agent1]).unwrap();

    // Balance should be restored
    assert_eq!(
        get_token_balance(&svm, &agent1_usdc),
        balance_after_entry + 10_000_000
    );
}

// ═══════════════════════════════════════════════════════════════════════
// refund_entry edge cases
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn test_refund_not_refundable() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs::default();
    let arena_id = create_default_arena(&mut svm, &creator, &usdc_mint, &creator_usdc, &args);

    let (agent1, agent1_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A1", 500_000_000);
    let (agent2, agent2_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A2", 500_000_000);
    enter_agent(&mut svm, &agent1, &usdc_mint, &agent1_usdc, arena_id);
    enter_agent(&mut svm, &agent2, &usdc_mint, &agent2_usdc, arena_id);

    let start_ix = build_start_arena_ix(&creator.pubkey(), arena_id);
    send_tx(&mut svm, &[start_ix], &creator, &[&creator]).unwrap();

    // Try refund from Active arena
    let (agent1_profile, _) = agent_profile_pda(&agent1.pubkey());
    let ix = build_refund_entry_ix(
        &agent1.pubkey(),
        arena_id,
        &agent1_profile,
        &usdc_mint,
        &agent1_usdc,
    );
    let result = send_tx(&mut svm, &[ix], &agent1, &[&agent1]);
    assert!(result.is_err(), "refunding from Active arena should fail");
}

#[test]
fn test_refund_double_refund() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs::default();
    let arena_id = create_default_arena(&mut svm, &creator, &usdc_mint, &creator_usdc, &args);

    let (agent1, agent1_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A1", 500_000_000);
    enter_agent(&mut svm, &agent1, &usdc_mint, &agent1_usdc, arena_id);

    // Cancel arena to make refundable
    let cancel_ix = build_cancel_arena_ix(&creator.pubkey(), arena_id);
    send_tx(&mut svm, &[cancel_ix], &creator, &[&creator]).unwrap();

    // First refund
    let (agent1_profile, _) = agent_profile_pda(&agent1.pubkey());
    let ix = build_refund_entry_ix(
        &agent1.pubkey(),
        arena_id,
        &agent1_profile,
        &usdc_mint,
        &agent1_usdc,
    );
    send_tx(&mut svm, &[ix], &agent1, &[&agent1]).unwrap();

    // Second refund should fail
    let ix2 = build_refund_entry_ix(
        &agent1.pubkey(),
        arena_id,
        &agent1_profile,
        &usdc_mint,
        &agent1_usdc,
    );
    let result = send_tx(&mut svm, &[ix2], &agent1, &[&agent1]);
    assert!(result.is_err(), "double refund should fail");
}

// ═══════════════════════════════════════════════════════════════════════
// abandon_arena edge cases
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn test_abandon_not_timed_out() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs {
        elimination_interval: 600,
        ..Default::default()
    };
    let arena_id = create_default_arena(&mut svm, &creator, &usdc_mint, &creator_usdc, &args);

    let (agent1, agent1_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A1", 500_000_000);
    let (agent2, agent2_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A2", 500_000_000);
    enter_agent(&mut svm, &agent1, &usdc_mint, &agent1_usdc, arena_id);
    enter_agent(&mut svm, &agent2, &usdc_mint, &agent2_usdc, arena_id);

    let start_ix = build_start_arena_ix(&creator.pubkey(), arena_id);
    send_tx(&mut svm, &[start_ix], &creator, &[&creator]).unwrap();

    // Try to abandon immediately (not timed out, timeout = elimination_interval * 2 = 1200s)
    let treasury_usdc = get_treasury_usdc(&usdc_mint);
    let ix = build_abandon_arena_ix(&creator.pubkey(), arena_id, &usdc_mint, &treasury_usdc);
    let result = send_tx(&mut svm, &[ix], &creator, &[&creator]);
    assert!(result.is_err(), "abandoning before timeout should fail");
}

#[test]
fn test_abandon_then_refund() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs {
        elimination_interval: 600,
        ..Default::default()
    };
    let arena_id = create_default_arena(&mut svm, &creator, &usdc_mint, &creator_usdc, &args);

    let (agent1, agent1_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A1", 500_000_000);
    let (agent2, agent2_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A2", 500_000_000);
    enter_agent(&mut svm, &agent1, &usdc_mint, &agent1_usdc, arena_id);
    enter_agent(&mut svm, &agent2, &usdc_mint, &agent2_usdc, arena_id);

    let balance_after_entry = get_token_balance(&svm, &agent1_usdc);

    let start_ix = build_start_arena_ix(&creator.pubkey(), arena_id);
    send_tx(&mut svm, &[start_ix], &creator, &[&creator]).unwrap();

    // Advance clock past timeout (elimination_interval * 2 = 1200s)
    svm.set_sysvar::<solana_clock::Clock>(&solana_clock::Clock {
        unix_timestamp: 2000, // well past timeout
        ..Default::default()
    });

    // Abandon
    let treasury_usdc = get_treasury_usdc(&usdc_mint);
    let abandon_ix = build_abandon_arena_ix(&creator.pubkey(), arena_id, &usdc_mint, &treasury_usdc);
    send_tx(&mut svm, &[abandon_ix], &creator, &[&creator]).unwrap();

    // Verify arena state is Abandoned
    let (arena_key, _) = arena_pda(arena_id);
    let arena_acc = svm.get_account(&arena_key).unwrap();
    let arena: ritarena::Arena =
        anchor_lang::AccountDeserialize::try_deserialize(&mut &arena_acc.data[..]).unwrap();
    assert_eq!(arena.state, ritarena::ArenaState::Abandoned);

    // Agent refunds
    let (agent1_profile, _) = agent_profile_pda(&agent1.pubkey());
    let refund_ix = build_refund_entry_ix(
        &agent1.pubkey(),
        arena_id,
        &agent1_profile,
        &usdc_mint,
        &agent1_usdc,
    );
    send_tx(&mut svm, &[refund_ix], &agent1, &[&agent1]).unwrap();

    assert_eq!(
        get_token_balance(&svm, &agent1_usdc),
        balance_after_entry + 10_000_000
    );
}

// ═══════════════════════════════════════════════════════════════════════
// collect_protocol_fee edge cases
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn test_collect_protocol_fee_not_finished() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let args = CreateArenaArgs::default();
    let arena_id = create_default_arena(&mut svm, &creator, &usdc_mint, &creator_usdc, &args);

    let (agent1, agent1_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A1", 500_000_000);
    let (agent2, agent2_usdc) = register_agent(&mut svm, &creator, &usdc_mint, "A2", 500_000_000);
    enter_agent(&mut svm, &agent1, &usdc_mint, &agent1_usdc, arena_id);
    enter_agent(&mut svm, &agent2, &usdc_mint, &agent2_usdc, arena_id);

    let start_ix = build_start_arena_ix(&creator.pubkey(), arena_id);
    send_tx(&mut svm, &[start_ix], &creator, &[&creator]).unwrap();

    let treasury_usdc = get_treasury_usdc(&usdc_mint);
    let ix = build_collect_protocol_fee_ix(&creator.pubkey(), arena_id, &usdc_mint, &treasury_usdc);
    let result = send_tx(&mut svm, &[ix], &creator, &[&creator]);
    assert!(result.is_err(), "collecting from Active arena should fail");
}

#[test]
fn test_collect_protocol_fee_double_collect() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_protocol();
    let (arena_id, _agent1, _agent1_usdc, _agent2, _agent2_usdc, _entry1, _entry2) =
        run_full_lifecycle(&mut svm, &creator, &usdc_mint, &creator_usdc);

    let treasury_usdc = get_treasury_usdc(&usdc_mint);

    // First collect
    let ix = build_collect_protocol_fee_ix(&creator.pubkey(), arena_id, &usdc_mint, &treasury_usdc);
    send_tx(&mut svm, &[ix], &creator, &[&creator]).unwrap();

    // Second collect should fail
    let ix2 = build_collect_protocol_fee_ix(&creator.pubkey(), arena_id, &usdc_mint, &treasury_usdc);
    let result = send_tx(&mut svm, &[ix2], &creator, &[&creator]);
    assert!(result.is_err(), "double protocol fee collect should fail");
}
