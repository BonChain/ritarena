// games/snake/src/ritarena_sdk/setup-devnet.ts

import {
  Connection, Keypair, LAMPORTS_PER_SOL,
  SystemProgram, Transaction, sendAndConfirmTransaction,
} from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { RitArena, MAX_TEST_USDC_PER_CALL } from "@ritarena/sdk";
import { createHash } from "crypto";
import * as fs from "fs";
import * as path from "path";

const RPC_URL = "https://api.devnet.solana.com";
const BOT_COUNT = 8;
const SOL_PER_BOT = 0.05;
const USDC_PER_BOT = 15_000_000; // 15 USDC (5 registration + 5 entry + 5 buffer)

function loadKeypair(): Keypair {
  const keypairPath = path.join(
    process.env.HOME || "~",
    ".config/solana/id.json"
  );
  const secret = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

function deriveBotKeypair(master: Keypair, index: number): Keypair {
  const seed = createHash("sha256")
    .update(Buffer.from(master.secretKey))
    .update(Buffer.from([index]))
    .digest();
  return Keypair.fromSeed(seed.slice(0, 32));
}

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");
  const master = loadKeypair();

  console.log("Master wallet:", master.publicKey.toBase58());

  // Check master SOL balance
  const balance = await connection.getBalance(master.publicKey);
  const needed = BOT_COUNT * SOL_PER_BOT * LAMPORTS_PER_SOL + 0.1 * LAMPORTS_PER_SOL;
  console.log(`Master SOL balance: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);

  if (balance < needed) {
    console.log(`\nNeed ~${(needed / LAMPORTS_PER_SOL).toFixed(2)} SOL total.`);
    console.log("Fund your master wallet first:");
    console.log("  Option 1: solana airdrop 2  (may be rate-limited)");
    console.log("  Option 2: https://faucet.solana.com  (paste your address)");
    console.log(`\nMaster address: ${master.publicKey.toBase58()}`);
    process.exit(1);
  }

  // Get USDC mint from protocol config
  const sdk = RitArena.fromKeypair(connection, master);
  const protocol = await sdk.getProtocol();
  if (!protocol) {
    console.log("\nProtocol not initialized. Run the SDK test-devnet.ts first:");
    console.log("  cd sdk && npx tsx scripts/test-devnet.ts");
    process.exit(1);
  }

  const usdcMint = protocol.usdcMint;
  console.log(`USDC mint: ${usdcMint.toBase58()}`);

  // Ensure master has enough USDC (master is mint authority for test USDC)
  const masterAta = await getOrCreateAssociatedTokenAccount(
    connection, master, usdcMint, master.publicKey
  );
  const masterUsdcBalance = Number(masterAta.amount);
  const totalUsdcNeeded = BOT_COUNT * USDC_PER_BOT;

  if (masterUsdcBalance < totalUsdcNeeded) {
    console.log(`\nMinting test USDC to master wallet via faucet...`);
    const totalToMint = totalUsdcNeeded - masterUsdcBalance + 50_000_000; // extra buffer
    let remaining = totalToMint;
    while (remaining > 0) {
      const amount = Math.min(remaining, MAX_TEST_USDC_PER_CALL);
      await sdk.mintTestUsdc(amount, master.publicKey);
      remaining -= amount;
    }
    console.log(`  Minted ${(totalToMint / 1_000_000).toFixed(0)} USDC`);
  }

  console.log(`\nSetting up ${BOT_COUNT} bot keypairs...\n`);

  for (let i = 0; i < BOT_COUNT; i++) {
    const botKp = deriveBotKeypair(master, i);
    console.log(`Bot ${i}: ${botKp.publicKey.toBase58().slice(0, 16)}...`);

    // 1. Transfer SOL
    const botSolBalance = await connection.getBalance(botKp.publicKey);
    if (botSolBalance < SOL_PER_BOT * LAMPORTS_PER_SOL) {
      const lamports = SOL_PER_BOT * LAMPORTS_PER_SOL - botSolBalance;
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: master.publicKey,
          toPubkey: botKp.publicKey,
          lamports,
        })
      );
      await sendAndConfirmTransaction(connection, tx, [master]);
      console.log(`  SOL: transferred ${(lamports / LAMPORTS_PER_SOL).toFixed(4)}`);
    } else {
      console.log(`  SOL: ${(botSolBalance / LAMPORTS_PER_SOL).toFixed(4)} (ok)`);
    }

    // 2. Create USDC ATA + transfer USDC
    const botAta = await getOrCreateAssociatedTokenAccount(
      connection, master, usdcMint, botKp.publicKey
    );
    const botUsdcBalance = Number(botAta.amount);
    if (botUsdcBalance < USDC_PER_BOT) {
      const mintAmount = USDC_PER_BOT - botUsdcBalance;
      await sdk.mintTestUsdc(mintAmount, botKp.publicKey);
      console.log(`  USDC: minted ${(mintAmount / 1_000_000).toFixed(0)} USDC`);
    } else {
      console.log(`  USDC: ${(botUsdcBalance / 1_000_000).toFixed(0)} (ok)`);
    }
  }

  console.log("\nSetup complete! All bots have SOL + USDC.");
  console.log("Run: npm run start:devnet");
}

main().catch(console.error);