# Plan A: YogenFlow Anchor Program (v2 -- Polymarket Model)

> **Status:** Ready for execution
> **Created:** 2026-04-02 (v2 rewrite after code review)
> **Developer:** Tenny
> **Timeline:** Apr 2-14 (Weeks 1-2), ~10 working days
> **Depends on:** Nothing (first plan to execute)
> **Blocks:** Plan B (SDK + Agents), Plan C (Dashboard)

---

## Goal

Build the YogenFlow Anchor program -- a single Solana on-chain program containing binary prediction markets using a **Polymarket-style conditional token model** (mint YES+NO for USDC 1:1, x*y=k AMM on the YES/NO token pair, Pyth oracle resolution) and an agent reputation layer (registration, stats tracking). Deploy to devnet.

## Key Design: Polymarket-Style Conditional Token Model

The old x*y=k AMM operated on virtual USDC pools and had an insolvency bug. The new model:

1. **Minting:** 1 USDC deposits into vault -> user gets 1 YES token + 1 NO token. Vault always fully collateralized.
2. **Redeeming:** Burn 1 YES + 1 NO -> get 1 USDC back from vault. This is how LPs exit.
3. **AMM operates on YES<->NO pair:** The x*y=k constant product formula operates on REAL SPL token balances (pool_yes_vault holds YES tokens, pool_no_vault holds NO tokens). No virtual numbers.
4. **Price discovery:** YES price = pool_no / (pool_yes + pool_no). More NO in pool means YES is more expensive.
5. **Vault solvency:** total_yes_supply = total_no_supply = total_minted = vault USDC balance. Always solvent.
6. **Settlement:** After resolution, winning tokens redeem 1:1 from USDC vault. Losing tokens are worthless.

## Architecture

```
Single Anchor Program: yogenflow
+-- instructions/
|   +-- initialize_protocol.rs
|   +-- create_market.rs
|   +-- mint_outcome_tokens.rs
|   +-- redeem_outcome_tokens.rs
|   +-- seed_amm.rs
|   +-- swap_yes_to_no.rs
|   +-- swap_no_to_yes.rs
|   +-- resolve_market.rs
|   +-- claim_payout.rs
|   +-- register_agent.rs
+-- state/
|   +-- protocol_config.rs
|   +-- market.rs
|   +-- agent.rs
|   +-- position.rs
+-- errors.rs
+-- lib.rs
```

## Tech Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| Rust | stable (latest) | Language |
| Solana CLI | 2.2.x | Toolchain + local validator |
| Anchor | 0.32.1 | Framework |
| anchor-lang | 0.32.1 | Program macros |
| anchor-spl | 0.32.1 | SPL token CPI |
| pyth-solana-receiver-sdk | latest | Oracle price reads |
| Node.js | v24.7.0 | Test runner |
| TypeScript | ^5.0 | Tests |

> **For agentic workers:** This plan follows the superpowers:subagent-driven-development pattern. Each task is self-contained with explicit file lists, complete code blocks, verification commands, and commit steps. An AI coding agent can execute each task sequentially without ambiguity.

---

## Task 0: Environment Setup

**Files:** None (system-level installation)

### Step 0.1 -- Install Rust toolchain

- [ ] Open a terminal and run:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
```

Expected output (last lines):
```
Rust is installed now. Great!
```

Restart your terminal, then verify:

```bash
rustc --version
```

Expected output:
```
rustc 1.8x.x (xxxxxxx 2026-xx-xx)
```

### Step 0.2 -- Install Solana CLI

- [ ] Run:

```bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
```

Then add to PATH (the installer prints the exact line). Restart terminal. Verify:

```bash
solana --version
```

Expected output:
```
solana-cli 2.2.x (src:xxxxxxxx; feat:xxxxxxxxxx, client:Agave)
```

### Step 0.3 -- Configure Solana for localhost

- [ ] Run:

```bash
solana-keygen new --no-bip39-passphrase --outfile ~/.config/solana/id.json --force
solana config set --url localhost
```

Expected output:
```
Config File: ...
RPC URL: http://localhost:8899
```

### Step 0.4 -- Install Anchor CLI 0.32.1

- [ ] Run:

```bash
cargo install --git https://github.com/coral-xyz/anchor --tag v0.32.1 anchor-cli
```

This takes several minutes. Verify:

```bash
anchor --version
```

Expected output:
```
anchor-cli 0.32.1
```

### Step 0.5 -- Scaffold the Anchor project

- [ ] Run from the project root:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier
anchor init yogenflow
```

Expected output:
```
yogenflow initialized
```

### Step 0.6 -- Configure Cargo.toml dependencies

- [ ] Replace the contents of `yogenflow/programs/yogenflow/Cargo.toml`:

```toml
[package]
name = "yogenflow"
version = "0.1.0"
description = "YogenFlow - Proof of Prediction on Solana"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "yogenflow"

[features]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
cpi = ["no-entrypoint"]
default = ["init-if-needed"]
init-if-needed = ["anchor-lang/init-if-needed"]
idl-build = ["anchor-lang/idl-build", "anchor-spl/idl-build"]

[dependencies]
anchor-lang = "0.32.1"
anchor-spl = "0.32.1"
pyth-solana-receiver-sdk = "0.5.0"
```

### Step 0.7 -- Create the modular file structure

- [ ] Run from the project root:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/yogenflow/programs/yogenflow/src
mkdir -p instructions state
touch instructions/mod.rs state/mod.rs errors.rs
touch state/protocol_config.rs state/market.rs state/agent.rs state/position.rs
touch instructions/initialize_protocol.rs instructions/create_market.rs
touch instructions/mint_outcome_tokens.rs instructions/redeem_outcome_tokens.rs
touch instructions/seed_amm.rs
touch instructions/swap_yes_to_no.rs instructions/swap_no_to_yes.rs
touch instructions/resolve_market.rs instructions/claim_payout.rs
touch instructions/register_agent.rs
```

### Step 0.8 -- Write the initial lib.rs shell

- [ ] Replace the contents of `yogenflow/programs/yogenflow/src/lib.rs`:

```rust
use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod yogenflow {
    use super::*;

    pub fn initialize_protocol(
        ctx: Context<InitializeProtocol>,
        fee_bps: u16,
        min_liquidity: u64,
        min_trade_size: u64,
        registration_stake: u64,
    ) -> Result<()> {
        instructions::initialize_protocol::handler(
            ctx,
            fee_bps,
            min_liquidity,
            min_trade_size,
            registration_stake,
        )
    }
}
```

### Step 0.9 -- Write initial module files

- [ ] Write `yogenflow/programs/yogenflow/src/errors.rs`:

```rust
use anchor_lang::prelude::*;

#[error_code]
pub enum YogenFlowError {
    #[msg("Fee basis points must be between 0 and 10000")]
    InvalidFeeBps,
    #[msg("Market is not open for trading")]
    MarketNotOpen,
    #[msg("Market is already resolved")]
    MarketAlreadyResolved,
    #[msg("Trade amount is below minimum trade size")]
    TradeTooSmall,
    #[msg("Trade would push price outside allowed range (0.01-0.99)")]
    PriceOutOfRange,
    #[msg("Insufficient liquidity to seed market")]
    InsufficientLiquidity,
    #[msg("Market has not reached resolution deadline")]
    ResolutionTooEarly,
    #[msg("Resolution deadline must be in the future")]
    DeadlineInPast,
    #[msg("Oracle price is too stale")]
    OraclePriceStale,
    #[msg("Oracle confidence interval too wide")]
    OracleConfidenceTooWide,
    #[msg("Market outcome not yet determined")]
    MarketNotResolved,
    #[msg("No winning tokens to claim")]
    NoWinningTokens,
    #[msg("Arithmetic overflow")]
    MathOverflow,
    #[msg("Question string too long (max 200 chars)")]
    QuestionTooLong,
    #[msg("Agent name too long (max 32 chars)")]
    NameTooLong,
    #[msg("Invalid oracle feed")]
    InvalidOracleFeed,
    #[msg("AMM pool is not yet seeded")]
    AmmNotSeeded,
    #[msg("AMM pool is already seeded")]
    AmmAlreadySeeded,
    #[msg("Insufficient token balance")]
    InsufficientBalance,
    #[msg("Swap output amount is zero")]
    ZeroOutput,
}
```

- [ ] Write `yogenflow/programs/yogenflow/src/state/mod.rs`:

```rust
pub mod protocol_config;
pub mod market;
pub mod agent;
pub mod position;

pub use protocol_config::*;
pub use market::*;
pub use agent::*;
pub use position::*;
```

- [ ] Write `yogenflow/programs/yogenflow/src/instructions/mod.rs`:

```rust
pub mod initialize_protocol;

pub use initialize_protocol::*;
```

- [ ] Write empty placeholder for the instruction (so it compiles):

Write `yogenflow/programs/yogenflow/src/instructions/initialize_protocol.rs`:

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::ProtocolConfig;

pub fn handler(
    _ctx: Context<InitializeProtocol>,
    _fee_bps: u16,
    _min_liquidity: u64,
    _min_trade_size: u64,
    _registration_stake: u64,
) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + ProtocolConfig::INIT_SPACE,
        seeds = [b"protocol"],
        bump,
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,
    /// Treasury USDC token account -- validated as a real token account
    #[account(
        token::mint = usdc_mint,
    )]
    pub treasury: Account<'info, TokenAccount>,
    pub usdc_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
}
```

- [ ] Write empty state files so it compiles:

Write `yogenflow/programs/yogenflow/src/state/protocol_config.rs`:

```rust
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct ProtocolConfig {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub usdc_mint: Pubkey,
    pub fee_bps: u16,
    pub min_liquidity: u64,
    pub min_trade_size: u64,
    pub registration_stake: u64,
    pub market_count: u64,
    pub bump: u8,
}
```

Write `yogenflow/programs/yogenflow/src/state/market.rs`:

```rust
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Market {
    pub authority: Pubkey,
    pub market_id: u64,
    #[max_len(200)]
    pub question: String,
    pub resolution_source: ResolutionSource,
    pub oracle_feed_id: [u8; 32],
    pub oracle_feed_account: Pubkey,
    pub resolution_value: u64,
    pub yes_mint: Pubkey,
    pub no_mint: Pubkey,
    pub usdc_vault: Pubkey,
    pub pool_yes_vault: Pubkey,
    pub pool_no_vault: Pubkey,
    pub total_minted: u64,
    pub amm_seeded: bool,
    pub status: MarketStatus,
    pub outcome: Option<bool>,
    pub created_at: i64,
    pub resolution_deadline: i64,
    pub fee_bps: u16,
    pub total_volume: u64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum ResolutionSource {
    PythPrice,
    Authority,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum MarketStatus {
    Open,
    Resolved,
}
```

Write `yogenflow/programs/yogenflow/src/state/agent.rs`:

```rust
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Agent {
    pub wallet: Pubkey,
    #[max_len(32)]
    pub name: String,
    pub registration_stake: u64,
    pub total_markets_traded: u64,
    pub total_markets_created: u64,
    pub wins: u64,
    pub losses: u64,
    pub total_profit: i64,
    pub total_volume: u64,
    pub accuracy_bps: u16,
    pub created_at: i64,
    pub last_active: i64,
    pub bump: u8,
}
```

Write `yogenflow/programs/yogenflow/src/state/position.rs`:

```rust
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Position {
    pub market: Pubkey,
    pub trader: Pubkey,
    pub yes_amount: u64,
    pub no_amount: u64,
    pub yes_cost_basis: u64,
    pub no_cost_basis: u64,
    pub bump: u8,
}
```

### Step 0.10 -- Verify the project builds

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/yogenflow
anchor build
```

Expected: build succeeds. If it prints a program ID, update the `declare_id!` in `lib.rs` and `Anchor.toml` with that ID.

```bash
# Get the generated program ID
solana address -k target/deploy/yogenflow-keypair.json
```

Update `declare_id!("YOUR_PROGRAM_ID_HERE")` in `lib.rs` and `[programs.localnet]` in `Anchor.toml`.

### Step 0.11 -- Verify tests run

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/yogenflow
anchor test
```

Expected: the default test passes (scaffold test).

### Step 0.12 -- Git commit

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier
git add yogenflow/
git commit -m "scaffold: anchor init yogenflow with Polymarket-style modular structure"
```

---

## Task 1: ProtocolConfig Account + initialize_protocol Instruction

**Files:**
- Modify: `yogenflow/programs/yogenflow/src/state/protocol_config.rs`
- Modify: `yogenflow/programs/yogenflow/src/instructions/initialize_protocol.rs`
- Modify: `yogenflow/programs/yogenflow/src/lib.rs`
- Test: `yogenflow/tests/yogenflow.ts`

### Step 1.1 -- Write the test first (TDD: expect fail)

- [ ] Replace the contents of `yogenflow/tests/yogenflow.ts`:

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Yogenflow } from "../target/types/yogenflow";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { assert } from "chai";

describe("yogenflow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.yogenflow as Program<Yogenflow>;
  const authority = provider.wallet as anchor.Wallet;

  // USDC mint (we create a fake one for testing)
  let usdcMint: PublicKey;
  let treasuryTokenAccount: PublicKey;

  // PDAs
  let protocolConfigPda: PublicKey;
  let protocolConfigBump: number;

  before(async () => {
    // Derive PDAs
    [protocolConfigPda, protocolConfigBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("protocol")],
      program.programId
    );

    // Create a fake USDC mint (6 decimals)
    usdcMint = await createMint(
      provider.connection,
      (authority as any).payer,
      authority.publicKey,
      null,
      6
    );

    // Create treasury token account
    treasuryTokenAccount = await createAccount(
      provider.connection,
      (authority as any).payer,
      usdcMint,
      authority.publicKey
    );
  });

  describe("initialize_protocol", () => {
    it("initializes protocol config with correct parameters", async () => {
      const feeBps = 50; // 0.5%
      const minLiquidity = new anchor.BN(10_000_000); // 10 USDC
      const minTradeSize = new anchor.BN(1_000_000); // 1 USDC
      const registrationStake = new anchor.BN(10_000_000); // 10 USDC

      await program.methods
        .initializeProtocol(feeBps, minLiquidity, minTradeSize, registrationStake)
        .accountsStrict({
          authority: authority.publicKey,
          protocolConfig: protocolConfigPda,
          treasury: treasuryTokenAccount,
          usdcMint: usdcMint,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const config = await program.account.protocolConfig.fetch(
        protocolConfigPda
      );

      assert.ok(config.authority.equals(authority.publicKey));
      assert.ok(config.treasury.equals(treasuryTokenAccount));
      assert.ok(config.usdcMint.equals(usdcMint));
      assert.equal(config.feeBps, feeBps);
      assert.ok(config.minLiquidity.eq(minLiquidity));
      assert.ok(config.minTradeSize.eq(minTradeSize));
      assert.ok(config.registrationStake.eq(registrationStake));
      assert.ok(config.marketCount.eq(new anchor.BN(0)));
    });

    it("fails when called a second time (PDA already exists)", async () => {
      try {
        await program.methods
          .initializeProtocol(50, new anchor.BN(10_000_000), new anchor.BN(1_000_000), new anchor.BN(10_000_000))
          .accountsStrict({
            authority: authority.publicKey,
            protocolConfig: protocolConfigPda,
            treasury: treasuryTokenAccount,
            usdcMint: usdcMint,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        assert.fail("Should have thrown");
      } catch (err) {
        // Expected: account already initialized
        assert.ok(err);
      }
    });
  });
});
```

