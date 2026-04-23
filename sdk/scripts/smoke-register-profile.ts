// Smoke test: verify that register_profile works for a zero-USDC wallet
// after the v0.5.0 program upgrade. Proves the breaking account-struct
// change landed correctly on devnet.
//
// Generates a fresh in-memory keypair, airdrops a small amount of SOL
// (NOT USDC), calls sdk.registerProfile(), and reads the profile back.
//
// Usage:
//   cd sdk
//   npx tsx scripts/smoke-register-profile.ts
//
// Env overrides:
//   RPC_URL  — defaults to https://api.devnet.solana.com

import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { RitArena } from "../src/index";

const RPC_URL = process.env.RPC_URL ?? "https://api.devnet.solana.com";
const AIRDROP_SOL = 0.1;

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");
  const testKp = Keypair.generate();

  console.log("RPC:           ", RPC_URL);
  console.log("Test wallet:   ", testKp.publicKey.toBase58());
  console.log("USDC balance:  0 (this wallet was just generated)");
  console.log();

  console.log(`Requesting airdrop of ${AIRDROP_SOL} SOL...`);
  let airdropSig: string;
  try {
    airdropSig = await connection.requestAirdrop(
      testKp.publicKey,
      AIRDROP_SOL * LAMPORTS_PER_SOL
    );
  } catch (err) {
    console.error(
      "\n✗ Airdrop request failed (devnet faucet is often rate-limited)."
    );
    console.error("  Try running this script again in a minute, or manually");
    console.error(`  fund ${testKp.publicKey.toBase58()} with a few SOL on devnet.`);
    console.error("\n  Error:", err);
    process.exit(1);
  }
  await connection.confirmTransaction(airdropSig, "confirmed");

  const balance = await connection.getBalance(testKp.publicKey);
  console.log(`✓ Funded. Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
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

  console.log("Reading profile back...");
  const profile = await sdk.getProfile(testKp.publicKey);
  if (!profile) {
    console.error("\n✗ Profile PDA was not found after registration. Unexpected.");
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
}

main().catch((err) => {
  console.error("\n✗ Unexpected failure:", err);
  process.exit(1);
});
