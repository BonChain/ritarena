// examples/snake-game/src/ritarena_sdk/setup-devnet.ts

import {
  Connection, Keypair, LAMPORTS_PER_SOL,
  SystemProgram, Transaction, sendAndConfirmTransaction,
} from "@solana/web3.js";
import { createHash } from "crypto";
import * as fs from "fs";
import * as path from "path";

const RPC_URL = "https://api.devnet.solana.com";
const BOT_COUNT = 8;
const SOL_PER_BOT = 0.05;

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

  // Check master balance
  const balance = await connection.getBalance(master.publicKey);
  const needed = BOT_COUNT * SOL_PER_BOT * LAMPORTS_PER_SOL + 0.01 * LAMPORTS_PER_SOL; // extra for tx fees
  console.log(`Master balance: ${balance / LAMPORTS_PER_SOL} SOL`);

  if (balance < needed) {
    console.log(`\nNeed ${needed / LAMPORTS_PER_SOL} SOL total.`);
    console.log("Fund your master wallet first:");
    console.log("  Option 1: solana airdrop 2  (may be rate-limited)");
    console.log("  Option 2: https://faucet.solana.com  (paste your address)");
    console.log(`\nMaster address: ${master.publicKey.toBase58()}`);
    process.exit(1);
  }

  console.log(`\nTransferring SOL to ${BOT_COUNT} bot keypairs...\n`);

  // Transfer SOL from master to each bot (avoids faucet rate limits)
  for (let i = 0; i < BOT_COUNT; i++) {
    const botKp = deriveBotKeypair(master, i);
    console.log(`Bot ${i}: ${botKp.publicKey.toBase58().slice(0, 16)}...`);

    const botBalance = await connection.getBalance(botKp.publicKey);
    if (botBalance >= SOL_PER_BOT * LAMPORTS_PER_SOL) {
      console.log(`  Already has ${(botBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
      continue;
    }

    const lamports = SOL_PER_BOT * LAMPORTS_PER_SOL - botBalance;
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: master.publicKey,
        toPubkey: botKp.publicKey,
        lamports,
      })
    );

    const sig = await sendAndConfirmTransaction(connection, tx, [master]);
    console.log(`  Transferred ${(lamports / LAMPORTS_PER_SOL).toFixed(4)} SOL (tx: ${sig.slice(0, 12)}...)`);
  }

  console.log("\nSetup complete! Bot keypairs are derived deterministically.");
  console.log("Run: npm run start:devnet");
}

main().catch(console.error);
