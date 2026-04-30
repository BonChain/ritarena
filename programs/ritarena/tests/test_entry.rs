mod helpers;

use anchor_lang::AccountDeserialize;
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

impl Default for CreateArenaArgs {
    fn default() -> Self {
        Self {
            entry_fee: 10_000_000, // 10 USDC
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

#[test]
fn test_enter_arena_success() {
    // Setup: init protocol, create usdc mint, register a profile, create an arena
    let mut svm = setup();
    let authority = Keypair::new();
    svm.airdrop(&authority.pubkey(), 10_000_000_000).unwrap();

    let usdc_mint = create_usdc_mint(&mut svm, &authority);
    initialize_protocol(&mut svm, &authority, &usdc_mint);

    // Create USDC account and fund it
    let authority_usdc =
        create_token_account(&mut svm, &authority, &usdc_mint, &authority.pubkey());
    mint_to(
        &mut svm,
        &authority,
        &usdc_mint,
        &authority_usdc,
        200_000_000,
    );

    // Register profile
    let register_ix = build_register_profile_ix(&authority.pubkey(), "TestAgent");
    send_tx(&mut svm, &[register_ix], &authority, &[&authority]).unwrap();

    // Create arena (no bond for simplicity)
    let arena_args = CreateArenaArgs::default();
    let create_ix = build_create_arena_ix(
        &authority.pubkey(),
        &usdc_mint,
        &authority_usdc,
        0,
        &arena_args,
    );
    send_tx(&mut svm, &[create_ix], &authority, &[&authority]).unwrap();

    // Check balance before entering
    let pre_balance = {
        let acct = svm.get_account(&authority_usdc).unwrap();
        spl_token::state::Account::unpack(&acct.data).unwrap().amount
    };

    // Enter the arena
    let enter_ix =
        build_enter_arena_ix(&authority.pubkey(), &usdc_mint, &authority_usdc, 0);
    send_tx(&mut svm, &[enter_ix], &authority, &[&authority]).unwrap();

    // Verify: ArenaEntry exists
    let (arena_key, _) = arena_pda(0);
    let (agent_profile_key, _) = agent_profile_pda(&authority.pubkey());
    let (arena_entry_key, _) = arena_entry_pda(&arena_key, &agent_profile_key);

    let entry_account = svm
        .get_account(&arena_entry_key)
        .expect("arena entry should exist");
    let entry: ritarena::ArenaEntry =
        anchor_lang::AccountDeserialize::try_deserialize(&mut &entry_account.data[..]).unwrap();
    assert_eq!(entry.arena, arena_key);
    assert_eq!(entry.agent_profile, agent_profile_key);
    assert_eq!(entry.owner, authority.pubkey());
    assert_eq!(entry.score, 0);
    assert!(entry.alive);
    assert_eq!(entry.prize_rank, 0);
    assert!(!entry.prize_claimed);
    assert!(!entry.refunded);

    // Verify: arena.current_agents == 1, arena.alive_agents == 1
    let arena_account = svm.get_account(&arena_key).expect("arena should exist");
    let arena: ritarena::Arena =
        anchor_lang::AccountDeserialize::try_deserialize(&mut &arena_account.data[..]).unwrap();
    assert_eq!(arena.current_agents, 1);
    assert_eq!(arena.alive_agents, 1);
    assert_eq!(arena.total_entry_fees, 10_000_000);

    // Verify: vault balance == entry_fee
    let (vault_key, _) = arena_vault_pda(&arena_key);
    let vault_account = svm.get_account(&vault_key).expect("vault should exist");
    let vault_token = spl_token::state::Account::unpack(&vault_account.data).unwrap();
    assert_eq!(vault_token.amount, 10_000_000);

    // Verify: profile.arenas_entered incremented
    let profile_account = svm
        .get_account(&agent_profile_key)
        .expect("profile should exist");
    let profile: ritarena::AgentProfile =
        anchor_lang::AccountDeserialize::try_deserialize(&mut &profile_account.data[..]).unwrap();
    assert_eq!(profile.arenas_entered, 1);

    // Verify: agent balance decreased by entry_fee
    let post_balance = {
        let acct = svm.get_account(&authority_usdc).unwrap();
        spl_token::state::Account::unpack(&acct.data).unwrap().amount
    };
    assert_eq!(pre_balance - post_balance, 10_000_000);
}
