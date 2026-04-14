mod helpers;

use helpers::*;
use solana_instruction::{AccountMeta, Instruction};
use solana_keypair::Keypair;
use solana_pubkey::Pubkey;
use solana_signer::Signer;

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
            prize_split: vec![50, 30, 20],
            action_schema: "{}".to_string(),
            rules_hash: [0u8; 32],
            min_arenas_completed: 0,
            min_wins: 0,
            min_registration_age: 0,
            stake_bond_amount: 0,
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

fn build_register_profile_ix(
    owner: &Pubkey,
    usdc_mint: &Pubkey,
    owner_usdc: &Pubkey,
    name: &str,
) -> Instruction {
    let (protocol_pda, _) = protocol_pda();
    let (treasury_pda, _) = treasury_pda();
    let (agent_profile, _) = agent_profile_pda(owner);
    let treasury_usdc =
        spl_associated_token_account::get_associated_token_address(&treasury_pda, usdc_mint);

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
            AccountMeta::new_readonly(protocol_pda, false),
            AccountMeta::new_readonly(*usdc_mint, false),
            AccountMeta::new(*owner_usdc, false),
            AccountMeta::new(treasury_usdc, false),
            AccountMeta::new_readonly(treasury_pda, false),
            AccountMeta::new_readonly(spl_token::id(), false),
            AccountMeta::new_readonly(spl_associated_token_account::id(), false),
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
    // eliminated: Vec<Pubkey> — length-prefixed
    data.extend_from_slice(&(eliminated.len() as u32).to_le_bytes());
    for pk in eliminated {
        data.extend_from_slice(&pk.to_bytes());
    }
    // scores: Vec<ScoreUpdate> — length-prefixed
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

/// Full setup: init protocol, create USDC, register 2 profiles, create arena, enter both.
/// Returns (svm, oracle_keypair, usdc_mint, agent1_keypair, agent2_keypair, arena_id).
fn setup_arena_with_two_agents() -> (
    litesvm::LiteSVM,
    Keypair,  // oracle (also creator)
    Pubkey,   // usdc_mint
    Keypair,  // agent1
    Keypair,  // agent2
    u64,      // arena_id
) {
    let mut svm = setup();
    let oracle = Keypair::new();
    svm.airdrop(&oracle.pubkey(), 10_000_000_000).unwrap();

    let usdc_mint = create_usdc_mint(&mut svm, &oracle);
    initialize_protocol(&mut svm, &oracle, &usdc_mint);

    // Oracle registers + funds
    let oracle_usdc = create_token_account(&mut svm, &oracle, &usdc_mint, &oracle.pubkey());
    mint_to(&mut svm, &oracle, &usdc_mint, &oracle_usdc, 500_000_000);

    let register_ix = build_register_profile_ix(
        &oracle.pubkey(),
        &usdc_mint,
        &oracle_usdc,
        "OracleAgent",
    );
    send_tx(&mut svm, &[register_ix], &oracle, &[&oracle]).unwrap();

    // Agent 1
    let agent1 = Keypair::new();
    svm.airdrop(&agent1.pubkey(), 10_000_000_000).unwrap();
    let agent1_usdc = create_token_account(&mut svm, &oracle, &usdc_mint, &agent1.pubkey());
    mint_to(&mut svm, &oracle, &usdc_mint, &agent1_usdc, 500_000_000);
    let reg1 = build_register_profile_ix(
        &agent1.pubkey(),
        &usdc_mint,
        &agent1_usdc,
        "Agent1",
    );
    send_tx(&mut svm, &[reg1], &agent1, &[&agent1]).unwrap();

    // Agent 2
    let agent2 = Keypair::new();
    svm.airdrop(&agent2.pubkey(), 10_000_000_000).unwrap();
    let agent2_usdc = create_token_account(&mut svm, &oracle, &usdc_mint, &agent2.pubkey());
    mint_to(&mut svm, &oracle, &usdc_mint, &agent2_usdc, 500_000_000);
    let reg2 = build_register_profile_ix(
        &agent2.pubkey(),
        &usdc_mint,
        &agent2_usdc,
        "Agent2",
    );
    send_tx(&mut svm, &[reg2], &agent2, &[&agent2]).unwrap();

    // Create arena
    let arena_id: u64 = 0;
    let arena_args = CreateArenaArgs::default();
    let create_ix = build_create_arena_ix(
        &oracle.pubkey(),
        &usdc_mint,
        &oracle_usdc,
        arena_id,
        &arena_args,
    );
    send_tx(&mut svm, &[create_ix], &oracle, &[&oracle]).unwrap();

    // Enter both agents
    let enter1 = build_enter_arena_ix(&agent1.pubkey(), &usdc_mint, &agent1_usdc, arena_id);
    send_tx(&mut svm, &[enter1], &agent1, &[&agent1]).unwrap();

    let enter2 = build_enter_arena_ix(&agent2.pubkey(), &usdc_mint, &agent2_usdc, arena_id);
    send_tx(&mut svm, &[enter2], &agent2, &[&agent2]).unwrap();

    (svm, oracle, usdc_mint, agent1, agent2, arena_id)
}

#[test]
fn test_start_arena_success() {
    let (mut svm, oracle, _usdc_mint, _agent1, _agent2, arena_id) =
        setup_arena_with_two_agents();

    // Start the arena
    let start_ix = build_start_arena_ix(&oracle.pubkey(), arena_id);
    send_tx(&mut svm, &[start_ix], &oracle, &[&oracle]).unwrap();

    // Verify arena state = Active
    let (arena_key, _) = arena_pda(arena_id);
    let arena_account = svm.get_account(&arena_key).unwrap();
    let arena: ritarena::Arena =
        anchor_lang::AccountDeserialize::try_deserialize(&mut &arena_account.data[..]).unwrap();

    assert_eq!(arena.state, ritarena::ArenaState::Active);
    // started_at is set from Clock; in LiteSVM it may be 0 at genesis
    assert_eq!(arena.started_at, arena.last_submission_at);
    assert_eq!(arena.current_agents, 2);
}

#[test]
fn test_submit_elimination_unauthorized_fails() {
    let (mut svm, oracle, _usdc_mint, _agent1, _agent2, arena_id) =
        setup_arena_with_two_agents();

    // Start the arena
    let start_ix = build_start_arena_ix(&oracle.pubkey(), arena_id);
    send_tx(&mut svm, &[start_ix], &oracle, &[&oracle]).unwrap();

    // Try submit with wrong signer
    let imposter = Keypair::new();
    svm.airdrop(&imposter.pubkey(), 1_000_000_000).unwrap();

    let merkle_root = [1u8; 32];
    let submit_ix = build_submit_elimination_ix(
        &imposter.pubkey(),
        arena_id,
        merkle_root,
        1,
        &[],
        &[],
        &[],
    );

    let result = send_tx(&mut svm, &[submit_ix], &imposter, &[&imposter]);
    assert!(result.is_err(), "submit with unauthorized oracle should fail");
}

#[test]
fn test_submit_elimination_success() {
    let (mut svm, oracle, _usdc_mint, agent1, agent2, arena_id) =
        setup_arena_with_two_agents();

    // Start the arena
    let start_ix = build_start_arena_ix(&oracle.pubkey(), arena_id);
    send_tx(&mut svm, &[start_ix], &oracle, &[&oracle]).unwrap();

    // Get entry PDAs
    let (arena_key, _) = arena_pda(arena_id);
    let (agent1_profile, _) = agent_profile_pda(&agent1.pubkey());
    let (agent2_profile, _) = agent_profile_pda(&agent2.pubkey());
    let (entry1_key, _) = arena_entry_pda(&arena_key, &agent1_profile);
    let (entry2_key, _) = arena_entry_pda(&arena_key, &agent2_profile);

    // Submit elimination: eliminate agent1, give scores
    let merkle_root = [42u8; 32];
    let scores = vec![
        (entry1_key, 100i64),
        (entry2_key, 200i64),
    ];
    let eliminated = vec![entry1_key];
    let remaining = vec![entry1_key, entry2_key];

    let submit_ix = build_submit_elimination_ix(
        &oracle.pubkey(),
        arena_id,
        merkle_root,
        1,
        &eliminated,
        &scores,
        &remaining,
    );
    send_tx(&mut svm, &[submit_ix], &oracle, &[&oracle]).unwrap();

    // Verify arena
    let arena_account = svm.get_account(&arena_key).unwrap();
    let arena: ritarena::Arena =
        anchor_lang::AccountDeserialize::try_deserialize(&mut &arena_account.data[..]).unwrap();
    assert_eq!(arena.latest_merkle_root, merkle_root);
    assert_eq!(arena.current_round, 1);
    assert_eq!(arena.state, ritarena::ArenaState::Eliminating);
    assert_eq!(arena.alive_agents, 1);

    // Verify entry1 is eliminated with score
    let entry1_account = svm.get_account(&entry1_key).unwrap();
    let entry1: ritarena::ArenaEntry =
        anchor_lang::AccountDeserialize::try_deserialize(&mut &entry1_account.data[..]).unwrap();
    assert!(!entry1.alive);
    assert_eq!(entry1.score, 100);

    // Verify entry2 is still alive with score
    let entry2_account = svm.get_account(&entry2_key).unwrap();
    let entry2: ritarena::ArenaEntry =
        anchor_lang::AccountDeserialize::try_deserialize(&mut &entry2_account.data[..]).unwrap();
    assert!(entry2.alive);
    assert_eq!(entry2.score, 200);
}