### Step 1.2 -- Run test to verify it fails

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/yogenflow
anchor test
```

Expected: test fails because `initialize_protocol` is a no-op placeholder (does not set fields).

### Step 1.3 -- Implement initialize_protocol instruction

- [ ] Replace the contents of `yogenflow/programs/yogenflow/src/instructions/initialize_protocol.rs`:

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::errors::YogenFlowError;
use crate::state::ProtocolConfig;

pub fn handler(
    ctx: Context<InitializeProtocol>,
    fee_bps: u16,
    min_liquidity: u64,
    min_trade_size: u64,
    registration_stake: u64,
) -> Result<()> {
    require!(fee_bps <= 10000, YogenFlowError::InvalidFeeBps);

    let config = &mut ctx.accounts.protocol_config;
    config.authority = ctx.accounts.authority.key();
    config.treasury = ctx.accounts.treasury.key();
    config.usdc_mint = ctx.accounts.usdc_mint.key();
    config.fee_bps = fee_bps;
    config.min_liquidity = min_liquidity;
    config.min_trade_size = min_trade_size;
    config.registration_stake = registration_stake;
    config.market_count = 0;
    config.bump = ctx.bumps.protocol_config;

    msg!("Protocol initialized. Fee: {} bps, Min liquidity: {}", fee_bps, min_liquidity);
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + ProtocolConfig::INIT_SPACE,
        seeds = [b"protocol"],
        bump,
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

    /// Treasury USDC token account -- validated as a real token account with correct mint
    #[account(
        token::mint = usdc_mint,
    )]
    pub treasury: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
}
```

### Step 1.4 -- Build and run tests

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/yogenflow
anchor test
```

Expected: both tests pass.

### Step 1.5 -- Git commit

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier
git add yogenflow/
git commit -m "feat: initialize_protocol with validated treasury token account"
```

---

## Task 2: Market Account + create_market Instruction

**Files:**
- Modify: `yogenflow/programs/yogenflow/src/state/market.rs` (already done in Task 0)
- Create: `yogenflow/programs/yogenflow/src/instructions/create_market.rs`
- Modify: `yogenflow/programs/yogenflow/src/instructions/mod.rs`
- Modify: `yogenflow/programs/yogenflow/src/lib.rs`
- Test: `yogenflow/tests/yogenflow.ts`

The new create_market does NOT seed the AMM or take USDC. It only creates the market account with YES/NO mints, USDC vault, and AMM pool vaults. The creator separately calls mint_outcome_tokens + seed_amm to provide liquidity.

### Step 2.1 -- Write the test (TDD: expect fail)

- [ ] Add the following test block inside the `describe("yogenflow", ...)` block in `yogenflow/tests/yogenflow.ts`, after the `initialize_protocol` describe block:

```typescript
  describe("create_market", () => {
    let marketPda: PublicKey;
    let marketBump: number;
    let yesMint: PublicKey;
    let noMint: PublicKey;
    let usdcVault: PublicKey;
    let poolYesVault: PublicKey;
    let poolNoVault: PublicKey;
    const marketId = new anchor.BN(0);

    before(async () => {
      // Derive market PDA
      [marketPda, marketBump] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Derive YES mint PDA
      [yesMint] = PublicKey.findProgramAddressSync(
        [Buffer.from("yes_mint"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Derive NO mint PDA
      [noMint] = PublicKey.findProgramAddressSync(
        [Buffer.from("no_mint"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Derive USDC vault PDA
      [usdcVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("usdc_vault"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Derive AMM pool YES vault PDA
      [poolYesVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool_yes"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Derive AMM pool NO vault PDA
      [poolNoVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool_no"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
    });

    it("creates a market with correct parameters", async () => {
      const question = "Will SOL be above $200 on April 30?";
      const resolutionValue = new anchor.BN(200_000_000); // $200 with 6 decimals
      const resolutionDeadline = new anchor.BN(
        Math.floor(Date.now() / 1000) + 86400 * 30 // 30 days from now
      );
      const oracleFeedId = Buffer.alloc(32); // zeroed -- placeholder for Authority resolution
      const oracleFeedAccount = Keypair.generate().publicKey;

      await program.methods
        .createMarket(
          question,
          { authority: {} },
          Array.from(oracleFeedId),
          oracleFeedAccount,
          resolutionValue,
          resolutionDeadline
        )
        .accountsStrict({
          creator: authority.publicKey,
          protocolConfig: protocolConfigPda,
          market: marketPda,
          yesMint: yesMint,
          noMint: noMint,
          usdcVault: usdcVault,
          poolYesVault: poolYesVault,
          poolNoVault: poolNoVault,
          usdcMint: usdcMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const market = await program.account.market.fetch(marketPda);

      assert.ok(market.authority.equals(authority.publicKey));
      assert.equal(market.marketId.toNumber(), 0);
      assert.equal(market.question, question);
      assert.deepEqual(market.resolutionSource, { authority: {} });
      assert.ok(market.resolutionValue.eq(resolutionValue));
      assert.ok(market.yesMint.equals(yesMint));
      assert.ok(market.noMint.equals(noMint));
      assert.ok(market.usdcVault.equals(usdcVault));
      assert.ok(market.poolYesVault.equals(poolYesVault));
      assert.ok(market.poolNoVault.equals(poolNoVault));
      assert.equal(market.totalMinted.toNumber(), 0);
      assert.equal(market.ammSeeded, false);
      assert.deepEqual(market.status, { open: {} });
      assert.equal(market.outcome, null);
      assert.equal(market.feeBps, 50); // inherited from protocol config

      // Check protocol config market_count incremented
      const config = await program.account.protocolConfig.fetch(protocolConfigPda);
      assert.ok(config.marketCount.eq(new anchor.BN(1)));
    });

    it("rejects market with deadline in the past", async () => {
      // Market id 1 would be the next market
      const [nextMarketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), new anchor.BN(1).toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      const [nextYesMint] = PublicKey.findProgramAddressSync(
        [Buffer.from("yes_mint"), new anchor.BN(1).toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      const [nextNoMint] = PublicKey.findProgramAddressSync(
        [Buffer.from("no_mint"), new anchor.BN(1).toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      const [nextUsdcVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("usdc_vault"), new anchor.BN(1).toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      const [nextPoolYes] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool_yes"), new anchor.BN(1).toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      const [nextPoolNo] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool_no"), new anchor.BN(1).toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      try {
        await program.methods
          .createMarket(
            "Past deadline market",
            { authority: {} },
            Array.from(Buffer.alloc(32)),
            Keypair.generate().publicKey,
            new anchor.BN(200_000_000),
            new anchor.BN(Math.floor(Date.now() / 1000) - 100) // past
          )
          .accountsStrict({
            creator: authority.publicKey,
            protocolConfig: protocolConfigPda,
            market: nextMarketPda,
            yesMint: nextYesMint,
            noMint: nextNoMint,
            usdcVault: nextUsdcVault,
            poolYesVault: nextPoolYes,
            poolNoVault: nextPoolNo,
            usdcMint: usdcMint,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        assert.fail("Should have thrown");
      } catch (err) {
        assert.ok(err.toString().includes("DeadlineInPast"));
      }
    });
  });
```

### Step 2.2 -- Run test to verify it fails

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/yogenflow
anchor test
```

Expected: test fails because `createMarket` method does not exist yet.

### Step 2.3 -- Implement create_market instruction

- [ ] Write `yogenflow/programs/yogenflow/src/instructions/create_market.rs`:

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::errors::YogenFlowError;
use crate::state::{Market, MarketStatus, ProtocolConfig, ResolutionSource};

pub fn handler(
    ctx: Context<CreateMarket>,
    question: String,
    resolution_source: ResolutionSource,
    oracle_feed_id: [u8; 32],
    oracle_feed_account: Pubkey,
    resolution_value: u64,
    resolution_deadline: i64,
) -> Result<()> {
    require!(question.len() <= 200, YogenFlowError::QuestionTooLong);

    let clock = Clock::get()?;
    require!(
        resolution_deadline > clock.unix_timestamp,
        YogenFlowError::DeadlineInPast
    );

    let config = &ctx.accounts.protocol_config;
    let market_id = config.market_count;

    // Initialize market state
    let market = &mut ctx.accounts.market;
    market.authority = ctx.accounts.creator.key();
    market.market_id = market_id;
    market.question = question;
    market.resolution_source = resolution_source;
    market.oracle_feed_id = oracle_feed_id;
    market.oracle_feed_account = oracle_feed_account;
    market.resolution_value = resolution_value;
    market.yes_mint = ctx.accounts.yes_mint.key();
    market.no_mint = ctx.accounts.no_mint.key();
    market.usdc_vault = ctx.accounts.usdc_vault.key();
    market.pool_yes_vault = ctx.accounts.pool_yes_vault.key();
    market.pool_no_vault = ctx.accounts.pool_no_vault.key();
    market.total_minted = 0;
    market.amm_seeded = false;
    market.status = MarketStatus::Open;
    market.outcome = None;
    market.created_at = clock.unix_timestamp;
    market.resolution_deadline = resolution_deadline;
    market.fee_bps = config.fee_bps;
    market.total_volume = 0;
    market.bump = ctx.bumps.market;

    // Increment market count
    let config = &mut ctx.accounts.protocol_config;
    config.market_count = config
        .market_count
        .checked_add(1)
        .ok_or(YogenFlowError::MathOverflow)?;

    msg!(
        "Market {} created: {}",
        market_id,
        ctx.accounts.market.question
    );
    Ok(())
}

#[derive(Accounts)]
pub struct CreateMarket<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        mut,
        seeds = [b"protocol"],
        bump = protocol_config.bump,
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

    #[account(
        init,
        payer = creator,
        space = 8 + Market::INIT_SPACE,
        seeds = [b"market", protocol_config.market_count.to_le_bytes().as_ref()],
        bump,
    )]
    pub market: Account<'info, Market>,

    #[account(
        init,
        payer = creator,
        mint::decimals = 6,
        mint::authority = market,
        seeds = [b"yes_mint", protocol_config.market_count.to_le_bytes().as_ref()],
        bump,
    )]
    pub yes_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = creator,
        mint::decimals = 6,
        mint::authority = market,
        seeds = [b"no_mint", protocol_config.market_count.to_le_bytes().as_ref()],
        bump,
    )]
    pub no_mint: Account<'info, Mint>,

    /// USDC vault -- holds collateral for all minted outcome tokens
    #[account(
        init,
        payer = creator,
        token::mint = usdc_mint,
        token::authority = market,
        seeds = [b"usdc_vault", protocol_config.market_count.to_le_bytes().as_ref()],
        bump,
    )]
    pub usdc_vault: Account<'info, TokenAccount>,

    /// AMM pool vault for YES tokens
    #[account(
        init,
        payer = creator,
        token::mint = yes_mint,
        token::authority = market,
        seeds = [b"pool_yes", protocol_config.market_count.to_le_bytes().as_ref()],
        bump,
    )]
    pub pool_yes_vault: Account<'info, TokenAccount>,

    /// AMM pool vault for NO tokens
    #[account(
        init,
        payer = creator,
        token::mint = no_mint,
        token::authority = market,
        seeds = [b"pool_no", protocol_config.market_count.to_le_bytes().as_ref()],
        bump,
    )]
    pub pool_no_vault: Account<'info, TokenAccount>,

    #[account(
        address = protocol_config.usdc_mint,
    )]
    pub usdc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
```

### Step 2.4 -- Update mod.rs and lib.rs

- [ ] Replace `yogenflow/programs/yogenflow/src/instructions/mod.rs`:

```rust
pub mod initialize_protocol;
pub mod create_market;

pub use initialize_protocol::*;
pub use create_market::*;
```

- [ ] Replace `yogenflow/programs/yogenflow/src/lib.rs`:

```rust
use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("YOUR_PROGRAM_ID_HERE");

#[program]
pub mod yogenflow {
    use super::*;

    pub fn initialize_protocol(
        ctx: Context<InitializeProtocol>,
        fee_bps: u16,
        min_liquidity: u64,
        min_trade_size: u64,
        registration_stake: u64,
    ) -> Result<()> {
        instructions::initialize_protocol::handler(
            ctx,
            fee_bps,
            min_liquidity,
            min_trade_size,
            registration_stake,
        )
    }

    pub fn create_market(
        ctx: Context<CreateMarket>,
        question: String,
        resolution_source: state::ResolutionSource,
        oracle_feed_id: [u8; 32],
        oracle_feed_account: Pubkey,
        resolution_value: u64,
        resolution_deadline: i64,
    ) -> Result<()> {
        instructions::create_market::handler(
            ctx,
            question,
            resolution_source,
            oracle_feed_id,
            oracle_feed_account,
            resolution_value,
            resolution_deadline,
        )
    }
}
```

> **Note:** Replace `YOUR_PROGRAM_ID_HERE` with the actual program ID from `solana address -k target/deploy/yogenflow-keypair.json`.

### Step 2.5 -- Build and run tests

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/yogenflow
anchor test
```

Expected: all 4 tests pass (2 from Task 1 + 2 from Task 2).

### Step 2.6 -- Git commit

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier
git add yogenflow/
git commit -m "feat: create_market with YES/NO mints, USDC vault, AMM pool vaults, deadline validation"
```

---

## Task 3: mint_outcome_tokens + redeem_outcome_tokens Instructions

**Files:**
- Create: `yogenflow/programs/yogenflow/src/instructions/mint_outcome_tokens.rs`
- Create: `yogenflow/programs/yogenflow/src/instructions/redeem_outcome_tokens.rs`
- Modify: `yogenflow/programs/yogenflow/src/instructions/mod.rs`
- Modify: `yogenflow/programs/yogenflow/src/lib.rs`
- Test: `yogenflow/tests/yogenflow.ts`

### Step 3.1 -- Write the mint/redeem tests (TDD: expect fail)

- [ ] Add the following test block inside the main `describe("yogenflow", ...)` in `yogenflow/tests/yogenflow.ts`:

