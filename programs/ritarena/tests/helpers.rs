use litesvm::LiteSVM;
use solana_instruction::{AccountMeta, Instruction};
use solana_keypair::Keypair;
use solana_message::Message;
use solana_program_pack::Pack;
use solana_pubkey::Pubkey;
use solana_signature::Signature;
use solana_signer::Signer;
use solana_transaction::Transaction;

pub const PROGRAM_ID: Pubkey =
    solana_pubkey::pubkey!("5fYaY6696pCJfPQvxC3GwHEDS91hXs1JZNpEK4ZmhCfH");

const PROGRAM_BYTES: &[u8] = include_bytes!("../../../target/deploy/ritarena.so");

/// Anchor instruction discriminator: sha256("global:<name>")[..8]
pub fn anchor_discriminator(name: &str) -> [u8; 8] {
    let input = format!("global:{name}");
    let hash = solana_sha256_hasher::hash(input.as_bytes());
    let mut disc = [0u8; 8];
    disc.copy_from_slice(&hash.to_bytes()[..8]);
    disc
}

pub fn setup() -> LiteSVM {
    let mut svm = LiteSVM::new();
    svm.add_program(PROGRAM_ID, PROGRAM_BYTES);
    svm
}

/// Sign a transaction manually without the wincode feature.
fn sign_transaction(tx: &mut Transaction, signers: &[&Keypair]) {
    let msg_data = tx.message.serialize();
    let num_required = tx.message.header.num_required_signatures as usize;
    tx.signatures = vec![Signature::default(); num_required];

    for signer in signers {
        let pos = tx
            .message
            .account_keys
            .iter()
            .position(|k| *k == signer.pubkey())
            .expect("signer not in account_keys");
        tx.signatures[pos] = signer.sign_message(&msg_data);
    }
}

pub fn send_tx(
    svm: &mut LiteSVM,
    ixs: &[Instruction],
    payer: &Keypair,
    signers: &[&Keypair],
) -> Result<(), litesvm::types::FailedTransactionMetadata> {
    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(ixs, Some(&payer.pubkey()), &blockhash);
    let mut tx = Transaction::new_unsigned(msg);
    sign_transaction(&mut tx, signers);
    svm.send_transaction(tx).map(|_| ())
}

pub fn create_usdc_mint(svm: &mut LiteSVM, authority: &Keypair) -> Pubkey {
    let mint = Keypair::new();
    let rent = svm.minimum_balance_for_rent_exemption(spl_token::state::Mint::LEN);

    let create_ix = Instruction {
        program_id: solana_pubkey::pubkey!("11111111111111111111111111111111"),
        accounts: vec![
            AccountMeta::new(authority.pubkey(), true),
            AccountMeta::new(mint.pubkey(), true),
        ],
        data: {
            // SystemProgram::CreateAccount
            let mut data = vec![0u8; 4 + 8 + 8 + 32];
            data[0..4].copy_from_slice(&0u32.to_le_bytes());
            data[4..12].copy_from_slice(&rent.to_le_bytes());
            data[12..20].copy_from_slice(&(spl_token::state::Mint::LEN as u64).to_le_bytes());
            data[20..52].copy_from_slice(&spl_token::id().to_bytes());
            data
        },
    };

    let init_mint_ix = spl_token::instruction::initialize_mint2(
        &spl_token::id(),
        &mint.pubkey(),
        &authority.pubkey(),
        None,
        6,
    )
    .unwrap();

    send_tx(svm, &[create_ix, init_mint_ix], authority, &[authority, &mint]).unwrap();
    mint.pubkey()
}

pub fn create_token_account(
    svm: &mut LiteSVM,
    payer: &Keypair,
    mint: &Pubkey,
    owner: &Pubkey,
) -> Pubkey {
    let ata = spl_associated_token_account::get_associated_token_address(owner, mint);
    let ix = spl_associated_token_account::instruction::create_associated_token_account(
        &payer.pubkey(),
        owner,
        mint,
        &spl_token::id(),
    );
    send_tx(svm, &[ix], payer, &[payer]).unwrap();
    ata
}

pub fn mint_to(
    svm: &mut LiteSVM,
    mint_authority: &Keypair,
    mint: &Pubkey,
    dest: &Pubkey,
    amount: u64,
) {
    let ix = spl_token::instruction::mint_to(
        &spl_token::id(),
        mint,
        dest,
        &mint_authority.pubkey(),
        &[],
        amount,
    )
    .unwrap();
    send_tx(svm, &[ix], mint_authority, &[mint_authority]).unwrap();
}

pub fn protocol_pda() -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"protocol"], &PROGRAM_ID)
}

pub fn treasury_pda() -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"treasury"], &PROGRAM_ID)
}

pub fn agent_profile_pda(owner: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"agent_profile", owner.as_ref()], &PROGRAM_ID)
}

pub fn initialize_protocol(svm: &mut LiteSVM, authority: &Keypair, usdc_mint: &Pubkey) {
    let (protocol_pda, _) = protocol_pda();
    let (treasury_pda, _) = treasury_pda();

    let disc = anchor_discriminator("initialize_protocol");

    let ix = Instruction {
        program_id: PROGRAM_ID,
        accounts: vec![
            AccountMeta::new(authority.pubkey(), true),
            AccountMeta::new_readonly(*usdc_mint, false),
            AccountMeta::new(protocol_pda, false),
            AccountMeta::new_readonly(treasury_pda, false),
            AccountMeta::new_readonly(
                solana_pubkey::pubkey!("11111111111111111111111111111111"),
                false,
            ),
        ],
        data: disc.to_vec(),
    };

    send_tx(svm, &[ix], authority, &[authority]).unwrap();
}
