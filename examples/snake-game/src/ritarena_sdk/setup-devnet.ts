// examples/snake-game/src/ritarena_sdk/setup-devnet.ts

import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
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
  console.log(`Setting up ${BOT_COUNT} bot keypairs...\n`);

  const balance = await connection.getBalance(master.publicKey);
  const needed = BOT_COUNT * SOL_PER_BOT * LAMPORTS_PER_SOL;
  if (balance < needed) {
    console.log(`Need ${needed / LAMPORTS_PER_SOL} SOL, have ${balance / LAMPORTS_PER_SOL} SOL`);
    console.log("Run: solana airdrop 2");
    process.exit(1);
  }

  for (let i = 0; i < BOT_COUNT; i++) {
    const botKp = deriveBotKeypair(master, i);
    console.log(`Bot ${i}: ${botKp.publicKey.toBase58().slice(0, 12)}...`);

    const botBalance = await connection.getBalance(botKp.publicKey);
    if (botBalance < SOL_PER_BOT * LAMPORTS_PER_SOL) {
      const sig = await connection.requestAirdrop(
        botKp.publicKey,
        SOL_PER_BOT * LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(sig);
      console.log(`  Airdropped ${SOL_PER_BOT} SOL`);
    } else {
      console.log(`  Already has ${botBalance / LAMPORTS_PER_SOL} SOL`);
    }
  }

  console.log("\nSetup complete! Bot keypairs are derived deterministically.");
  console.log("Run: npm run start:devnet");
}

main().catch(console.error);