```typescript
  describe("mint_outcome_tokens / redeem_outcome_tokens", () => {
    const marketId = new anchor.BN(0);
    let marketPda: PublicKey;
    let yesMint: PublicKey;
    let noMint: PublicKey;
    let usdcVault: PublicKey;
    let minterKeypair: Keypair;
    let minterUsdcAccount: PublicKey;
    let minterYesAccount: PublicKey;
    let minterNoAccount: PublicKey;

    before(async () => {
      [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [yesMint] = PublicKey.findProgramAddressSync(
        [Buffer.from("yes_mint"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [noMint] = PublicKey.findProgramAddressSync(
        [Buffer.from("no_mint"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [usdcVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("usdc_vault"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Create minter
      minterKeypair = Keypair.generate();
      const airdropSig = await provider.connection.requestAirdrop(
        minterKeypair.publicKey,
        2 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig);

      // Create minter USDC account and fund it
      minterUsdcAccount = await createAccount(
        provider.connection,
        minterKeypair,
        usdcMint,
        minterKeypair.publicKey
      );
      await mintTo(
        provider.connection,
        (authority as any).payer,
        usdcMint,
        minterUsdcAccount,
        authority.publicKey,
        100_000_000 // 100 USDC
      );

      // Create minter YES token account
      minterYesAccount = await createAccount(
        provider.connection,
        minterKeypair,
        yesMint,
        minterKeypair.publicKey
      );

      // Create minter NO token account
      minterNoAccount = await createAccount(
        provider.connection,
        minterKeypair,
        noMint,
        minterKeypair.publicKey
      );
    });

    it("mints outcome tokens: deposit USDC, receive YES+NO", async () => {
      const amount = new anchor.BN(20_000_000); // 20 USDC

      await program.methods
        .mintOutcomeTokens(amount)
        .accountsStrict({
          user: minterKeypair.publicKey,
          market: marketPda,
          userUsdcAccount: minterUsdcAccount,
          userYesAccount: minterYesAccount,
          userNoAccount: minterNoAccount,
          usdcVault: usdcVault,
          yesMint: yesMint,
          noMint: noMint,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([minterKeypair])
        .rpc();

      // Check balances
      const yesBalance = await getAccount(provider.connection, minterYesAccount);
      const noBalance = await getAccount(provider.connection, minterNoAccount);
      const vaultBalance = await getAccount(provider.connection, usdcVault);

      assert.equal(Number(yesBalance.amount), 20_000_000);
      assert.equal(Number(noBalance.amount), 20_000_000);
      assert.equal(Number(vaultBalance.amount), 20_000_000);

      // Check market total_minted
      const market = await program.account.market.fetch(marketPda);
      assert.equal(market.totalMinted.toNumber(), 20_000_000);
    });

    it("redeems outcome tokens: burn YES+NO, receive USDC", async () => {
      const amount = new anchor.BN(5_000_000); // Redeem 5

      const usdcBefore = await getAccount(provider.connection, minterUsdcAccount);

      await program.methods
        .redeemOutcomeTokens(amount)
        .accountsStrict({
          user: minterKeypair.publicKey,
          market: marketPda,
          userUsdcAccount: minterUsdcAccount,
          userYesAccount: minterYesAccount,
          userNoAccount: minterNoAccount,
          usdcVault: usdcVault,
          yesMint: yesMint,
          noMint: noMint,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([minterKeypair])
        .rpc();

      const yesBalance = await getAccount(provider.connection, minterYesAccount);
      const noBalance = await getAccount(provider.connection, minterNoAccount);
      const usdcAfter = await getAccount(provider.connection, minterUsdcAccount);

      assert.equal(Number(yesBalance.amount), 15_000_000);
      assert.equal(Number(noBalance.amount), 15_000_000);
      assert.equal(
        Number(usdcAfter.amount) - Number(usdcBefore.amount),
        5_000_000
      );

      const market = await program.account.market.fetch(marketPda);
      assert.equal(market.totalMinted.toNumber(), 15_000_000);
    });
  });
```

### Step 3.2 -- Run test to verify it fails

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/yogenflow
anchor test
```

Expected: new tests fail because `mintOutcomeTokens` does not exist.

### Step 3.3 -- Implement mint_outcome_tokens instruction

- [ ] Write `yogenflow/programs/yogenflow/src/instructions/mint_outcome_tokens.rs`:

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};
use crate::errors::YogenFlowError;
use crate::state::{Market, MarketStatus};

pub fn handler(ctx: Context<MintOutcomeTokens>, amount: u64) -> Result<()> {
    let market = &ctx.accounts.market;

    require!(
        market.status == MarketStatus::Open,
        YogenFlowError::MarketNotOpen
    );
    require!(amount > 0, YogenFlowError::TradeTooSmall);

    // Transfer USDC from user to vault (1:1 collateral)
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.user_usdc_account.to_account_info(),
            to: ctx.accounts.usdc_vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, amount)?;

    // Mint YES tokens to user (market PDA is mint authority)
    let market_id_bytes = market.market_id.to_le_bytes();
    let market_seeds: &[&[u8]] = &[
        b"market",
        market_id_bytes.as_ref(),
        &[market.bump],
    ];
    let signer_seeds = &[market_seeds];

    let mint_yes_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.yes_mint.to_account_info(),
            to: ctx.accounts.user_yes_account.to_account_info(),
            authority: ctx.accounts.market.to_account_info(),
        },
        signer_seeds,
    );
    token::mint_to(mint_yes_ctx, amount)?;

    // Mint NO tokens to user
    let mint_no_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.no_mint.to_account_info(),
            to: ctx.accounts.user_no_account.to_account_info(),
            authority: ctx.accounts.market.to_account_info(),
        },
        signer_seeds,
    );
    token::mint_to(mint_no_ctx, amount)?;

    // Update market total_minted
    let market = &mut ctx.accounts.market;
    market.total_minted = market
        .total_minted
        .checked_add(amount)
        .ok_or(YogenFlowError::MathOverflow)?;

    msg!("mint_outcome_tokens: {} USDC -> {} YES + {} NO", amount, amount, amount);
    Ok(())
}

#[derive(Accounts)]
pub struct MintOutcomeTokens<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump,
        constraint = market.status == MarketStatus::Open @ YogenFlowError::MarketNotOpen,
    )]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        token::authority = user,
    )]
    pub user_usdc_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = yes_mint,
        token::authority = user,
    )]
    pub user_yes_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = no_mint,
        token::authority = user,
    )]
    pub user_no_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        address = market.usdc_vault,
    )]
    pub usdc_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        address = market.yes_mint,
    )]
    pub yes_mint: Account<'info, Mint>,

    #[account(
        mut,
        address = market.no_mint,
    )]
    pub no_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}
```

### Step 3.4 -- Implement redeem_outcome_tokens instruction

- [ ] Write `yogenflow/programs/yogenflow/src/instructions/redeem_outcome_tokens.rs`:

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer};
use crate::errors::YogenFlowError;
use crate::state::{Market, MarketStatus};

pub fn handler(ctx: Context<RedeemOutcomeTokens>, amount: u64) -> Result<()> {
    let market = &ctx.accounts.market;

    require!(
        market.status == MarketStatus::Open,
        YogenFlowError::MarketNotOpen
    );
    require!(amount > 0, YogenFlowError::TradeTooSmall);

    // Burn YES tokens from user
    let burn_yes_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Burn {
            mint: ctx.accounts.yes_mint.to_account_info(),
            from: ctx.accounts.user_yes_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        },
    );
    token::burn(burn_yes_ctx, amount)?;

    // Burn NO tokens from user
    let burn_no_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Burn {
            mint: ctx.accounts.no_mint.to_account_info(),
            from: ctx.accounts.user_no_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        },
    );
    token::burn(burn_no_ctx, amount)?;

    // Transfer USDC from vault to user (market PDA signs)
    let market_id_bytes = market.market_id.to_le_bytes();
    let market_seeds: &[&[u8]] = &[
        b"market",
        market_id_bytes.as_ref(),
        &[market.bump],
    ];
    let signer_seeds = &[market_seeds];

    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.usdc_vault.to_account_info(),
            to: ctx.accounts.user_usdc_account.to_account_info(),
            authority: ctx.accounts.market.to_account_info(),
        },
        signer_seeds,
    );
    token::transfer(transfer_ctx, amount)?;

    // Update market total_minted
    let market = &mut ctx.accounts.market;
    market.total_minted = market
        .total_minted
        .checked_sub(amount)
        .ok_or(YogenFlowError::MathOverflow)?;

    msg!("redeem_outcome_tokens: {} YES + {} NO -> {} USDC", amount, amount, amount);
    Ok(())
}

#[derive(Accounts)]
pub struct RedeemOutcomeTokens<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump,
        constraint = market.status == MarketStatus::Open @ YogenFlowError::MarketNotOpen,
    )]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        token::authority = user,
    )]
    pub user_usdc_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = yes_mint,
        token::authority = user,
    )]
    pub user_yes_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = no_mint,
        token::authority = user,
    )]
    pub user_no_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        address = market.usdc_vault,
    )]
    pub usdc_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        address = market.yes_mint,
    )]
    pub yes_mint: Account<'info, Mint>,

    #[account(
        mut,
        address = market.no_mint,
    )]
    pub no_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}
```

### Step 3.5 -- Update mod.rs and lib.rs

- [ ] Replace `yogenflow/programs/yogenflow/src/instructions/mod.rs`:

```rust
pub mod initialize_protocol;
pub mod create_market;
pub mod mint_outcome_tokens;
pub mod redeem_outcome_tokens;

pub use initialize_protocol::*;
pub use create_market::*;
pub use mint_outcome_tokens::*;
pub use redeem_outcome_tokens::*;
```

- [ ] Add to `lib.rs` inside the `#[program]` module (after `create_market`):

```rust
    pub fn mint_outcome_tokens(ctx: Context<MintOutcomeTokens>, amount: u64) -> Result<()> {
        instructions::mint_outcome_tokens::handler(ctx, amount)
    }

    pub fn redeem_outcome_tokens(ctx: Context<RedeemOutcomeTokens>, amount: u64) -> Result<()> {
        instructions::redeem_outcome_tokens::handler(ctx, amount)
    }
```

### Step 3.6 -- Build and run tests

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/yogenflow
anchor test
```

Expected: all 6 tests pass (2 init + 2 create_market + 2 mint/redeem).

### Step 3.7 -- Git commit

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier
git add yogenflow/
git commit -m "feat: mint_outcome_tokens and redeem_outcome_tokens (1:1 USDC collateral)"
```

---

## Task 4: seed_amm Instruction

**Files:**
- Create: `yogenflow/programs/yogenflow/src/instructions/seed_amm.rs`
- Modify: `yogenflow/programs/yogenflow/src/instructions/mod.rs`
- Modify: `yogenflow/programs/yogenflow/src/lib.rs`
- Test: `yogenflow/tests/yogenflow.ts`

The market creator (or anyone with YES+NO tokens) deposits equal amounts of YES and NO tokens into the AMM pool vaults, initializing the constant product k.

### Step 4.1 -- Write the seed_amm test (TDD: expect fail)

- [ ] Add the following test block inside the main describe in `yogenflow/tests/yogenflow.ts`:

```typescript
  describe("seed_amm", () => {
    const marketId = new anchor.BN(0);
    let marketPda: PublicKey;
    let yesMint: PublicKey;
    let noMint: PublicKey;
    let poolYesVault: PublicKey;
    let poolNoVault: PublicKey;

    // Reuse the minter from the previous test who has 15 YES + 15 NO tokens
    // We need to reference the minter's accounts. For test isolation, we create
    // a new seeder who mints fresh tokens.
    let seederKeypair: Keypair;
    let seederUsdcAccount: PublicKey;
    let seederYesAccount: PublicKey;
    let seederNoAccount: PublicKey;
    let usdcVault: PublicKey;

    before(async () => {
      [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [yesMint] = PublicKey.findProgramAddressSync(
        [Buffer.from("yes_mint"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [noMint] = PublicKey.findProgramAddressSync(
        [Buffer.from("no_mint"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [usdcVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("usdc_vault"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [poolYesVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool_yes"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [poolNoVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool_no"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Create seeder
      seederKeypair = Keypair.generate();
      const airdropSig = await provider.connection.requestAirdrop(
        seederKeypair.publicKey,
        2 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig);

      seederUsdcAccount = await createAccount(
        provider.connection,
        seederKeypair,
        usdcMint,
        seederKeypair.publicKey
      );
      await mintTo(
        provider.connection,
        (authority as any).payer,
        usdcMint,
        seederUsdcAccount,
        authority.publicKey,
        50_000_000 // 50 USDC
      );

      seederYesAccount = await createAccount(
        provider.connection,
        seederKeypair,
        yesMint,
        seederKeypair.publicKey
      );
      seederNoAccount = await createAccount(
        provider.connection,
        seederKeypair,
        noMint,
        seederKeypair.publicKey
      );

      // Seeder mints outcome tokens first
      await program.methods
        .mintOutcomeTokens(new anchor.BN(20_000_000)) // 20 USDC -> 20 YES + 20 NO
        .accountsStrict({
          user: seederKeypair.publicKey,
          market: marketPda,
          userUsdcAccount: seederUsdcAccount,
          userYesAccount: seederYesAccount,
          userNoAccount: seederNoAccount,
          usdcVault: usdcVault,
          yesMint: yesMint,
          noMint: noMint,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([seederKeypair])
        .rpc();
    });

    it("seeds the AMM pool with YES and NO tokens", async () => {
      const seedAmount = new anchor.BN(20_000_000);

      await program.methods
        .seedAmm(seedAmount)
        .accountsStrict({
          seeder: seederKeypair.publicKey,
          market: marketPda,
          protocolConfig: protocolConfigPda,
          seederYesAccount: seederYesAccount,
          seederNoAccount: seederNoAccount,
          poolYesVault: poolYesVault,
          poolNoVault: poolNoVault,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([seederKeypair])
        .rpc();

      // Check pool vaults have tokens
      const poolYes = await getAccount(provider.connection, poolYesVault);
      const poolNo = await getAccount(provider.connection, poolNoVault);
      assert.equal(Number(poolYes.amount), 20_000_000);
      assert.equal(Number(poolNo.amount), 20_000_000);

      // Check market is seeded
      const market = await program.account.market.fetch(marketPda);
      assert.equal(market.ammSeeded, true);
    });

    it("fails to seed AMM a second time", async () => {
      try {
        await program.methods
          .seedAmm(new anchor.BN(1_000_000))
          .accountsStrict({
            seeder: seederKeypair.publicKey,
            market: marketPda,
            protocolConfig: protocolConfigPda,
            seederYesAccount: seederYesAccount,
            seederNoAccount: seederNoAccount,
            poolYesVault: poolYesVault,
            poolNoVault: poolNoVault,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([seederKeypair])
          .rpc();
        assert.fail("Should have thrown");
      } catch (err) {
        assert.ok(err.toString().includes("AmmAlreadySeeded"));
      }
    });
  });
```

