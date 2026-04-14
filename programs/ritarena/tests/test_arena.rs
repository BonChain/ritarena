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
            creator_fee_bps: 500, // 5%
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

    // entry_fee: u64
    data.extend_from_slice(&args.entry_fee.to_le_bytes());
    // max_agents: u16
    data.extend_from_slice(&args.max_agents.to_le_bytes());
    // min_agents: u16
    data.extend_from_slice(&args.min_agents.to_le_bytes());
    // duration: i64
    data.extend_from_slice(&args.duration.to_le_bytes());
    // elimination_interval: i64
    data.extend_from_slice(&args.elimination_interval.to_le_bytes());
    // elimination_percent: u8
    data.push(args.elimination_percent);
    // creator_fee_bps: u16
    data.extend_from_slice(&args.creator_fee_bps.to_le_bytes());
    // prize_split: Vec<u16> - borsh: 4-byte len + each u16
    data.extend_from_slice(&(args.prize_split.len() as u32).to_le_bytes());
    for &v in &args.prize_split {
        data.extend_from_slice(&v.to_le_bytes());
    }
    // action_schema: String - borsh: 4-byte len + utf8 bytes
    let schema_bytes = args.action_schema.as_bytes();
    data.extend_from_slice(&(schema_bytes.len() as u32).to_le_bytes());
    data.extend_from_slice(schema_bytes);
    // rules_hash: [u8; 32]
    data.extend_from_slice(&args.rules_hash);
    // min_arenas_completed: u64
    data.extend_from_slice(&args.min_arenas_completed.to_le_bytes());
    // min_wins: u64
    data.extend_from_slice(&args.min_wins.to_le_bytes());
    // min_registration_age: i64
    data.extend_from_slice(&args.min_registration_age.to_le_bytes());
    // stake_bond_amount: u64
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

fn setup_with_funded_creator() -> (litesvm::LiteSVM, Keypair, Pubkey, Pubkey) {
    let mut svm = setup();
    let authority = Keypair::new();
    svm.airdrop(&authority.pubkey(), 10_000_000_000).unwrap();

    let usdc_mint = create_usdc_mint(&mut svm, &authority);
    initialize_protocol(&mut svm, &authority, &usdc_mint);

    let creator_usdc = create_token_account(&mut svm, &authority, &usdc_mint, &authority.pubkey());
    mint_to(&mut svm, &authority, &usdc_mint, &creator_usdc, 100_000_000);

    (svm, authority, usdc_mint, creator_usdc)
}

#[test]
fn test_create_arena_success() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_with_funded_creator();

    let args = CreateArenaArgs {
        stake_bond_amount: 5_000_000, // 5 USDC bond
        ..Default::default()
    };

    let ix = build_create_arena_ix(
        &creator.pubkey(),
        &usdc_mint,
        &creator_usdc,
        0, // first arena
        &args,
    );
    send_tx(&mut svm, &[ix], &creator, &[&creator]).unwrap();

    // Verify arena PDA
    let (arena_key, _) = arena_pda(0);
    let arena_account = svm.get_account(&arena_key).expect("arena should exist");
    let arena: ritarena::Arena =
        anchor_lang::AccountDeserialize::try_deserialize(&mut &arena_account.data[..]).unwrap();

    assert_eq!(arena.id, 0);
    assert_eq!(arena.creator, creator.pubkey());
    assert_eq!(arena.oracle, creator.pubkey()); // oracle defaults to creator
    assert_eq!(arena.usdc_mint, usdc_mint);
    assert_eq!(arena.entry_fee, 10_000_000);
    assert_eq!(arena.max_agents, 10);
    assert_eq!(arena.min_agents, 2);
    assert_eq!(arena.duration, 3600);
    assert_eq!(arena.elimination_interval, 600);
    assert_eq!(arena.elimination_percent, 25);
    assert_eq!(arena.creator_fee_bps, 500);
    assert_eq!(arena.prize_split, vec![50, 30, 20]);
    assert_eq!(arena.action_schema, "{}");
    assert_eq!(arena.rules_hash, [0u8; 32]);
    assert_eq!(arena.state, ritarena::ArenaState::Registration);
    assert_eq!(arena.current_agents, 0);
    assert_eq!(arena.alive_agents, 0);
    assert_eq!(arena.current_round, 0);
    assert_eq!(arena.started_at, 0);
    assert_eq!(arena.stake_bond_amount, 5_000_000);
    assert!(!arena.creator_fee_claimed);
    assert!(!arena.bond_returned);

    // Verify bond was transferred
    let (bond_vault_key, _) = bond_vault_pda(&arena_key);
    let bond_account = svm.get_account(&bond_vault_key).expect("bond vault should exist");
    let bond_token = spl_token::state::Account::unpack(&bond_account.data).unwrap();
    assert_eq!(bond_token.amount, 5_000_000);

    // Verify creator balance decreased
    let creator_account = svm.get_account(&creator_usdc).expect("creator USDC should exist");
    let creator_token = spl_token::state::Account::unpack(&creator_account.data).unwrap();
    assert_eq!(creator_token.amount, 95_000_000);

    // Verify protocol.total_arenas incremented
    let (protocol_key, _) = protocol_pda();
    let protocol_account = svm.get_account(&protocol_key).expect("protocol should exist");
    let protocol: ritarena::ProtocolConfig =
        anchor_lang::AccountDeserialize::try_deserialize(&mut &protocol_account.data[..]).unwrap();
    assert_eq!(protocol.total_arenas, 1);
}

#[test]
fn test_create_arena_invalid_prize_split_fails() {
    let (mut svm, creator, usdc_mint, creator_usdc) = setup_with_funded_creator();

    let args = CreateArenaArgs {
        prize_split: vec![50, 20, 10], // sums to 80, not 100
        ..Default::default()
    };

    let ix = build_create_arena_ix(
        &creator.pubkey(),
        &usdc_mint,
        &creator_usdc,
        0,
        &args,
    );
    let result = send_tx(&mut svm, &[ix], &creator, &[&creator]);
    assert!(result.is_err(), "prize split summing to 80 should fail");
}
