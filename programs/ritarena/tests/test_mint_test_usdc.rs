mod helpers;

use helpers::*;
use solana_instruction::{AccountMeta, Instruction};
use solana_keypair::Keypair;
use solana_program_pack::Pack;
use solana_pubkey::Pubkey;
use solana_signer::Signer;
use spl_token::state::Account as TokenAccount;

/// Build a `mint_test_usdc` instruction. Anyone can sign as `caller`.
fn build_mint_test_usdc_ix(
    caller: &Pubkey,
    usdc_mint: &Pubkey,
    recipient_usdc: &Pubkey,
    amount: u64,
) -> Instruction {
    let (protocol_pda, _) = protocol_pda();
    let (mint_authority, _) = test_usdc_mint_authority_pda();

    let disc = anchor_discriminator("mint_test_usdc");
    let mut data = Vec::with_capacity(8 + 8);
    data.extend_from_slice(&disc);
    data.extend_from_slice(&amount.to_le_bytes());

    Instruction {
        program_id: PROGRAM_ID,
        accounts: vec![
            AccountMeta::new(*caller, true),
            AccountMeta::new_readonly(protocol_pda, false),
            AccountMeta::new(*usdc_mint, false),
            AccountMeta::new(*recipient_usdc, false),
            AccountMeta::new_readonly(mint_authority, false),
            AccountMeta::new_readonly(spl_token::id(), false),
        ],
        data,
    }
}

/// Set the mint's authority to the program PDA (simulates the one-shot migration).
fn transfer_mint_authority_to_pda(
    svm: &mut litesvm::LiteSVM,
    current_authority: &Keypair,
    mint: &Pubkey,
) {
    let (pda, _) = test_usdc_mint_authority_pda();
    let ix = spl_token::instruction::set_authority(
        &spl_token::id(),
        mint,
        Some(&pda),
        spl_token::instruction::AuthorityType::MintTokens,
        &current_authority.pubkey(),
        &[],
    )
    .unwrap();
    send_tx(svm, &[ix], current_authority, &[current_authority]).unwrap();
}

#[test]
fn test_mint_test_usdc_success() {
    let mut svm = setup();
    let authority = Keypair::new();
    svm.airdrop(&authority.pubkey(), 10_000_000_000).unwrap();

    let usdc_mint = create_usdc_mint(&mut svm, &authority);
    initialize_protocol(&mut svm, &authority, &usdc_mint);
    transfer_mint_authority_to_pda(&mut svm, &authority, &usdc_mint);

    // A totally unrelated wallet calls the faucet
    let stranger = Keypair::new();
    svm.airdrop(&stranger.pubkey(), 1_000_000_000).unwrap();

    let recipient_usdc = create_token_account(&mut svm, &stranger, &usdc_mint, &stranger.pubkey());

    let amount = 500_000_000u64; // 500 USDC
    let ix = build_mint_test_usdc_ix(&stranger.pubkey(), &usdc_mint, &recipient_usdc, amount);
    send_tx(&mut svm, &[ix], &stranger, &[&stranger]).unwrap();

    let account = svm.get_account(&recipient_usdc).expect("recipient ata");
    let parsed = TokenAccount::unpack(&account.data).unwrap();
    assert_eq!(parsed.amount, amount, "recipient should have minted balance");
}