### Step 4.2 -- Run test to verify it fails

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/yogenflow
anchor test
```

Expected: fails because `seedAmm` does not exist.

### Step 4.3 -- Implement seed_amm instruction

- [ ] Write `yogenflow/programs/yogenflow/src/instructions/seed_amm.rs`:

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::errors::YogenFlowError;
use crate::state::{Market, MarketStatus, ProtocolConfig};

pub fn handler(ctx: Context<SeedAmm>, amount: u64) -> Result<()> {
    let market = &ctx.accounts.market;
    let config = &ctx.accounts.protocol_config;

    require!(
        market.status == MarketStatus::Open,
        YogenFlowError::MarketNotOpen
    );
    require!(!market.amm_seeded, YogenFlowError::AmmAlreadySeeded);
    require!(
        amount >= config.min_liquidity,
        YogenFlowError::InsufficientLiquidity
    );

    // Transfer YES tokens from seeder to pool_yes_vault
    let transfer_yes_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.seeder_yes_account.to_account_info(),
            to: ctx.accounts.pool_yes_vault.to_account_info(),
            authority: ctx.accounts.seeder.to_account_info(),
        },
    );
    token::transfer(transfer_yes_ctx, amount)?;

    // Transfer NO tokens from seeder to pool_no_vault
    let transfer_no_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.seeder_no_account.to_account_info(),
            to: ctx.accounts.pool_no_vault.to_account_info(),
            authority: ctx.accounts.seeder.to_account_info(),
        },
    );
    token::transfer(transfer_no_ctx, amount)?;

    // Mark AMM as seeded
    let market = &mut ctx.accounts.market;
    market.amm_seeded = true;

    msg!("seed_amm: {} YES + {} NO deposited into AMM pool", amount, amount);
    Ok(())
}

#[derive(Accounts)]
pub struct SeedAmm<'info> {
    #[account(mut)]
    pub seeder: Signer<'info>,

    #[account(
        mut,
        seeds = [b"market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump,
        constraint = market.status == MarketStatus::Open @ YogenFlowError::MarketNotOpen,
        constraint = !market.amm_seeded @ YogenFlowError::AmmAlreadySeeded,
    )]
    pub market: Account<'info, Market>,

    #[account(
        seeds = [b"protocol"],
        bump = protocol_config.bump,
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

    #[account(
        mut,
        token::mint = market.yes_mint,
        token::authority = seeder,
    )]
    pub seeder_yes_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = market.no_mint,
        token::authority = seeder,
    )]
    pub seeder_no_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        address = market.pool_yes_vault,
    )]
    pub pool_yes_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        address = market.pool_no_vault,
    )]
    pub pool_no_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}
```

### Step 4.4 -- Update mod.rs and lib.rs

- [ ] Replace `yogenflow/programs/yogenflow/src/instructions/mod.rs`:

```rust
pub mod initialize_protocol;
pub mod create_market;
pub mod mint_outcome_tokens;
pub mod redeem_outcome_tokens;
pub mod seed_amm;

pub use initialize_protocol::*;
pub use create_market::*;
pub use mint_outcome_tokens::*;
pub use redeem_outcome_tokens::*;
pub use seed_amm::*;
```

- [ ] Add to `lib.rs` inside the `#[program]` module:

```rust
    pub fn seed_amm(ctx: Context<SeedAmm>, amount: u64) -> Result<()> {
        instructions::seed_amm::handler(ctx, amount)
    }
```

### Step 4.5 -- Build and run tests

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/yogenflow
anchor test
```

Expected: all 8 tests pass.

### Step 4.6 -- Git commit

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier
git add yogenflow/
git commit -m "feat: seed_amm instruction for depositing YES+NO tokens into AMM pool"
```

---

## Task 5: swap_yes_to_no + swap_no_to_yes Instructions (AMM Trading)

**Files:**
- Create: `yogenflow/programs/yogenflow/src/instructions/swap_yes_to_no.rs`
- Create: `yogenflow/programs/yogenflow/src/instructions/swap_no_to_yes.rs`
- Modify: `yogenflow/programs/yogenflow/src/instructions/mod.rs`
- Modify: `yogenflow/programs/yogenflow/src/lib.rs`
- Test: `yogenflow/tests/yogenflow.ts`

The AMM now operates on the YES<->NO token pair using x*y=k. Both pool vaults hold REAL SPL tokens. Fees are deducted from the swap input amount. Price clamping prevents the price from going outside 1%-99%.

### Step 5.1 -- Write the swap tests (TDD: expect fail)

- [ ] Add the following test block inside the main `describe("yogenflow", ...)` in `yogenflow/tests/yogenflow.ts`:

```typescript
  describe("swap_yes_to_no / swap_no_to_yes", () => {
    const marketId = new anchor.BN(0);
    let marketPda: PublicKey;
    let yesMint: PublicKey;
    let noMint: PublicKey;
    let usdcVault: PublicKey;
    let poolYesVault: PublicKey;
    let poolNoVault: PublicKey;
    let traderKeypair: Keypair;
    let traderUsdcAccount: PublicKey;
    let traderYesAccount: PublicKey;
    let traderNoAccount: PublicKey;

    before(async () => {
      [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [yesMint] = PublicKey.findProgramAddressSync(
        [Buffer.from("yes_mint"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [noMint] = PublicKey.findProgramAddressSync(
        [Buffer.from("no_mint"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [usdcVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("usdc_vault"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [poolYesVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool_yes"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [poolNoVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool_no"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Create trader
      traderKeypair = Keypair.generate();
      const airdropSig = await provider.connection.requestAirdrop(
        traderKeypair.publicKey,
        2 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig);

      traderUsdcAccount = await createAccount(
        provider.connection,
        traderKeypair,
        usdcMint,
        traderKeypair.publicKey
      );
      await mintTo(
        provider.connection,
        (authority as any).payer,
        usdcMint,
        traderUsdcAccount,
        authority.publicKey,
        50_000_000
      );

      traderYesAccount = await createAccount(
        provider.connection,
        traderKeypair,
        yesMint,
        traderKeypair.publicKey
      );
      traderNoAccount = await createAccount(
        provider.connection,
        traderKeypair,
        noMint,
        traderKeypair.publicKey
      );

      // Trader mints some outcome tokens to trade with
      await program.methods
        .mintOutcomeTokens(new anchor.BN(10_000_000)) // 10 USDC -> 10 YES + 10 NO
        .accountsStrict({
          user: traderKeypair.publicKey,
          market: marketPda,
          userUsdcAccount: traderUsdcAccount,
          userYesAccount: traderYesAccount,
          userNoAccount: traderNoAccount,
          usdcVault: usdcVault,
          yesMint: yesMint,
          noMint: noMint,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([traderKeypair])
        .rpc();
    });

    it("swaps YES tokens for NO tokens via AMM", async () => {
      const yesIn = new anchor.BN(5_000_000);

      const [positionPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("position"),
          marketId.toArrayLike(Buffer, "le", 8),
          traderKeypair.publicKey.toBuffer(),
        ],
        program.programId
      );

      const noBefore = await getAccount(provider.connection, traderNoAccount);

      await program.methods
        .swapYesToNo(yesIn)
        .accountsStrict({
          trader: traderKeypair.publicKey,
          market: marketPda,
          protocolConfig: protocolConfigPda,
          position: positionPda,
          traderYesAccount: traderYesAccount,
          traderNoAccount: traderNoAccount,
          poolYesVault: poolYesVault,
          poolNoVault: poolNoVault,
          treasuryYesAccount: null,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([traderKeypair])
        .rpc();

      // Trader should have more NO tokens
      const noAfter = await getAccount(provider.connection, traderNoAccount);
      assert.ok(Number(noAfter.amount) > Number(noBefore.amount));

      // Trader should have fewer YES tokens
      const yesAfter = await getAccount(provider.connection, traderYesAccount);
      assert.equal(Number(yesAfter.amount), 10_000_000 - 5_000_000); // 5 remaining

      // Pool should have more YES, less NO
      const poolYes = await getAccount(provider.connection, poolYesVault);
      const poolNo = await getAccount(provider.connection, poolNoVault);
      assert.ok(Number(poolYes.amount) > 20_000_000);
      assert.ok(Number(poolNo.amount) < 20_000_000);

      // Position should be updated
      const position = await program.account.position.fetch(positionPda);
      assert.ok(position.yesAmount.gt(new anchor.BN(0)) || position.noAmount.gt(new anchor.BN(0)));
    });

    it("swaps NO tokens for YES tokens via AMM", async () => {
      const noIn = new anchor.BN(3_000_000);

      const [positionPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("position"),
          marketId.toArrayLike(Buffer, "le", 8),
          traderKeypair.publicKey.toBuffer(),
        ],
        program.programId
      );

      const yesBefore = await getAccount(provider.connection, traderYesAccount);

      await program.methods
        .swapNoToYes(noIn)
        .accountsStrict({
          trader: traderKeypair.publicKey,
          market: marketPda,
          protocolConfig: protocolConfigPda,
          position: positionPda,
          traderYesAccount: traderYesAccount,
          traderNoAccount: traderNoAccount,
          poolYesVault: poolYesVault,
          poolNoVault: poolNoVault,
          treasuryNoAccount: null,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([traderKeypair])
        .rpc();

      const yesAfter = await getAccount(provider.connection, traderYesAccount);
      assert.ok(Number(yesAfter.amount) > Number(yesBefore.amount));
    });

    it("rejects swap below minimum trade size", async () => {
      const tinyAmount = new anchor.BN(100); // below min_trade_size

      const [positionPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("position"),
          marketId.toArrayLike(Buffer, "le", 8),
          traderKeypair.publicKey.toBuffer(),
        ],
        program.programId
      );

      try {
        await program.methods
          .swapYesToNo(tinyAmount)
          .accountsStrict({
            trader: traderKeypair.publicKey,
            market: marketPda,
            protocolConfig: protocolConfigPda,
            position: positionPda,
            traderYesAccount: traderYesAccount,
            traderNoAccount: traderNoAccount,
            poolYesVault: poolYesVault,
            poolNoVault: poolNoVault,
            treasuryYesAccount: null,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([traderKeypair])
          .rpc();
        assert.fail("Should have thrown");
      } catch (err) {
        assert.ok(err.toString().includes("TradeTooSmall"));
      }
    });
  });
```

### Step 5.2 -- Run test to verify it fails

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/yogenflow
anchor test
```

Expected: new tests fail because `swapYesToNo` does not exist.

### Step 5.3 -- Implement swap_yes_to_no instruction

- [ ] Write `yogenflow/programs/yogenflow/src/instructions/swap_yes_to_no.rs`:

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::errors::YogenFlowError;
use crate::state::{Market, MarketStatus, Position, ProtocolConfig};

pub fn handler(ctx: Context<SwapYesToNo>, yes_in: u64) -> Result<()> {
    let market = &ctx.accounts.market;
    let config = &ctx.accounts.protocol_config;

    // Validations
    require!(
        market.status == MarketStatus::Open,
        YogenFlowError::MarketNotOpen
    );
    require!(market.amm_seeded, YogenFlowError::AmmNotSeeded);
    require!(yes_in >= config.min_trade_size, YogenFlowError::TradeTooSmall);

    // Calculate fee on input
    let fee = yes_in
        .checked_mul(market.fee_bps as u64)
        .ok_or(YogenFlowError::MathOverflow)?
        .checked_div(10000)
        .ok_or(YogenFlowError::MathOverflow)?;
    let net_in = yes_in
        .checked_sub(fee)
        .ok_or(YogenFlowError::MathOverflow)?;

    // Read actual pool balances from token accounts
    let pool_yes = ctx.accounts.pool_yes_vault.amount;
    let pool_no = ctx.accounts.pool_no_vault.amount;

    // AMM: k = pool_yes * pool_no
    let k = (pool_yes as u128)
        .checked_mul(pool_no as u128)
        .ok_or(YogenFlowError::MathOverflow)?;

    let new_pool_yes = (pool_yes as u128)
        .checked_add(net_in as u128)
        .ok_or(YogenFlowError::MathOverflow)?;
    let new_pool_no = k
        .checked_div(new_pool_yes)
        .ok_or(YogenFlowError::MathOverflow)?;

    let no_out = (pool_no as u128)
        .checked_sub(new_pool_no)
        .ok_or(YogenFlowError::MathOverflow)? as u64;

    require!(no_out > 0, YogenFlowError::ZeroOutput);

    // Price check after trade: yes_price = new_pool_no / (new_pool_yes + new_pool_no)
    let total_pool = new_pool_yes
        .checked_add(new_pool_no)
        .ok_or(YogenFlowError::MathOverflow)?;
    let yes_price_bps = new_pool_no
        .checked_mul(10000)
        .ok_or(YogenFlowError::MathOverflow)?
        .checked_div(total_pool)
        .ok_or(YogenFlowError::MathOverflow)? as u64;

    require!(
        yes_price_bps >= 100 && yes_price_bps <= 9900,
        YogenFlowError::PriceOutOfRange
    );

    // Transfer YES tokens from trader to pool (net amount after fee)
    let transfer_yes_to_pool = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.trader_yes_account.to_account_info(),
            to: ctx.accounts.pool_yes_vault.to_account_info(),
            authority: ctx.accounts.trader.to_account_info(),
        },
    );
    token::transfer(transfer_yes_to_pool, net_in)?;

    // Transfer fee YES tokens to treasury (if treasury account provided)
    // For simplicity in MVP, fee tokens stay with the pool (increases k)
    // If a treasury YES account is provided, send fee there
    if fee > 0 {
        if let Some(treasury_yes) = &ctx.accounts.treasury_yes_account {
            let fee_transfer = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.trader_yes_account.to_account_info(),
                    to: treasury_yes.to_account_info(),
                    authority: ctx.accounts.trader.to_account_info(),
                },
            );
            token::transfer(fee_transfer, fee)?;
        } else {
            // Fee stays in pool (added to pool_yes_vault), increasing k
            let fee_to_pool = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.trader_yes_account.to_account_info(),
                    to: ctx.accounts.pool_yes_vault.to_account_info(),
                    authority: ctx.accounts.trader.to_account_info(),
                },
            );
            token::transfer(fee_to_pool, fee)?;
        }
    }

    // Transfer NO tokens from pool to trader (market PDA signs as pool authority)
    let market_id_bytes = market.market_id.to_le_bytes();
    let market_seeds: &[&[u8]] = &[
        b"market",
        market_id_bytes.as_ref(),
        &[market.bump],
    ];
    let signer_seeds = &[market_seeds];

    let transfer_no_to_trader = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.pool_no_vault.to_account_info(),
            to: ctx.accounts.trader_no_account.to_account_info(),
            authority: ctx.accounts.market.to_account_info(),
        },
        signer_seeds,
    );
    token::transfer(transfer_no_to_trader, no_out)?;

    // Update market volume
    let market = &mut ctx.accounts.market;
    market.total_volume = market
        .total_volume
        .checked_add(yes_in)
        .ok_or(YogenFlowError::MathOverflow)?;

    // Update position (init_if_needed handles creation)
    let position = &mut ctx.accounts.position;
    if position.market == Pubkey::default() {
        position.market = market.key();
        position.trader = ctx.accounts.trader.key();
        position.bump = ctx.bumps.position;
    }
    // Trader spent YES tokens, received NO tokens
    position.yes_amount = position
        .yes_amount
        .checked_sub(yes_in)
        .unwrap_or(0);
    position.no_amount = position
        .no_amount
        .checked_add(no_out)
        .ok_or(YogenFlowError::MathOverflow)?;

    msg!(
        "swap_yes_to_no: {} YES -> {} NO (fee: {} YES)",
        yes_in,
        no_out,
        fee
    );
    Ok(())
}

#[derive(Accounts)]
pub struct SwapYesToNo<'info> {
    #[account(mut)]
    pub trader: Signer<'info>,

    #[account(
        mut,
        seeds = [b"market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump,
        constraint = market.status == MarketStatus::Open @ YogenFlowError::MarketNotOpen,
        constraint = market.amm_seeded @ YogenFlowError::AmmNotSeeded,
    )]
    pub market: Account<'info, Market>,

    #[account(
        seeds = [b"protocol"],
        bump = protocol_config.bump,
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

    #[account(
        init_if_needed,
        payer = trader,
        space = 8 + Position::INIT_SPACE,
        seeds = [
            b"position",
            market.market_id.to_le_bytes().as_ref(),
            trader.key().as_ref(),
        ],
        bump,
    )]
    pub position: Account<'info, Position>,

    #[account(
        mut,
        token::mint = market.yes_mint,
        token::authority = trader,
    )]
    pub trader_yes_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = market.no_mint,
        token::authority = trader,
    )]
    pub trader_no_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        address = market.pool_yes_vault,
    )]
    pub pool_yes_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        address = market.pool_no_vault,
    )]
    pub pool_no_vault: Account<'info, TokenAccount>,

    /// Optional treasury YES token account for fee collection.
    /// If not provided, fees go into the pool (increasing k).
    #[account(mut)]
    pub treasury_yes_account: Option<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
```

