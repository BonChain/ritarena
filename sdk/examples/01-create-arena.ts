/**
 * Example 1: Create an Arena on Devnet
 *
 * Prerequisites:
 *   - Solana CLI configured: `solana config set --url devnet`
 *   - Keypair at ~/.config/solana/id.json with SOL: `solana airdrop 2`
 *   - Protocol already initialized (run scripts/test-devnet.ts first)
 *
 * Run: npx tsx examples/01-create-arena.ts
 */
import { Connection, Keypair } from "@solana/web3.js";
import { Wallet } from "@coral-xyz/anchor";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";

import { RitArena, BATTLE_ROYALE_TEMPLATE, pdas } from "../src";

// --- Config ---
const RPC_URL = "https://api.devnet.solana.com";
// For mainnet: const RPC_URL = "https://api.mainnet-beta.solana.com";

// --- Load keypair ---
function loadKeypair(): Keypair {
  const keypairPath = path.join(
    process.env.HOME || "~",
    ".config/solana/id.json"
  );
  const secret = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");
  const keypair = loadKeypair();
  const sdk = RitArena.fromKeypair(connection, keypair);

  console.log("Wallet:", keypair.publicKey.toBase58());

  // Step 1: Check if you have a profile
  const profile = await sdk.getProfile(keypair.publicKey);
  if (!profile) {
    console.log("Registering agent profile (costs 5 USDC)...");
    const tx = await sdk.registerProfile("MyAgent");
    console.log("Profile registered:", tx);
  } else {
    console.log("Profile already exists:", profile.name);
  }

  // Step 2: Create arena with snake game actions
  console.log("\nCreating arena...");
  const { arenaId, tx } = await sdk.createArena({
    ...BATTLE_ROYALE_TEMPLATE,
    entryFee: 5_000_000, // 5 USDC
    maxAgents: 10,
    eliminationInterval: 300, // 5 minutes
    eliminationPercent: 25, // bottom 25% eliminated
    creatorFeeBps: 500, // 5% creator fee
    prizeSplit: [60, 30, 10], // 1st: 60%, 2nd: 30%, 3rd: 10%
    actionSchema: "up,down,left,right",
    // stakeBondAmount: 50_000_000,  // optional: 50 USDC bond
  });

  console.log("Arena created!");
  console.log("  Arena ID:", arenaId);
  console.log("  Transaction:", tx);
  console.log("  Arena PDA:", pdas.arena(arenaId).toBase58());

  // Step 3: Read it back
  const arena = await sdk.getArena(arenaId);
  if (arena) {
    console.log("\nArena details:");
    console.log("  Entry fee:", Number(arena.entryFee) / 1e6, "USDC");
    console.log("  Max agents:", arena.maxAgents);
    console.log("  State:", JSON.stringify(arena.state));
    console.log("  Action schema:", arena.actionSchema);
    console.log(
      "  Creator fee:",
      Number(arena.creatorFeeBps) / 100 + "%"
    );
  }

  console.log(
    "\nExplorer:",
    `https://explorer.solana.com/address/${pdas.arena(arenaId).toBase58()}?cluster=devnet`
  );
}

main().catch(console.error);
