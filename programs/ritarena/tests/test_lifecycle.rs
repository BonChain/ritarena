mod helpers;

use helpers::*;
use solana_instruction::{AccountMeta, Instruction};
use solana_keypair::Keypair;
use solana_program_pack::Pack;
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
    winners: &[(Pubkey, u8)], // (entry_pubkey, rank)
    remaining_accounts: &[Pubkey],
) -> Instruction {
    let (arena, _) = arena_pda(arena_id);
    let disc = anchor_discriminator("finalize_arena");

    let mut data = Vec::new();
    data.extend_from_slice(&disc);
    data.extend_from_slice(&final_merkle_root);
    // Vec<PrizeAssignment>: length-prefixed, each is Pubkey + u8
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

#[test]
fn test_full_lifecycle() {
    // 1. Init protocol, create USDC mint
    let mut svm = setup();
    let creator = Keypair::new();
    svm.airdrop(&creator.pubkey(), 10_000_000_000).unwrap();

    let usdc_mint = create_usdc_mint(&mut svm, &creator);
    initialize_protocol(&mut svm, &creator, &usdc_mint);

    // Fund creator
    let creator_usdc = create_token_account(&mut svm, &creator, &usdc_mint, &creator.pubkey());
    mint_to(&mut svm, &creator, &usdc_mint, &creator_usdc, 1_000_000_000);

    // Register creator profile (needed since creator is also oracle)
    let reg_creator = build_register_profile_ix(&creator.pubkey(), "Creator");
    send_tx(&mut svm, &[reg_creator], &creator, &[&creator]).unwrap();

    // 2. Register 3 agents
    let agent1 = Keypair::new();
    let agent2 = Keypair::new();
    let agent3 = Keypair::new();

    for (agent, name) in [(&agent1, "Agent1"), (&agent2, "Agent2"), (&agent3, "Agent3")] {
        svm.airdrop(&agent.pubkey(), 10_000_000_000).unwrap();
        let agent_usdc_acc = create_token_account(&mut svm, &creator, &usdc_mint, &agent.pubkey());
        mint_to(&mut svm, &creator, &usdc_mint, &agent_usdc_acc, 500_000_000);
        let reg = build_register_profile_ix(&agent.pubkey(), name);
        send_tx(&mut svm, &[reg], agent, &[agent]).unwrap();
    }

    // Get USDC accounts for agents
    let agent1_usdc = spl_associated_token_account::get_associated_token_address(
        &agent1.pubkey(),
        &usdc_mint,
    );
    let agent2_usdc = spl_associated_token_account::get_associated_token_address(
        &agent2.pubkey(),
        &usdc_mint,
    );
    let agent3_usdc = spl_associated_token_account::get_associated_token_address(
        &agent3.pubkey(),
        &usdc_mint,
    );

    // 3. Create arena: 10 USDC entry, 50 USDC bond, 5% creator fee, prize_split [60, 40]
    let arena_id: u64 = 0;
    let arena_args = CreateArenaArgs {
        entry_fee: 10_000_000,      // 10 USDC
        max_agents: 10,
        min_agents: 2,
        duration: 3600,
        elimination_interval: 600,
        elimination_percent: 25,
        creator_fee_bps: 500,       // 5%
        prize_split: vec![60, 40],
        action_schema: "{}".to_string(),
        rules_hash: [0u8; 32],
        min_arenas_completed: 0,
        min_wins: 0,
        min_registration_age: 0,
        stake_bond_amount: 50_000_000, // 50 USDC
    };
    let create_ix = build_create_arena_ix(
        &creator.pubkey(),
        &usdc_mint,
        &creator_usdc,
        arena_id,
        &arena_args,
    );
    send_tx(&mut svm, &[create_ix], &creator, &[&creator]).unwrap();

    let (arena_key, _) = arena_pda(arena_id);
    let (arena_vault_key, _) = arena_vault_pda(&arena_key);
    let (bond_vault_key, _) = bond_vault_pda(&arena_key);

    // Verify bond was deposited
    assert_eq!(get_token_balance(&svm, &bond_vault_key), 50_000_000);

    // 4. All 3 agents enter
    for (agent, agent_usdc_acc) in [
        (&agent1, &agent1_usdc),
        (&agent2, &agent2_usdc),
        (&agent3, &agent3_usdc),
    ] {
        let enter = build_enter_arena_ix(
            &agent.pubkey(),
            &usdc_mint,
            agent_usdc_acc,
            arena_id,
        );
        send_tx(&mut svm, &[enter], agent, &[agent]).unwrap();
    }

    // Vault should have 30 USDC (3 * 10)
    assert_eq!(get_token_balance(&svm, &arena_vault_key), 30_000_000);

    // 5. Start arena
    let start_ix = build_start_arena_ix(&creator.pubkey(), arena_id);
    send_tx(&mut svm, &[start_ix], &creator, &[&creator]).unwrap();

    // Get entry PDAs
    let (agent1_profile, _) = agent_profile_pda(&agent1.pubkey());
    let (agent2_profile, _) = agent_profile_pda(&agent2.pubkey());
    let (agent3_profile, _) = agent_profile_pda(&agent3.pubkey());
    let (entry1_key, _) = arena_entry_pda(&arena_key, &agent1_profile);
    let (entry2_key, _) = arena_entry_pda(&arena_key, &agent2_profile);
    let (entry3_key, _) = arena_entry_pda(&arena_key, &agent3_profile);

    // 6. Submit elimination: eliminate agent3, update scores
    let merkle_root = [1u8; 32];
    let scores = vec![
        (entry1_key, 300i64),
        (entry2_key, 200i64),
        (entry3_key, 50i64),
    ];
    let eliminated = vec![entry3_key];
    let remaining = vec![entry1_key, entry2_key, entry3_key];

    let submit_ix = build_submit_elimination_ix(
        &creator.pubkey(),
        arena_id,
        merkle_root,
        1,
        &eliminated,
        &scores,
        &remaining,
    );
    send_tx(&mut svm, &[submit_ix], &creator, &[&creator]).unwrap();

    // Verify agent3 is eliminated
    let entry3_account = svm.get_account(&entry3_key).unwrap();
    let entry3: ritarena::ArenaEntry =
        anchor_lang::AccountDeserialize::try_deserialize(&mut &entry3_account.data[..]).unwrap();
    assert!(!entry3.alive);

    // 7. Finalize arena: assign prizes — agent1=1st, agent2=2nd
    let final_merkle_root = [99u8; 32];
    let winners = vec![(entry1_key, 1u8), (entry2_key, 2u8)];
    let finalize_ix = build_finalize_arena_ix(
        &creator.pubkey(),
        arena_id,
        final_merkle_root,
        &winners,
        &[entry1_key, entry2_key],
    );
    send_tx(&mut svm, &[finalize_ix], &creator, &[&creator]).unwrap();

    // Verify arena state is Finished
    let arena_account = svm.get_account(&arena_key).unwrap();
    let arena: ritarena::Arena =
        anchor_lang::AccountDeserialize::try_deserialize(&mut &arena_account.data[..]).unwrap();
    assert_eq!(arena.state, ritarena::ArenaState::Finished);
    assert_eq!(arena.latest_merkle_root, final_merkle_root);

    // Verify prize ranks
    let entry1_account = svm.get_account(&entry1_key).unwrap();
    let entry1: ritarena::ArenaEntry =
        anchor_lang::AccountDeserialize::try_deserialize(&mut &entry1_account.data[..]).unwrap();
    assert_eq!(entry1.prize_rank, 1);

    let entry2_account = svm.get_account(&entry2_key).unwrap();
    let entry2: ritarena::ArenaEntry =
        anchor_lang::AccountDeserialize::try_deserialize(&mut &entry2_account.data[..]).unwrap();
    assert_eq!(entry2.prize_rank, 2);

    // Calculate expected amounts:
    // total_pool = 30_000_000 (entry fees) + 0 (sponsor) = 30_000_000
    // protocol_fee = 30_000_000 * 100 / 10_000 = 300_000
    // creator_fee = 30_000_000 * 500 / 10_000 = 1_500_000
    // prize_pool = 30_000_000 - 300_000 - 1_500_000 = 28_200_000
    // agent1 prize (60%) = 28_200_000 * 60 / 100 = 16_920_000
    // agent2 prize (40%) = 28_200_000 * 40 / 100 = 11_280_000
    let total_pool: u64 = 30_000_000;
    let protocol_fee: u64 = total_pool * 100 / 10_000; // 300_000
    let creator_fee: u64 = total_pool * 500 / 10_000;  // 1_500_000
    let prize_pool: u64 = total_pool - protocol_fee - creator_fee; // 28_200_000
    let agent1_prize: u64 = prize_pool * 60 / 100; // 16_920_000
    let agent2_prize: u64 = prize_pool * 40 / 100; // 11_280_000

    let agent1_balance_before = get_token_balance(&svm, &agent1_usdc);
    let agent2_balance_before = get_token_balance(&svm, &agent2_usdc);

    // 8. Agent1 claims prize
    let claim1_ix = build_claim_prize_ix(
        &agent1.pubkey(),
        arena_id,
        &agent1_profile,
        &usdc_mint,
        &agent1_usdc,
    );
    send_tx(&mut svm, &[claim1_ix], &agent1, &[&agent1]).unwrap();

    assert_eq!(
        get_token_balance(&svm, &agent1_usdc),
        agent1_balance_before + agent1_prize
    );

    // 9. Agent2 claims prize
    let claim2_ix = build_claim_prize_ix(
        &agent2.pubkey(),
        arena_id,
        &agent2_profile,
        &usdc_mint,
        &agent2_usdc,
    );
    send_tx(&mut svm, &[claim2_ix], &agent2, &[&agent2]).unwrap();

    assert_eq!(
        get_token_balance(&svm, &agent2_usdc),
        agent2_balance_before + agent2_prize
    );

    // 10. Creator claims fee
    let creator_balance_before = get_token_balance(&svm, &creator_usdc);
    let claim_fee_ix = build_claim_creator_fee_ix(
        &creator.pubkey(),
        arena_id,
        &usdc_mint,
        &creator_usdc,
    );
    send_tx(&mut svm, &[claim_fee_ix], &creator, &[&creator]).unwrap();

    assert_eq!(
        get_token_balance(&svm, &creator_usdc),
        creator_balance_before + creator_fee
    );

    // 11. Creator gets bond back
    let creator_balance_before = get_token_balance(&svm, &creator_usdc);
    let return_bond_ix = build_return_stake_bond_ix(
        &creator.pubkey(),
        arena_id,
        &usdc_mint,
        &creator_usdc,
    );
    send_tx(&mut svm, &[return_bond_ix], &creator, &[&creator]).unwrap();

    assert_eq!(
        get_token_balance(&svm, &creator_usdc),
        creator_balance_before + 50_000_000
    );
    assert_eq!(get_token_balance(&svm, &bond_vault_key), 0);

    // 12. Collect protocol fee
    let (treasury_pda_key, _) = treasury_pda();
    let treasury_usdc_key = create_token_account(&mut svm, &creator, &usdc_mint, &treasury_pda_key);
    let treasury_balance_before = get_token_balance(&svm, &treasury_usdc_key);

    let collect_ix = build_collect_protocol_fee_ix(
        &creator.pubkey(),
        arena_id,
        &usdc_mint,
        &treasury_usdc_key,
    );
    send_tx(&mut svm, &[collect_ix], &creator, &[&creator]).unwrap();

    assert_eq!(
        get_token_balance(&svm, &treasury_usdc_key),
        treasury_balance_before + protocol_fee
    );

    // 13. Verify all balances
    // Arena vault should have 0 left (all distributed)
    assert_eq!(get_token_balance(&svm, &arena_vault_key), 0);
    // Bond vault should be 0
    assert_eq!(get_token_balance(&svm, &bond_vault_key), 0);

    // Verify flags on arena
    let arena_account = svm.get_account(&arena_key).unwrap();
    let arena: ritarena::Arena =
        anchor_lang::AccountDeserialize::try_deserialize(&mut &arena_account.data[..]).unwrap();
    assert!(arena.creator_fee_claimed);
    assert!(arena.bond_returned);
    assert!(arena.protocol_fee_collected);

    // Verify entries are marked claimed
    let entry1_account = svm.get_account(&entry1_key).unwrap();
    let entry1: ritarena::ArenaEntry =
        anchor_lang::AccountDeserialize::try_deserialize(&mut &entry1_account.data[..]).unwrap();
    assert!(entry1.prize_claimed);

    let entry2_account = svm.get_account(&entry2_key).unwrap();
    let entry2: ritarena::ArenaEntry =
        anchor_lang::AccountDeserialize::try_deserialize(&mut &entry2_account.data[..]).unwrap();
    assert!(entry2.prize_claimed);

    println!("=== Full Lifecycle Test PASSED ===");
    println!("Total pool: {} USDC", total_pool as f64 / 1_000_000.0);
    println!("Protocol fee: {} USDC", protocol_fee as f64 / 1_000_000.0);
    println!("Creator fee: {} USDC", creator_fee as f64 / 1_000_000.0);
    println!("Prize pool: {} USDC", prize_pool as f64 / 1_000_000.0);
    println!("Agent1 prize (60%): {} USDC", agent1_prize as f64 / 1_000_000.0);
    println!("Agent2 prize (40%): {} USDC", agent2_prize as f64 / 1_000_000.0);
}