### Step 5.4 -- Implement swap_no_to_yes instruction

- [ ] Write `yogenflow/programs/yogenflow/src/instructions/swap_no_to_yes.rs`:

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::errors::YogenFlowError;
use crate::state::{Market, MarketStatus, Position, ProtocolConfig};

pub fn handler(ctx: Context<SwapNoToYes>, no_in: u64) -> Result<()> {
    let market = &ctx.accounts.market;
    let config = &ctx.accounts.protocol_config;

    // Validations
    require!(
        market.status == MarketStatus::Open,
        YogenFlowError::MarketNotOpen
    );
    require!(market.amm_seeded, YogenFlowError::AmmNotSeeded);
    require!(no_in >= config.min_trade_size, YogenFlowError::TradeTooSmall);

    // Calculate fee on input
    let fee = no_in
        .checked_mul(market.fee_bps as u64)
        .ok_or(YogenFlowError::MathOverflow)?
        .checked_div(10000)
        .ok_or(YogenFlowError::MathOverflow)?;
    let net_in = no_in
        .checked_sub(fee)
        .ok_or(YogenFlowError::MathOverflow)?;

    // Read actual pool balances from token accounts
    let pool_yes = ctx.accounts.pool_yes_vault.amount;
    let pool_no = ctx.accounts.pool_no_vault.amount;

    // AMM: k = pool_yes * pool_no
    let k = (pool_yes as u128)
        .checked_mul(pool_no as u128)
        .ok_or(YogenFlowError::MathOverflow)?;

    let new_pool_no = (pool_no as u128)
        .checked_add(net_in as u128)
        .ok_or(YogenFlowError::MathOverflow)?;
    let new_pool_yes = k
        .checked_div(new_pool_no)
        .ok_or(YogenFlowError::MathOverflow)?;

    let yes_out = (pool_yes as u128)
        .checked_sub(new_pool_yes)
        .ok_or(YogenFlowError::MathOverflow)? as u64;

    require!(yes_out > 0, YogenFlowError::ZeroOutput);

    // Price check after trade: no_price = new_pool_yes / (new_pool_yes + new_pool_no)
    let total_pool = new_pool_yes
        .checked_add(new_pool_no)
        .ok_or(YogenFlowError::MathOverflow)?;
    let no_price_bps = new_pool_yes
        .checked_mul(10000)
        .ok_or(YogenFlowError::MathOverflow)?
        .checked_div(total_pool)
        .ok_or(YogenFlowError::MathOverflow)? as u64;

    require!(
        no_price_bps >= 100 && no_price_bps <= 9900,
        YogenFlowError::PriceOutOfRange
    );

    // Transfer NO tokens from trader to pool (net amount after fee)
    let transfer_no_to_pool = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.trader_no_account.to_account_info(),
            to: ctx.accounts.pool_no_vault.to_account_info(),
            authority: ctx.accounts.trader.to_account_info(),
        },
    );
    token::transfer(transfer_no_to_pool, net_in)?;

    // Transfer fee NO tokens (fee stays in pool or goes to treasury)
    if fee > 0 {
        if let Some(treasury_no) = &ctx.accounts.treasury_no_account {
            let fee_transfer = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.trader_no_account.to_account_info(),
                    to: treasury_no.to_account_info(),
                    authority: ctx.accounts.trader.to_account_info(),
                },
            );
            token::transfer(fee_transfer, fee)?;
        } else {
            let fee_to_pool = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.trader_no_account.to_account_info(),
                    to: ctx.accounts.pool_no_vault.to_account_info(),
                    authority: ctx.accounts.trader.to_account_info(),
                },
            );
            token::transfer(fee_to_pool, fee)?;
        }
    }

    // Transfer YES tokens from pool to trader (market PDA signs)
    let market_id_bytes = market.market_id.to_le_bytes();
    let market_seeds: &[&[u8]] = &[
        b"market",
        market_id_bytes.as_ref(),
        &[market.bump],
    ];
    let signer_seeds = &[market_seeds];

    let transfer_yes_to_trader = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.pool_yes_vault.to_account_info(),
            to: ctx.accounts.trader_yes_account.to_account_info(),
            authority: ctx.accounts.market.to_account_info(),
        },
        signer_seeds,
    );
    token::transfer(transfer_yes_to_trader, yes_out)?;

    // Update market volume
    let market = &mut ctx.accounts.market;
    market.total_volume = market
        .total_volume
        .checked_add(no_in)
        .ok_or(YogenFlowError::MathOverflow)?;

    // Update position (init_if_needed handles creation)
    let position = &mut ctx.accounts.position;
    if position.market == Pubkey::default() {
        position.market = market.key();
        position.trader = ctx.accounts.trader.key();
        position.bump = ctx.bumps.position;
    }
    // Trader spent NO tokens, received YES tokens
    position.no_amount = position
        .no_amount
        .checked_sub(no_in)
        .unwrap_or(0);
    position.yes_amount = position
        .yes_amount
        .checked_add(yes_out)
        .ok_or(YogenFlowError::MathOverflow)?;

    msg!(
        "swap_no_to_yes: {} NO -> {} YES (fee: {} NO)",
        no_in,
        yes_out,
        fee
    );
    Ok(())
}

#[derive(Accounts)]
pub struct SwapNoToYes<'info> {
    #[account(mut)]
    pub trader: Signer<'info>,

    #[account(
        mut,
        seeds = [b"market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump,
        constraint = market.status == MarketStatus::Open @ YogenFlowError::MarketNotOpen,
        constraint = market.amm_seeded @ YogenFlowError::AmmNotSeeded,
    )]
    pub market: Account<'info, Market>,

    #[account(
        seeds = [b"protocol"],
        bump = protocol_config.bump,
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

    #[account(
        init_if_needed,
        payer = trader,
        space = 8 + Position::INIT_SPACE,
        seeds = [
            b"position",
            market.market_id.to_le_bytes().as_ref(),
            trader.key().as_ref(),
        ],
        bump,
    )]
    pub position: Account<'info, Position>,

    #[account(
        mut,
        token::mint = market.yes_mint,
        token::authority = trader,
    )]
    pub trader_yes_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = market.no_mint,
        token::authority = trader,
    )]
    pub trader_no_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        address = market.pool_yes_vault,
    )]
    pub pool_yes_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        address = market.pool_no_vault,
    )]
    pub pool_no_vault: Account<'info, TokenAccount>,

    /// Optional treasury NO token account for fee collection.
    /// If not provided, fees go into the pool (increasing k).
    #[account(mut)]
    pub treasury_no_account: Option<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
```

### Step 5.5 -- Update mod.rs and lib.rs

- [ ] Replace `yogenflow/programs/yogenflow/src/instructions/mod.rs`:

```rust
pub mod initialize_protocol;
pub mod create_market;
pub mod mint_outcome_tokens;
pub mod redeem_outcome_tokens;
pub mod seed_amm;
pub mod swap_yes_to_no;
pub mod swap_no_to_yes;

pub use initialize_protocol::*;
pub use create_market::*;
pub use mint_outcome_tokens::*;
pub use redeem_outcome_tokens::*;
pub use seed_amm::*;
pub use swap_yes_to_no::*;
pub use swap_no_to_yes::*;
```

- [ ] Add to `lib.rs` inside the `#[program]` module:

```rust
    pub fn swap_yes_to_no(ctx: Context<SwapYesToNo>, yes_in: u64) -> Result<()> {
        instructions::swap_yes_to_no::handler(ctx, yes_in)
    }

    pub fn swap_no_to_yes(ctx: Context<SwapNoToYes>, no_in: u64) -> Result<()> {
        instructions::swap_no_to_yes::handler(ctx, no_in)
    }
```

### Step 5.6 -- Build and run tests

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/yogenflow
anchor test
```

Expected: all 11 tests pass (2 init + 2 create_market + 2 mint/redeem + 2 seed_amm + 3 swap).

### Step 5.7 -- Git commit

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier
git add yogenflow/
git commit -m "feat: swap_yes_to_no and swap_no_to_yes AMM trading on YES/NO pair with fees and price clamping"
```

---

## Task 6: resolve_market Instruction (Fixed Pyth Integration)

**Files:**
- Create: `yogenflow/programs/yogenflow/src/instructions/resolve_market.rs`
- Modify: `yogenflow/programs/yogenflow/src/instructions/mod.rs`
- Modify: `yogenflow/programs/yogenflow/src/lib.rs`
- Test: `yogenflow/tests/yogenflow.ts`

### Step 6.1 -- Write the resolve test (TDD: expect fail)

- [ ] Add the following test block to `yogenflow/tests/yogenflow.ts`:

```typescript
  describe("resolve_market", () => {
    // Create a new market (id=1) with Authority resolution for testing.
    // Pyth resolution is tested on devnet. We also need a future-deadline market
    // so we create a special one with past deadline for resolution testing.
    const marketId = new anchor.BN(1);
    let marketPda: PublicKey;
    let yesMint: PublicKey;
    let noMint: PublicKey;
    let usdcVault: PublicKey;
    let poolYesVault: PublicKey;
    let poolNoVault: PublicKey;

    before(async () => {
      [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [yesMint] = PublicKey.findProgramAddressSync(
        [Buffer.from("yes_mint"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [noMint] = PublicKey.findProgramAddressSync(
        [Buffer.from("no_mint"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [usdcVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("usdc_vault"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [poolYesVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool_yes"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [poolNoVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool_no"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // We need to create the market with a deadline barely in the future,
      // then wait. For testing, we use a workaround: the localnet clock
      // may advance fast enough. Alternatively, set deadline to now + 2
      // and the test will pass since Clock::get() on localnet is approximate.
      //
      // Actually for testing we set it to now + 1 second. The test runs fast
      // enough that by the time resolve_market is called, the deadline has passed.
      const question = "Test resolution market";
      const resolutionValue = new anchor.BN(200_000_000);
      const resolutionDeadline = new anchor.BN(
        Math.floor(Date.now() / 1000) + 1 // 1 second from now
      );
      const oracleFeedId = Array.from(Buffer.alloc(32));
      const oracleFeedAccount = Keypair.generate().publicKey;

      // Create creator USDC account
      const creatorUsdcAccount = await createAccount(
        provider.connection,
        (authority as any).payer,
        usdcMint,
        authority.publicKey
      );
      await mintTo(
        provider.connection,
        (authority as any).payer,
        usdcMint,
        creatorUsdcAccount,
        authority.publicKey,
        100_000_000
      );

      await program.methods
        .createMarket(
          question,
          { authority: {} },
          oracleFeedId,
          oracleFeedAccount,
          resolutionValue,
          resolutionDeadline
        )
        .accountsStrict({
          creator: authority.publicKey,
          protocolConfig: protocolConfigPda,
          market: marketPda,
          yesMint: yesMint,
          noMint: noMint,
          usdcVault: usdcVault,
          poolYesVault: poolYesVault,
          poolNoVault: poolNoVault,
          usdcMint: usdcMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Wait for deadline to pass
      await new Promise((resolve) => setTimeout(resolve, 2000));
    });

    it("resolves a market with Authority resolution source", async () => {
      await program.methods
        .resolveMarket(true) // outcome = YES
        .accountsStrict({
          resolver: authority.publicKey,
          market: marketPda,
          oracleFeed: Keypair.generate().publicKey, // unused for Authority resolution
        })
        .rpc();

      const market = await program.account.market.fetch(marketPda);
      assert.deepEqual(market.status, { resolved: {} });
      assert.strictEqual(market.outcome, true);
    });

    it("fails to resolve an already resolved market", async () => {
      try {
        await program.methods
          .resolveMarket(true)
          .accountsStrict({
            resolver: authority.publicKey,
            market: marketPda,
            oracleFeed: Keypair.generate().publicKey,
          })
          .rpc();
        assert.fail("Should have thrown");
      } catch (err) {
        assert.ok(err.toString().includes("MarketAlreadyResolved"));
      }
    });
  });
```

### Step 6.2 -- Run test to verify it fails

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/yogenflow
anchor test
```

Expected: new tests fail because `resolveMarket` does not exist.

### Step 6.3 -- Implement resolve_market instruction

- [ ] Write `yogenflow/programs/yogenflow/src/instructions/resolve_market.rs`:

```rust
use anchor_lang::prelude::*;
use crate::errors::YogenFlowError;
use crate::state::{Market, MarketStatus, ResolutionSource};

/// Maximum age of Pyth price in seconds
const MAX_PRICE_AGE: u64 = 60;

pub fn handler(ctx: Context<ResolveMarket>, authority_outcome: bool) -> Result<()> {
    let market = &ctx.accounts.market;
    let clock = Clock::get()?;

    // Validations
    require!(
        market.status == MarketStatus::Open,
        YogenFlowError::MarketAlreadyResolved
    );
    require!(
        clock.unix_timestamp >= market.resolution_deadline,
        YogenFlowError::ResolutionTooEarly
    );

    let outcome: bool = match market.resolution_source {
        ResolutionSource::PythPrice => {
            resolve_with_pyth(&ctx, MAX_PRICE_AGE)?
        }
        ResolutionSource::Authority => {
            // Authority resolution: only market creator can resolve
            require!(
                ctx.accounts.resolver.key() == market.authority,
                YogenFlowError::InvalidOracleFeed
            );
            authority_outcome
        }
    };

    // Update market
    let market = &mut ctx.accounts.market;
    market.status = MarketStatus::Resolved;
    market.outcome = Some(outcome);

    msg!(
        "Market {} resolved. Outcome: {}",
        market.market_id,
        if outcome { "YES" } else { "NO" }
    );
    Ok(())
}

