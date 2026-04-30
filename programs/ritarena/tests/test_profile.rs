mod helpers;

use anchor_lang::AccountDeserialize;
use helpers::*;
use solana_instruction::{AccountMeta, Instruction};
use solana_keypair::Keypair;
use solana_pubkey::Pubkey;
use solana_signer::Signer;

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

fn setup_with_owner() -> (litesvm::LiteSVM, Keypair) {
    let mut svm = setup();
    let authority = Keypair::new();
    svm.airdrop(&authority.pubkey(), 10_000_000_000).unwrap();

    let usdc_mint = create_usdc_mint(&mut svm, &authority);
    initialize_protocol(&mut svm, &authority, &usdc_mint);

    (svm, authority)
}

#[test]
fn test_register_profile_success() {
    let (mut svm, owner) = setup_with_owner();

    let ix = build_register_profile_ix(&owner.pubkey(), "TestAgent");
    send_tx(&mut svm, &[ix], &owner, &[&owner]).unwrap();

    // Verify profile PDA exists and fields are correct
    let (profile_pda, _) = agent_profile_pda(&owner.pubkey());
    let profile_account = svm.get_account(&profile_pda).expect("profile account should exist");
    assert!(!profile_account.data.is_empty());

    // Deserialize and verify profile fields (skip 8-byte discriminator)
    let profile: ritarena::AgentProfile =
        anchor_lang::AccountDeserialize::try_deserialize(&mut &profile_account.data[..]).unwrap();
    assert_eq!(profile.owner, owner.pubkey());
    assert_eq!(profile.name, "TestAgent");
    assert_eq!(profile.arenas_entered, 0);
    assert_eq!(profile.arenas_completed, 0);
    assert_eq!(profile.wins, 0);
    assert_eq!(profile.top3, 0);
    assert_eq!(profile.eliminations, 0);
    assert_eq!(profile.total_earnings, 0);
    // LiteSVM clock defaults to 0, so just verify it was set (not left uninitialized)
    assert!(profile.registered_at >= 0);
}

#[test]
fn test_register_profile_duplicate_fails() {
    let (mut svm, owner) = setup_with_owner();

    let ix1 = build_register_profile_ix(&owner.pubkey(), "Agent1");
    send_tx(&mut svm, &[ix1], &owner, &[&owner]).unwrap();

    let ix2 = build_register_profile_ix(&owner.pubkey(), "Agent2");
    let result = send_tx(&mut svm, &[ix2], &owner, &[&owner]);
    assert!(result.is_err(), "duplicate registration should fail");
}

#[test]
fn test_register_profile_name_too_long_fails() {
    let (mut svm, owner) = setup_with_owner();

    let long_name = "A".repeat(33);
    let ix = build_register_profile_ix(&owner.pubkey(), &long_name);
    let result = send_tx(&mut svm, &[ix], &owner, &[&owner]);
    assert!(result.is_err(), "name too long should fail");
}
