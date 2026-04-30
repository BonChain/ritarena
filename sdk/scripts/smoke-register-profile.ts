// Smoke test: verify that register_profile works for a zero-USDC wallet
// after the v0.5.0 program upgrade. Proves the breaking account-struct
// change landed correctly on devnet.
//
// On first run: generates a fresh keypair, persists it to
//   /tmp/ritarena-smoke-keypair.json, tries an airdrop. If the airdrop
//   fails (devnet RPC faucet is often rate-limited), prints an exact
//   `solana transfer` command you can run from your own wallet and
//   exits. Re-run the script — it will reuse the persisted keypair.
// On later runs: reuses the persisted keypair. Delete the file to reset.
//
// Usage:
//   cd sdk
//   npx tsx scripts/smoke-register-profile.ts
//
// Env overrides:
//   RPC_URL              — defaults to https://api.devnet.solana.com
//   TEST_KEYPAIR_PATH    — override the persisted keypair path

import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import { RitArena } from "../src/index";

const RPC_URL = process.env.RPC_URL ?? "https://api.devnet.solana.com";
const KEYPAIR_PATH = process.env.TEST_KEYPAIR_PATH ?? "/tmp/ritarena-smoke-keypair.json";
const AIRDROP_SOL = 0.1;
const MIN_BALANCE_LAMPORTS = 0.005 * LAMPORTS_PER_SOL;

function loadOrCreateKeypair(): { kp: Keypair; wasNew: boolean } {
  if (existsSync(KEYPAIR_PATH)) {
    const secret = JSON.parse(readFileSync(KEYPAIR_PATH, "utf-8")) as number[];
    return { kp: Keypair.fromSecretKey(new Uint8Array(secret)), wasNew: false };
  }
  const kp = Keypair.generate();
  writeFileSync(KEYPAIR_PATH, JSON.stringify(Array.from(kp.secretKey)), "utf-8");
  return { kp, wasNew: true };
}

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");
  const { kp: testKp, wasNew } = loadOrCreateKeypair();

  console.log("RPC:           ", RPC_URL);
  console.log("Test wallet:   ", testKp.publicKey.toBase58());
  console.log("Keypair file:  ", KEYPAIR_PATH, wasNew ? "(newly generated)" : "(reused)");
  console.log();

  let balance = await connection.getBalance(testKp.publicKey);

  if (balance < MIN_BALANCE_LAMPORTS) {
    console.log(`Balance too low (${balance} lamports). Requesting airdrop of ${AIRDROP_SOL} SOL...`);
    try {
      const airdropSig = await connection.requestAirdrop(
        testKp.publicKey,
        AIRDROP_SOL * LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(airdropSig, "confirmed");
      balance = await connection.getBalance(testKp.publicKey);
      console.log(`✓ Airdrop succeeded. Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    } catch (err) {
      console.error("\n✗ Airdrop request failed (devnet faucet is often rate-limited).");
      console.error();
      console.error("  Fund this wallet from your own account and re-run the script:");
      console.error();
      console.error(
        `      solana transfer ${testKp.publicKey.toBase58()} 0.05 --url devnet --allow-unfunded-recipient`
      );
      console.error();
      console.error("  The keypair is saved at:");
      console.error(`      ${KEYPAIR_PATH}`);
      console.error();
      console.error("  Error was:", err);
      process.exit(1);
    }
  } else {
    console.log(`✓ Already funded. Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
  }
  console.log();

  const sdk = RitArena.fromKeypair(connection, testKp);
  const name = `smoke_test_${Date.now().toString(36)}`;

  console.log(`Calling registerProfile("${name}")...`);
  let registerSig: string;
  try {
    registerSig = await sdk.registerProfile(name);
  } catch (err) {
    console.error("\n✗ registerProfile failed.");
    console.error(
      "  If the error mentions missing accounts (ownerUsdc/treasuryUsdc/etc),"
    );
    console.error("  the on-chain program was NOT upgraded to v0.5.0 yet.");
    console.error("\n  Error:", err);
    process.exit(1);
  }
  console.log("✓ register_profile tx:", registerSig);
  console.log();

  console.log("Reading profile back (with retry — devnet can lag)...");
  let profile = null;
  for (let i = 0; i < 6; i++) {
    profile = await sdk.getProfile(testKp.publicKey);
    if (profile) break;
    await new Promise((r) => setTimeout(r, 1500));
    process.stdout.write(".");
  }
  console.log();
  if (!profile) {
    console.error("\n✗ Profile PDA not found after 9 seconds of retries.");
    console.error(
      `  The registration tx succeeded (${registerSig}), so the account`
    );
    console.error("  should exist on-chain. Check the explorer manually:");
    console.error(
      `      https://explorer.solana.com/tx/${registerSig}?cluster=devnet`
    );
    console.error("  If the tx is green, this is a read-side issue with your RPC node.");
    process.exit(1);
  }
  console.log("✓ Profile found:");
  console.log("    owner:         ", profile.owner.toBase58());
  console.log("    name:          ", profile.name);
  console.log("    registeredAt:  ", new Date(Number(profile.registeredAt) * 1000).toISOString());

  if (profile.name !== name) {
    console.error(`\n✗ Name mismatch: expected "${name}", got "${profile.name}"`);
    process.exit(1);
  }

  const afterBalance = await connection.getBalance(testKp.publicKey);
  const lamportsSpent = balance - afterBalance;
  console.log();
  console.log(`Lamports spent: ${lamportsSpent} (${lamportsSpent / LAMPORTS_PER_SOL} SOL)`);
  console.log("→ SOL was spent on rent + tx fees only. No USDC was required.");
  console.log();
  console.log("✓ v0.5.0 upgrade verified on devnet.");

  // Clean up the persisted keypair so a re-run generates a fresh wallet
  // (this wallet has now registered a profile — can't register twice).
  try {
    unlinkSync(KEYPAIR_PATH);
    console.log(`Cleaned up ${KEYPAIR_PATH}.`);
  } catch {
    /* ignore */
  }
}

main().catch((err) => {
  console.error("\n✗ Unexpected failure:", err);
  process.exit(1);
});