fn resolve_with_pyth(ctx: &Context<ResolveMarket>, max_age: u64) -> Result<bool> {
    use pyth_solana_receiver_sdk::price_update::PriceUpdateV2;

    let market = &ctx.accounts.market;

    // Validate oracle feed account matches what is stored in market
    require!(
        ctx.accounts.oracle_feed.key() == market.oracle_feed_account,
        YogenFlowError::InvalidOracleFeed
    );

    // Deserialize the Pyth price update account
    let oracle_account_info = &ctx.accounts.oracle_feed;
    let price_update = Account::<PriceUpdateV2>::try_from(oracle_account_info)?;

    let clock = Clock::get()?;

    // Use the feed ID stored in the market account
    let price_data = price_update.get_price_no_older_than(
        &clock,
        max_age,
        &market.oracle_feed_id,
    ).map_err(|_| error!(YogenFlowError::OraclePriceStale))?;

    let pyth_price = price_data.price;
    let exponent = price_data.exponent;
    let conf = price_data.conf;

    // Check confidence interval is reasonable (< 2% of price)
    if conf > 0 && pyth_price > 0 {
        let conf_pct = (conf as u128)
            .checked_mul(10000)
            .unwrap_or(u128::MAX)
            .checked_div(pyth_price as u128)
            .unwrap_or(0);
        require!(conf_pct < 200, YogenFlowError::OracleConfidenceTooWide);
    }

    // Normalize to 6 decimals for comparison
    // resolution_value is in 6-decimal format (e.g., 200_000_000 = $200)
    // Pyth price is pyth_price * 10^exponent
    // We need: pyth_price * 10^exponent * 10^6
    let normalized: i128 = if exponent >= 0 {
        (pyth_price as i128)
            .checked_mul(10i128.pow(exponent as u32))
            .ok_or(YogenFlowError::MathOverflow)?
            .checked_mul(1_000_000)
            .ok_or(YogenFlowError::MathOverflow)?
    } else {
        let abs_exp = (-exponent) as u32;
        if abs_exp <= 6 {
            (pyth_price as i128)
                .checked_mul(10i128.pow(6 - abs_exp))
                .ok_or(YogenFlowError::MathOverflow)?
        } else {
            (pyth_price as i128)
                .checked_div(10i128.pow(abs_exp - 6))
                .ok_or(YogenFlowError::MathOverflow)?
        }
    };

    // Compare: is the actual price above the resolution threshold?
    Ok(normalized > market.resolution_value as i128)
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(mut)]
    pub resolver: Signer<'info>,

    #[account(
        mut,
        seeds = [b"market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump,
        constraint = market.status == MarketStatus::Open @ YogenFlowError::MarketAlreadyResolved,
    )]
    pub market: Account<'info, Market>,

    /// For PythPrice resolution: must be a valid PriceUpdateV2 account matching
    /// market.oracle_feed_account. Validated in resolve_with_pyth().
    /// For Authority resolution: this is ignored (pass any pubkey).
    /// CHECK: Validated conditionally based on resolution_source.
    pub oracle_feed: UncheckedAccount<'info>,
}
```

### Step 6.4 -- Update mod.rs and lib.rs

- [ ] Replace `yogenflow/programs/yogenflow/src/instructions/mod.rs`:

```rust
pub mod initialize_protocol;
pub mod create_market;
pub mod mint_outcome_tokens;
pub mod redeem_outcome_tokens;
pub mod seed_amm;
pub mod swap_yes_to_no;
pub mod swap_no_to_yes;
pub mod resolve_market;

pub use initialize_protocol::*;
pub use create_market::*;
pub use mint_outcome_tokens::*;
pub use redeem_outcome_tokens::*;
pub use seed_amm::*;
pub use swap_yes_to_no::*;
pub use swap_no_to_yes::*;
pub use resolve_market::*;
```

- [ ] Add to `lib.rs` inside the `#[program]` module:

```rust
    pub fn resolve_market(ctx: Context<ResolveMarket>, authority_outcome: bool) -> Result<()> {
        instructions::resolve_market::handler(ctx, authority_outcome)
    }
```

### Step 6.5 -- Build and run tests

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/yogenflow
anchor test
```

Expected: all tests pass including resolve_market tests.

### Step 6.6 -- Git commit

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier
git add yogenflow/
git commit -m "feat: resolve_market with fixed Pyth feed ID validation and Authority resolution"
```

---

## Task 7: claim_payout Instruction

**Files:**
- Create: `yogenflow/programs/yogenflow/src/instructions/claim_payout.rs`
- Modify: `yogenflow/programs/yogenflow/src/instructions/mod.rs`
- Modify: `yogenflow/programs/yogenflow/src/lib.rs`
- Test: `yogenflow/tests/yogenflow.ts`

Payout model: After resolution, winning tokens redeem 1:1 from the USDC vault. The position account is closed after claim (rent returned to trader).

### Step 7.1 -- Write the claim test (TDD: expect fail)

- [ ] Add the following test block to `yogenflow/tests/yogenflow.ts`:

```typescript
  describe("claim_payout", () => {
    // Create a new market (id=2), mint tokens, seed AMM, trade, resolve, claim
    const marketId = new anchor.BN(2);
    let marketPda: PublicKey;
    let yesMint: PublicKey;
    let noMint: PublicKey;
    let usdcVault: PublicKey;
    let poolYesVault: PublicKey;
    let poolNoVault: PublicKey;
    let claimerKeypair: Keypair;
    let claimerUsdcAccount: PublicKey;
    let claimerYesAccount: PublicKey;
    let claimerNoAccount: PublicKey;

    before(async () => {
      [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [yesMint] = PublicKey.findProgramAddressSync(
        [Buffer.from("yes_mint"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [noMint] = PublicKey.findProgramAddressSync(
        [Buffer.from("no_mint"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [usdcVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("usdc_vault"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [poolYesVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool_yes"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [poolNoVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool_no"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Create creator USDC account
      const creatorUsdcAccount = await createAccount(
        provider.connection,
        (authority as any).payer,
        usdcMint,
        authority.publicKey
      );
      await mintTo(
        provider.connection,
        (authority as any).payer,
        usdcMint,
        creatorUsdcAccount,
        authority.publicKey,
        100_000_000
      );

      // Create market with deadline now + 1s
      await program.methods
        .createMarket(
          "Claim test market",
          { authority: {} },
          Array.from(Buffer.alloc(32)),
          Keypair.generate().publicKey,
          new anchor.BN(200_000_000),
          new anchor.BN(Math.floor(Date.now() / 1000) + 1)
        )
        .accountsStrict({
          creator: authority.publicKey,
          protocolConfig: protocolConfigPda,
          market: marketPda,
          yesMint: yesMint,
          noMint: noMint,
          usdcVault: usdcVault,
          poolYesVault: poolYesVault,
          poolNoVault: poolNoVault,
          usdcMint: usdcMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Create claimer and fund
      claimerKeypair = Keypair.generate();
      const airdropSig = await provider.connection.requestAirdrop(
        claimerKeypair.publicKey,
        2 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig);

      claimerUsdcAccount = await createAccount(
        provider.connection,
        claimerKeypair,
        usdcMint,
        claimerKeypair.publicKey
      );
      await mintTo(
        provider.connection,
        (authority as any).payer,
        usdcMint,
        claimerUsdcAccount,
        authority.publicKey,
        20_000_000
      );

      claimerYesAccount = await createAccount(
        provider.connection,
        claimerKeypair,
        yesMint,
        claimerKeypair.publicKey
      );
      claimerNoAccount = await createAccount(
        provider.connection,
        claimerKeypair,
        noMint,
        claimerKeypair.publicKey
      );

      // Claimer mints outcome tokens
      await program.methods
        .mintOutcomeTokens(new anchor.BN(10_000_000))
        .accountsStrict({
          user: claimerKeypair.publicKey,
          market: marketPda,
          userUsdcAccount: claimerUsdcAccount,
          userYesAccount: claimerYesAccount,
          userNoAccount: claimerNoAccount,
          usdcVault: usdcVault,
          yesMint: yesMint,
          noMint: noMint,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([claimerKeypair])
        .rpc();

      // Wait for deadline, then resolve as YES
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await program.methods
        .resolveMarket(true) // YES wins
        .accountsStrict({
          resolver: authority.publicKey,
          market: marketPda,
          oracleFeed: Keypair.generate().publicKey,
        })
        .rpc();
    });

    it("claims payout for winning YES tokens (1:1 from vault)", async () => {
      const [positionPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("position"),
          marketId.toArrayLike(Buffer, "le", 8),
          claimerKeypair.publicKey.toBuffer(),
        ],
        program.programId
      );

      // Create position first (it was not created by swap, only by mint)
      // The claimer has 10 YES + 10 NO from minting, no position yet
      // We need to init the position in the claim instruction

      const usdcBefore = await getAccount(provider.connection, claimerUsdcAccount);
      const yesBefore = await getAccount(provider.connection, claimerYesAccount);
      assert.ok(Number(yesBefore.amount) > 0, "Should have YES tokens before claim");

      await program.methods
        .claimPayout()
        .accountsStrict({
          trader: claimerKeypair.publicKey,
          market: marketPda,
          position: positionPda,
          traderUsdcAccount: claimerUsdcAccount,
          traderYesAccount: claimerYesAccount,
          traderNoAccount: claimerNoAccount,
          usdcVault: usdcVault,
          yesMint: yesMint,
          noMint: noMint,
          treasuryUsdcAccount: treasuryTokenAccount,
          protocolConfig: protocolConfigPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          agent: null,
        })
        .signers([claimerKeypair])
        .rpc();

      const usdcAfter = await getAccount(provider.connection, claimerUsdcAccount);
      assert.ok(Number(usdcAfter.amount) > Number(usdcBefore.amount), "Should receive USDC payout");

      // YES tokens should be burned
      const yesAfter = await getAccount(provider.connection, claimerYesAccount);
      assert.equal(Number(yesAfter.amount), 0, "YES tokens should be burned");

      // Position account should be closed
      try {
        await program.account.position.fetch(positionPda);
        assert.fail("Position should be closed");
      } catch (err) {
        assert.ok(err.toString().includes("Account does not exist"));
      }
    });
  });
```

### Step 7.2 -- Run test to verify it fails

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/yogenflow
anchor test
```

Expected: fails because `claimPayout` does not exist.

### Step 7.3 -- Implement claim_payout instruction

- [ ] Write `yogenflow/programs/yogenflow/src/instructions/claim_payout.rs`:

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer};
use crate::errors::YogenFlowError;
use crate::state::{Agent, Market, MarketStatus, Position, ProtocolConfig};

pub fn handler(ctx: Context<ClaimPayout>) -> Result<()> {
    let market = &ctx.accounts.market;

    // Validations
    require!(
        market.status == MarketStatus::Resolved,
        YogenFlowError::MarketNotResolved
    );
    let outcome = market.outcome.ok_or(YogenFlowError::MarketNotResolved)?;

    // Read token balances from trader's accounts
    let yes_balance = ctx.accounts.trader_yes_account.amount;
    let no_balance = ctx.accounts.trader_no_account.amount;

    // Determine winning token amount
    let winning_amount = if outcome {
        yes_balance
    } else {
        no_balance
    };

    require!(winning_amount > 0, YogenFlowError::NoWinningTokens);

    // Calculate protocol fee on payout (from protocol config)
    let config = &ctx.accounts.protocol_config;
    let fee = winning_amount
        .checked_mul(config.fee_bps as u64)
        .ok_or(YogenFlowError::MathOverflow)?
        .checked_div(10000)
        .ok_or(YogenFlowError::MathOverflow)?;
    let net_payout = winning_amount
        .checked_sub(fee)
        .ok_or(YogenFlowError::MathOverflow)?;

    // Burn ALL YES tokens from trader
    if yes_balance > 0 {
        let burn_yes = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.yes_mint.to_account_info(),
                from: ctx.accounts.trader_yes_account.to_account_info(),
                authority: ctx.accounts.trader.to_account_info(),
            },
        );
        token::burn(burn_yes, yes_balance)?;
    }

    // Burn ALL NO tokens from trader
    if no_balance > 0 {
        let burn_no = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.no_mint.to_account_info(),
                from: ctx.accounts.trader_no_account.to_account_info(),
                authority: ctx.accounts.trader.to_account_info(),
            },
        );
        token::burn(burn_no, no_balance)?;
    }

    // Transfer net payout USDC from vault to trader (market PDA signs)
    let market_id_bytes = market.market_id.to_le_bytes();
    let market_seeds: &[&[u8]] = &[
        b"market",
        market_id_bytes.as_ref(),
        &[market.bump],
    ];
    let signer_seeds = &[market_seeds];

    let transfer_payout = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.usdc_vault.to_account_info(),
            to: ctx.accounts.trader_usdc_account.to_account_info(),
            authority: ctx.accounts.market.to_account_info(),
        },
        signer_seeds,
    );
    token::transfer(transfer_payout, net_payout)?;

    // Transfer fee to treasury
    if fee > 0 {
        let fee_transfer = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.usdc_vault.to_account_info(),
                to: ctx.accounts.treasury_usdc_account.to_account_info(),
                authority: ctx.accounts.market.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(fee_transfer, fee)?;
    }

    // Calculate P&L for agent stats
    let position = &ctx.accounts.position;
    let total_cost = position
        .yes_cost_basis
        .checked_add(position.no_cost_basis)
        .unwrap_or(0);
    let profit: i64 = (net_payout as i64)
        .checked_sub(total_cost as i64)
        .unwrap_or(0);
    let won = profit >= 0;

    // Update agent stats if an agent account is provided
    if let Some(agent) = &mut ctx.accounts.agent {
        agent.total_markets_traded = agent
            .total_markets_traded
            .checked_add(1)
            .ok_or(YogenFlowError::MathOverflow)?;
        agent.total_volume = agent
            .total_volume
            .checked_add(total_cost)
            .ok_or(YogenFlowError::MathOverflow)?;
        agent.total_profit = agent
            .total_profit
            .checked_add(profit)
            .ok_or(YogenFlowError::MathOverflow)?;

        if won {
            agent.wins = agent
                .wins
                .checked_add(1)
                .ok_or(YogenFlowError::MathOverflow)?;
        } else {
            agent.losses = agent
                .losses
                .checked_add(1)
                .ok_or(YogenFlowError::MathOverflow)?;
        }

        // Recalculate accuracy
        let total_resolved = agent.wins + agent.losses;
        if total_resolved > 0 {
            agent.accuracy_bps = ((agent.wins as u128)
                .checked_mul(10000)
                .ok_or(YogenFlowError::MathOverflow)?
                .checked_div(total_resolved as u128)
                .ok_or(YogenFlowError::MathOverflow)?) as u16;
        }

        agent.last_active = Clock::get()?.unix_timestamp;
    }

    // Position account is closed by the `close = trader` constraint
    msg!(
        "claim_payout: market {}, payout {} USDC (fee {}), profit {}",
        market.market_id,
        net_payout,
        fee,
        profit
    );
    Ok(())
}

#[derive(Accounts)]
pub struct ClaimPayout<'info> {
    #[account(mut)]
    pub trader: Signer<'info>,

    #[account(
        seeds = [b"market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump,
        constraint = market.status == MarketStatus::Resolved @ YogenFlowError::MarketNotResolved,
    )]
    pub market: Account<'info, Market>,

    /// Position account -- closed after claim (rent returned to trader)
    #[account(
        mut,
        close = trader,
        seeds = [
            b"position",
            market.market_id.to_le_bytes().as_ref(),
            trader.key().as_ref(),
        ],
        bump = position.bump,
    )]
    pub position: Account<'info, Position>,

    #[account(
        mut,
        token::authority = trader,
    )]
    pub trader_usdc_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = yes_mint,
        token::authority = trader,
    )]
    pub trader_yes_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = no_mint,
        token::authority = trader,
    )]
    pub trader_no_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        address = market.usdc_vault,
    )]
    pub usdc_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        address = market.yes_mint,
    )]
    pub yes_mint: Account<'info, Mint>,

    #[account(
        mut,
        address = market.no_mint,
    )]
    pub no_mint: Account<'info, Mint>,

    #[account(
        mut,
        address = protocol_config.treasury,
    )]
    pub treasury_usdc_account: Account<'info, TokenAccount>,

    #[account(
        seeds = [b"protocol"],
        bump = protocol_config.bump,
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,

    /// Optional agent account for stat tracking.
    /// If provided, must be the agent PDA for this trader.
    #[account(
        mut,
        seeds = [b"agent", trader.key().as_ref()],
        bump = agent.bump,
        constraint = agent.wallet == trader.key(),
    )]
    pub agent: Option<Account<'info, Agent>>,
}
```

> **Note about claim_payout and position:** The `close = trader` constraint on position means the position account is closed and rent is returned to the trader after claim. This means claim_payout can only be called once per position. If the trader has no position PDA (e.g., they only minted tokens and never swapped), the instruction requires the position PDA to exist. For the hackathon, we require that the trader has a position. If they only minted, they need to swap at least once (which creates a position via init_if_needed), or we handle the "no position" case by requiring them to create a position first. For MVP, all traders who want to claim must have a position.

### Step 7.4 -- Update mod.rs and lib.rs

- [ ] Replace `yogenflow/programs/yogenflow/src/instructions/mod.rs`:

```rust
pub mod initialize_protocol;
pub mod create_market;
pub mod mint_outcome_tokens;
pub mod redeem_outcome_tokens;
pub mod seed_amm;
pub mod swap_yes_to_no;
pub mod swap_no_to_yes;
pub mod resolve_market;
pub mod claim_payout;

pub use initialize_protocol::*;
pub use create_market::*;
pub use mint_outcome_tokens::*;
pub use redeem_outcome_tokens::*;
pub use seed_amm::*;
pub use swap_yes_to_no::*;
pub use swap_no_to_yes::*;
pub use resolve_market::*;
pub use claim_payout::*;
```

- [ ] Add to `lib.rs` inside the `#[program]` module:

```rust
    pub fn claim_payout(ctx: Context<ClaimPayout>) -> Result<()> {
        instructions::claim_payout::handler(ctx)
    }
```

### Step 7.5 -- Build and run tests

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/yogenflow
anchor test
```

Expected: all tests pass including claim_payout. Position account is closed after claim.

> **Note:** If `agent: null` causes issues with Anchor's optional account parsing, pass the program ID as a sentinel value for the "none" case, or use `.accounts()` instead of `.accountsStrict()` and omit the field.

### Step 7.6 -- Git commit

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier
git add yogenflow/
git commit -m "feat: claim_payout with 1:1 USDC redemption, position closed, agent stats, protocol fee"
```

---

## Task 8: register_agent Instruction

**Files:**
- Create: `yogenflow/programs/yogenflow/src/instructions/register_agent.rs`
- Modify: `yogenflow/programs/yogenflow/src/instructions/mod.rs`
- Modify: `yogenflow/programs/yogenflow/src/lib.rs`
- Test: `yogenflow/tests/yogenflow.ts`

> **Note:** deregister_agent is removed from MVP to avoid complexity with open position tracking. Agents register and their stake stays. Deregistration is Phase 2.

### Step 8.1 -- Write the agent test (TDD: expect fail)

- [ ] Add the following test block to `yogenflow/tests/yogenflow.ts`:

```typescript
  describe("register_agent", () => {
    let agentKeypair: Keypair;
    let agentPda: PublicKey;
    let agentUsdcAccount: PublicKey;
    let stakeTreasury: PublicKey;

    before(async () => {
      agentKeypair = Keypair.generate();
      const airdropSig = await provider.connection.requestAirdrop(
        agentKeypair.publicKey,
        2 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig);

      [agentPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent"), agentKeypair.publicKey.toBuffer()],
        program.programId
      );

      agentUsdcAccount = await createAccount(
        provider.connection,
        agentKeypair,
        usdcMint,
        agentKeypair.publicKey
      );
      await mintTo(
        provider.connection,
        (authority as any).payer,
        usdcMint,
        agentUsdcAccount,
        authority.publicKey,
        50_000_000 // 50 USDC
      );

      // Derive stake vault
      [stakeTreasury] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent_stake"), agentKeypair.publicKey.toBuffer()],
        program.programId
      );
    });

    it("registers an agent with USDC stake", async () => {
      const name = "TestAgent-Alpha";

      await program.methods
        .registerAgent(name)
        .accountsStrict({
          wallet: agentKeypair.publicKey,
          agent: agentPda,
          protocolConfig: protocolConfigPda,
          walletUsdcAccount: agentUsdcAccount,
          stakeVault: stakeTreasury,
          usdcMint: usdcMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([agentKeypair])
        .rpc();

      const agent = await program.account.agent.fetch(agentPda);
      assert.ok(agent.wallet.equals(agentKeypair.publicKey));
      assert.equal(agent.name, name);
      assert.ok(agent.registrationStake.eq(new anchor.BN(10_000_000)));
      assert.ok(agent.totalMarketsTraded.eq(new anchor.BN(0)));
      assert.ok(agent.wins.eq(new anchor.BN(0)));
      assert.ok(agent.losses.eq(new anchor.BN(0)));
    });

    it("fails to register the same agent twice", async () => {
      try {
        await program.methods
          .registerAgent("Duplicate")
          .accountsStrict({
            wallet: agentKeypair.publicKey,
            agent: agentPda,
            protocolConfig: protocolConfigPda,
            walletUsdcAccount: agentUsdcAccount,
            stakeVault: stakeTreasury,
            usdcMint: usdcMint,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([agentKeypair])
          .rpc();
        assert.fail("Should have thrown");
      } catch (err) {
        assert.ok(err);
      }
    });
  });
```

### Step 8.2 -- Run test to verify it fails

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/yogenflow
anchor test
```

Expected: fails because `registerAgent` does not exist.

### Step 8.3 -- Implement register_agent instruction

- [ ] Write `yogenflow/programs/yogenflow/src/instructions/register_agent.rs`:

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use crate::errors::YogenFlowError;
use crate::state::{Agent, ProtocolConfig};

pub fn handler(ctx: Context<RegisterAgent>, name: String) -> Result<()> {
    require!(name.len() <= 32, YogenFlowError::NameTooLong);

    let config = &ctx.accounts.protocol_config;
    let stake_amount = config.registration_stake;
    let clock = Clock::get()?;

    // Transfer stake from wallet to stake vault
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.wallet_usdc_account.to_account_info(),
            to: ctx.accounts.stake_vault.to_account_info(),
            authority: ctx.accounts.wallet.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, stake_amount)?;

    // Initialize agent PDA
    let agent = &mut ctx.accounts.agent;
    agent.wallet = ctx.accounts.wallet.key();
    agent.name = name;
    agent.registration_stake = stake_amount;
    agent.total_markets_traded = 0;
    agent.total_markets_created = 0;
    agent.wins = 0;
    agent.losses = 0;
    agent.total_profit = 0;
    agent.total_volume = 0;
    agent.accuracy_bps = 0;
    agent.created_at = clock.unix_timestamp;
    agent.last_active = clock.unix_timestamp;
    agent.bump = ctx.bumps.agent;

    msg!("Agent registered: {}", agent.name);
    Ok(())
}

#[derive(Accounts)]
pub struct RegisterAgent<'info> {
    #[account(mut)]
    pub wallet: Signer<'info>,

    #[account(
        init,
        payer = wallet,
        space = 8 + Agent::INIT_SPACE,
        seeds = [b"agent", wallet.key().as_ref()],
        bump,
    )]
    pub agent: Account<'info, Agent>,

    #[account(
        seeds = [b"protocol"],
        bump = protocol_config.bump,
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = wallet,
    )]
    pub wallet_usdc_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = wallet,
        token::mint = usdc_mint,
        token::authority = agent,
        seeds = [b"agent_stake", wallet.key().as_ref()],
        bump,
    )]
    pub stake_vault: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
```

### Step 8.4 -- Update mod.rs and lib.rs

- [ ] Replace `yogenflow/programs/yogenflow/src/instructions/mod.rs`:

```rust
pub mod initialize_protocol;
pub mod create_market;
pub mod mint_outcome_tokens;
pub mod redeem_outcome_tokens;
pub mod seed_amm;
pub mod swap_yes_to_no;
pub mod swap_no_to_yes;
pub mod resolve_market;
pub mod claim_payout;
pub mod register_agent;

pub use initialize_protocol::*;
pub use create_market::*;
pub use mint_outcome_tokens::*;
pub use redeem_outcome_tokens::*;
pub use seed_amm::*;
pub use swap_yes_to_no::*;
pub use swap_no_to_yes::*;
pub use resolve_market::*;
pub use claim_payout::*;
pub use register_agent::*;
```

- [ ] Add to `lib.rs` inside the `#[program]` module:

```rust
    pub fn register_agent(ctx: Context<RegisterAgent>, name: String) -> Result<()> {
        instructions::register_agent::handler(ctx, name)
    }
```

### Step 8.5 -- Build and run tests

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/yogenflow
anchor test
```

Expected: all tests pass including agent registration.

### Step 8.6 -- Git commit

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier
git add yogenflow/
git commit -m "feat: register_agent instruction with USDC staking (no deregister in MVP)"
```

---

## Task 9: Integration Test (Full Lifecycle)

**Files:**
- Create: `yogenflow/tests/integration.ts`

Uses a separate `describe` block with its own protocol initialization to avoid conflicts with unit tests. Uses market_id 100 (separate from unit test markets 0-2).

### Step 9.1 -- Write the full lifecycle integration test

- [ ] Create `yogenflow/tests/integration.ts`:

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Yogenflow } from "../target/types/yogenflow";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { assert } from "chai";

describe("yogenflow - full lifecycle integration", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.yogenflow as Program<Yogenflow>;
  const admin = provider.wallet as anchor.Wallet;

  let usdcMint: PublicKey;
  let treasuryAccount: PublicKey;
  let protocolConfigPda: PublicKey;

  // Agent
  let agentKeypair: Keypair;
  let agentPda: PublicKey;
  let agentUsdcAccount: PublicKey;
  let agentStakeVault: PublicKey;
  let agentYesAccount: PublicKey;
  let agentNoAccount: PublicKey;

  // Market (use id 100 to avoid conflict with unit tests)
  const marketId = new anchor.BN(0); // First market in this describe block
  let marketPda: PublicKey;
  let yesMint: PublicKey;
  let noMint: PublicKey;
  let usdcVault: PublicKey;
  let poolYesVault: PublicKey;
  let poolNoVault: PublicKey;

  // Admin USDC for market creation
  let adminUsdcAccount: PublicKey;
  let adminYesAccount: PublicKey;
  let adminNoAccount: PublicKey;

  it("Step 1: Initialize protocol", async () => {
    [protocolConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("protocol")],
      program.programId
    );

    usdcMint = await createMint(
      provider.connection,
      (admin as any).payer,
      admin.publicKey,
      null,
      6
    );

    treasuryAccount = await createAccount(
      provider.connection,
      (admin as any).payer,
      usdcMint,
      admin.publicKey
    );

    await program.methods
      .initializeProtocol(50, new anchor.BN(10_000_000), new anchor.BN(1_000_000), new anchor.BN(10_000_000))
      .accountsStrict({
        authority: admin.publicKey,
        protocolConfig: protocolConfigPda,
        treasury: treasuryAccount,
        usdcMint: usdcMint,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const config = await program.account.protocolConfig.fetch(protocolConfigPda);
    assert.equal(config.feeBps, 50);
    assert.ok(config.marketCount.eq(new anchor.BN(0)));
  });

  it("Step 2: Register agent", async () => {
    agentKeypair = Keypair.generate();
    const airdropSig = await provider.connection.requestAirdrop(
      agentKeypair.publicKey,
      5 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);

    [agentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), agentKeypair.publicKey.toBuffer()],
      program.programId
    );
    [agentStakeVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent_stake"), agentKeypair.publicKey.toBuffer()],
      program.programId
    );

    agentUsdcAccount = await createAccount(
      provider.connection,
      agentKeypair,
      usdcMint,
      agentKeypair.publicKey
    );
    await mintTo(
      provider.connection,
      (admin as any).payer,
      usdcMint,
      agentUsdcAccount,
      admin.publicKey,
      100_000_000 // 100 USDC
    );

    await program.methods
      .registerAgent("IntegrationTestBot")
      .accountsStrict({
        wallet: agentKeypair.publicKey,
        agent: agentPda,
        protocolConfig: protocolConfigPda,
        walletUsdcAccount: agentUsdcAccount,
        stakeVault: agentStakeVault,
        usdcMint: usdcMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([agentKeypair])
      .rpc();

    const agent = await program.account.agent.fetch(agentPda);
    assert.equal(agent.name, "IntegrationTestBot");
    assert.ok(agent.registrationStake.eq(new anchor.BN(10_000_000)));
  });

  it("Step 3: Create market", async () => {
    [marketPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    [yesMint] = PublicKey.findProgramAddressSync(
      [Buffer.from("yes_mint"), marketId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    [noMint] = PublicKey.findProgramAddressSync(
      [Buffer.from("no_mint"), marketId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    [usdcVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("usdc_vault"), marketId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    [poolYesVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool_yes"), marketId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    [poolNoVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool_no"), marketId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    await program.methods
      .createMarket(
        "Will SOL > $200 on Apr 30?",
        { authority: {} },
        Array.from(Buffer.alloc(32)),
        Keypair.generate().publicKey,
        new anchor.BN(200_000_000),
        new anchor.BN(Math.floor(Date.now() / 1000) + 2) // 2s from now
      )
      .accountsStrict({
        creator: admin.publicKey,
        protocolConfig: protocolConfigPda,
        market: marketPda,
        yesMint: yesMint,
        noMint: noMint,
        usdcVault: usdcVault,
        poolYesVault: poolYesVault,
        poolNoVault: poolNoVault,
        usdcMint: usdcMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const market = await program.account.market.fetch(marketPda);
    assert.deepEqual(market.status, { open: {} });
    assert.equal(market.totalMinted.toNumber(), 0);
    assert.equal(market.ammSeeded, false);
  });

  it("Step 4: Admin mints outcome tokens and seeds AMM", async () => {
    adminUsdcAccount = await createAccount(
      provider.connection,
      (admin as any).payer,
      usdcMint,
      admin.publicKey
    );
    await mintTo(
      provider.connection,
      (admin as any).payer,
      usdcMint,
      adminUsdcAccount,
      admin.publicKey,
      50_000_000
    );

    adminYesAccount = await createAccount(
      provider.connection,
      (admin as any).payer,
      yesMint,
      admin.publicKey
    );
    adminNoAccount = await createAccount(
      provider.connection,
      (admin as any).payer,
      noMint,
      admin.publicKey
    );

    // Mint 20 USDC -> 20 YES + 20 NO
    await program.methods
      .mintOutcomeTokens(new anchor.BN(20_000_000))
      .accountsStrict({
        user: admin.publicKey,
        market: marketPda,
        userUsdcAccount: adminUsdcAccount,
        userYesAccount: adminYesAccount,
        userNoAccount: adminNoAccount,
        usdcVault: usdcVault,
        yesMint: yesMint,
        noMint: noMint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    // Seed AMM with 20 YES + 20 NO
    await program.methods
      .seedAmm(new anchor.BN(20_000_000))
      .accountsStrict({
        seeder: admin.publicKey,
        market: marketPda,
        protocolConfig: protocolConfigPda,
        seederYesAccount: adminYesAccount,
        seederNoAccount: adminNoAccount,
        poolYesVault: poolYesVault,
        poolNoVault: poolNoVault,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const market = await program.account.market.fetch(marketPda);
    assert.equal(market.ammSeeded, true);
    assert.equal(market.totalMinted.toNumber(), 20_000_000);

    const poolYes = await getAccount(provider.connection, poolYesVault);
    const poolNo = await getAccount(provider.connection, poolNoVault);
    assert.equal(Number(poolYes.amount), 20_000_000);
    assert.equal(Number(poolNo.amount), 20_000_000);
  });

  it("Step 5: Agent mints tokens and swaps YES->NO (bets NO)", async () => {
    agentYesAccount = await createAccount(
      provider.connection,
      agentKeypair,
      yesMint,
      agentKeypair.publicKey
    );
    agentNoAccount = await createAccount(
      provider.connection,
      agentKeypair,
      noMint,
      agentKeypair.publicKey
    );

    // Agent mints 10 USDC -> 10 YES + 10 NO
    await program.methods
      .mintOutcomeTokens(new anchor.BN(10_000_000))
      .accountsStrict({
        user: agentKeypair.publicKey,
        market: marketPda,
        userUsdcAccount: agentUsdcAccount,
        userYesAccount: agentYesAccount,
        userNoAccount: agentNoAccount,
        usdcVault: usdcVault,
        yesMint: yesMint,
        noMint: noMint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([agentKeypair])
      .rpc();

    // Agent swaps all YES for more NO
    const [positionPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("position"),
        marketId.toArrayLike(Buffer, "le", 8),
        agentKeypair.publicKey.toBuffer(),
      ],
      program.programId
    );

    await program.methods
      .swapYesToNo(new anchor.BN(10_000_000))
      .accountsStrict({
        trader: agentKeypair.publicKey,
        market: marketPda,
        protocolConfig: protocolConfigPda,
        position: positionPda,
        traderYesAccount: agentYesAccount,
        traderNoAccount: agentNoAccount,
        poolYesVault: poolYesVault,
        poolNoVault: poolNoVault,
        treasuryYesAccount: null,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([agentKeypair])
      .rpc();

    const noBalance = await getAccount(provider.connection, agentNoAccount);
    console.log(`Agent NO tokens after swap: ${Number(noBalance.amount) / 1_000_000}`);
    assert.ok(Number(noBalance.amount) > 10_000_000, "Agent should have more than 10 NO tokens");
  });

  it("Step 6: Resolve market as NO", async () => {
    // Wait for deadline to pass
    await new Promise((resolve) => setTimeout(resolve, 3000));

    await program.methods
      .resolveMarket(false) // NO wins
      .accountsStrict({
        resolver: admin.publicKey,
        market: marketPda,
        oracleFeed: Keypair.generate().publicKey,
      })
      .rpc();

    const market = await program.account.market.fetch(marketPda);
    assert.deepEqual(market.status, { resolved: {} });
    assert.strictEqual(market.outcome, false);
  });

  it("Step 7: Agent claims payout and stats are updated", async () => {
    const [positionPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("position"),
        marketId.toArrayLike(Buffer, "le", 8),
        agentKeypair.publicKey.toBuffer(),
      ],
      program.programId
    );

    const usdcBefore = await getAccount(provider.connection, agentUsdcAccount);

    await program.methods
      .claimPayout()
      .accountsStrict({
        trader: agentKeypair.publicKey,
        market: marketPda,
        position: positionPda,
        traderUsdcAccount: agentUsdcAccount,
        traderYesAccount: agentYesAccount,
        traderNoAccount: agentNoAccount,
        usdcVault: usdcVault,
        yesMint: yesMint,
        noMint: noMint,
        treasuryUsdcAccount: treasuryAccount,
        protocolConfig: protocolConfigPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        agent: agentPda,
      })
      .signers([agentKeypair])
      .rpc();

    const usdcAfter = await getAccount(provider.connection, agentUsdcAccount);
    assert.ok(
      Number(usdcAfter.amount) > Number(usdcBefore.amount),
      "Agent should receive USDC payout"
    );

    // Check agent stats
    const agent = await program.account.agent.fetch(agentPda);
    assert.ok(agent.totalMarketsTraded.eq(new anchor.BN(1)));
    assert.ok(agent.wins.eq(new anchor.BN(1)));
    assert.ok(agent.losses.eq(new anchor.BN(0)));
    assert.equal(agent.accuracyBps, 10000); // 100% accuracy
    assert.ok(agent.totalVolume.gt(new anchor.BN(0)));

    // Position account should be closed
    try {
      await program.account.position.fetch(positionPda);
      assert.fail("Position should be closed");
    } catch (err) {
      assert.ok(err.toString().includes("Account does not exist"));
    }
  });

  it("Step 8: Verify agent performance report", async () => {
    const agent = await program.account.agent.fetch(agentPda);

    console.log("\n--- Agent Performance Report ---");
    console.log(`Name: ${agent.name}`);
    console.log(`Markets Traded: ${agent.totalMarketsTraded.toNumber()}`);
    console.log(`Wins: ${agent.wins.toNumber()}`);
    console.log(`Losses: ${agent.losses.toNumber()}`);
    console.log(`Accuracy: ${agent.accuracyBps / 100}%`);
    console.log(`Total Volume: ${agent.totalVolume.toNumber() / 1_000_000} USDC`);
    console.log(`Total Profit: ${agent.totalProfit.toNumber() / 1_000_000} USDC`);
    console.log("--- End Report ---\n");

    assert.ok(agent.wins.toNumber() >= 1);
    assert.ok(agent.accuracyBps > 0);
  });
});
```

### Step 9.2 -- Run integration test

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/yogenflow
anchor test
```

Expected: all tests pass, including the full lifecycle integration test. The agent performance report prints to console.

### Step 9.3 -- Git commit

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier
git add yogenflow/
git commit -m "test: full lifecycle integration -- register, create, mint, seed, swap, resolve, claim"
```

---

## Task 10: Devnet Deployment

**Files:**
- Modify: `yogenflow/Anchor.toml`

### Step 10.1 -- Configure for devnet

- [ ] Update `yogenflow/Anchor.toml` to add a devnet section:

```toml
[toolchain]

[features]
resolution = true
skip-lint = false

[programs.localnet]
yogenflow = "YOUR_PROGRAM_ID"

[programs.devnet]
yogenflow = "YOUR_PROGRAM_ID"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "Localnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "npx ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
```

### Step 10.2 -- Switch to devnet and airdrop SOL

- [ ] Run:

```bash
solana config set --url devnet
solana airdrop 5
solana balance
```

Expected output:
```
Config File: ...
RPC URL: https://api.devnet.solana.com
...
5 SOL
```

### Step 10.3 -- Build for devnet

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/yogenflow
anchor build
```

### Step 10.4 -- Deploy to devnet

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/yogenflow
anchor deploy --provider.cluster devnet
```

Expected output:
```
Deploying cluster: https://api.devnet.solana.com
Upgrade authority: ...
Deploying program "yogenflow"...
Program Id: YOUR_PROGRAM_ID
Deploy success
```

Record the program ID for use in Plan B (SDK).

### Step 10.5 -- Verify deployment

- [ ] Run:

```bash
solana program show YOUR_PROGRAM_ID --url devnet
```

Expected: shows program info with the deployed program.

### Step 10.6 -- Run devnet smoke test

- [ ] Update `Anchor.toml` to set `cluster = "Devnet"` under `[provider]`, then run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/yogenflow
anchor test --skip-local-validator --provider.cluster devnet
```

> **Note:** Devnet tests may need adjustments for USDC mint (use devnet USDC or create a test mint on devnet). The integration test is designed to work with any SPL mint, so it should work by creating a new mint on devnet.

### Step 10.7 -- Git commit

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier
git add yogenflow/
git commit -m "deploy: yogenflow program deployed to devnet"
```

### Step 10.8 -- Record deployment info

Note the following for Plan B (SDK) and Plan C (Dashboard):
- **Program ID:** (from deploy output)
- **Network:** Devnet
- **IDL location:** `yogenflow/target/idl/yogenflow.json`
- **Type definitions:** `yogenflow/target/types/yogenflow.ts`

---

## Final lib.rs (Complete)

For reference, here is the complete `lib.rs` after all tasks:

```rust
use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("YOUR_PROGRAM_ID_HERE");

#[program]
pub mod yogenflow {
    use super::*;

    pub fn initialize_protocol(
        ctx: Context<InitializeProtocol>,
        fee_bps: u16,
        min_liquidity: u64,
        min_trade_size: u64,
        registration_stake: u64,
    ) -> Result<()> {
        instructions::initialize_protocol::handler(
            ctx,
            fee_bps,
            min_liquidity,
            min_trade_size,
            registration_stake,
        )
    }

    pub fn create_market(
        ctx: Context<CreateMarket>,
        question: String,
        resolution_source: state::ResolutionSource,
        oracle_feed_id: [u8; 32],
        oracle_feed_account: Pubkey,
        resolution_value: u64,
        resolution_deadline: i64,
    ) -> Result<()> {
        instructions::create_market::handler(
            ctx,
            question,
            resolution_source,
            oracle_feed_id,
            oracle_feed_account,
            resolution_value,
            resolution_deadline,
        )
    }

    pub fn mint_outcome_tokens(ctx: Context<MintOutcomeTokens>, amount: u64) -> Result<()> {
        instructions::mint_outcome_tokens::handler(ctx, amount)
    }

    pub fn redeem_outcome_tokens(ctx: Context<RedeemOutcomeTokens>, amount: u64) -> Result<()> {
        instructions::redeem_outcome_tokens::handler(ctx, amount)
    }

    pub fn seed_amm(ctx: Context<SeedAmm>, amount: u64) -> Result<()> {
        instructions::seed_amm::handler(ctx, amount)
    }

    pub fn swap_yes_to_no(ctx: Context<SwapYesToNo>, yes_in: u64) -> Result<()> {
        instructions::swap_yes_to_no::handler(ctx, yes_in)
    }

    pub fn swap_no_to_yes(ctx: Context<SwapNoToYes>, no_in: u64) -> Result<()> {
        instructions::swap_no_to_yes::handler(ctx, no_in)
    }

    pub fn resolve_market(ctx: Context<ResolveMarket>, authority_outcome: bool) -> Result<()> {
        instructions::resolve_market::handler(ctx, authority_outcome)
    }

    pub fn claim_payout(ctx: Context<ClaimPayout>) -> Result<()> {
        instructions::claim_payout::handler(ctx)
    }

    pub fn register_agent(ctx: Context<RegisterAgent>, name: String) -> Result<()> {
        instructions::register_agent::handler(ctx, name)
    }
}
```

---

## Summary: Complete File Tree After All Tasks

```
yogenflow/
+-- Anchor.toml
+-- Cargo.toml
+-- programs/
|   +-- yogenflow/
|       +-- Cargo.toml
|       +-- src/
|           +-- lib.rs
|           +-- errors.rs
|           +-- state/
|           |   +-- mod.rs
|           |   +-- protocol_config.rs
|           |   +-- market.rs
|           |   +-- agent.rs
|           |   +-- position.rs
|           +-- instructions/
|               +-- mod.rs
|               +-- initialize_protocol.rs
|               +-- create_market.rs
|               +-- mint_outcome_tokens.rs
|               +-- redeem_outcome_tokens.rs
|               +-- seed_amm.rs
|               +-- swap_yes_to_no.rs
|               +-- swap_no_to_yes.rs
|               +-- resolve_market.rs
|               +-- claim_payout.rs
|               +-- register_agent.rs
+-- tests/
|   +-- yogenflow.ts
|   +-- integration.ts
+-- target/
    +-- idl/yogenflow.json        (generated -- used by Plan B SDK)
    +-- types/yogenflow.ts        (generated -- used by Plan B SDK)
```

## Estimated Time Per Task

| Task | Description | Estimated Time |
|------|-------------|---------------|
| 0 | Environment setup | 1-2 hours (mostly install wait time) |
| 1 | ProtocolConfig + initialize_protocol | 1 hour |
| 2 | Market + create_market | 1.5 hours |
| 3 | mint_outcome_tokens + redeem_outcome_tokens | 1.5 hours |
| 4 | seed_amm | 1 hour |
| 5 | swap_yes_to_no + swap_no_to_yes | 2-3 hours |
| 6 | resolve_market (Pyth fix) | 1.5 hours |
| 7 | claim_payout (1:1 redemption, position closed) | 2 hours |
| 8 | register_agent (no deregister MVP) | 1 hour |
| 9 | Integration test | 1 hour |
| 10 | Devnet deployment | 1 hour |
| **Total** | | **~15-18 hours** (2-3 working days) |

## Key Design Decisions (From Code Review)

1. **Polymarket-style conditional tokens** replace the broken x*y=k USDC AMM. Vault always solvent.
2. **AMM operates on YES/NO pair** with real SPL tokens in pool vaults (not virtual numbers).
3. **Treasury validated as `Account<TokenAccount>`** (not UncheckedAccount).
4. **Pyth feed ID stored as `[u8; 32]`** in Market. Uses `get_price_no_older_than` with proper validation.
5. **Position closed after claim** (`close = trader`), returning rent.
6. **Split cost basis** into `yes_cost_basis` and `no_cost_basis` on Position.
7. **Deadline validation** in create_market: `resolution_deadline > clock.unix_timestamp`.
8. **No deregister_agent in MVP** -- simplifies open position tracking.
9. **Integration test uses separate describe block** to avoid PDA conflicts.
10. **`assert.strictEqual`** for `Option<bool>` assertions in tests.

## Handoff to Plan B

After this plan completes, Plan B (SDK + Agents) needs:
1. The program IDL at `yogenflow/target/idl/yogenflow.json`
2. The TypeScript types at `yogenflow/target/types/yogenflow.ts`
3. The devnet program ID
4. All PDA seed definitions (documented above in each instruction)
