/**
 * Example 3: Game Server Oracle Flow
 *
 * This shows how a game server uses the SDK to:
 *   1. Start an arena
 *   2. Submit elimination rounds with scores + Merkle roots
 *   3. Finalize the arena with prize assignments
 *
 * The game server holds the creator's keypair (creator = oracle).
 *
 * Prerequisites:
 *   - Arena created and agents entered (run examples 01 first)
 *   - At least min_agents have entered
 *
 * Run: npx tsx examples/03-game-server-oracle.ts
 */
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { createHash } from "crypto";
import * as fs from "fs";
import * as path from "path";

import { RitArena, pdas } from "../src";
import type { SubmitEliminationParams, FinalizeArenaParams } from "../src";

const RPC_URL = "https://api.devnet.solana.com";
const ARENA_ID = 0; // change to your arena

function loadKeypair(): Keypair {
  const keypairPath = path.join(
    process.env.HOME || "~",
    ".config/solana/id.json"
  );
  const secret = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

// --- Merkle tree helpers (simplified for example) ---
function hashLeaf(data: string): Buffer {
  return createHash("sha256").update(data).digest();
}

function computeMerkleRoot(leaves: Buffer[]): Buffer {
  if (leaves.length === 0) return Buffer.alloc(32);
  if (leaves.length === 1) return leaves[0];

  const next: Buffer[] = [];
  for (let i = 0; i < leaves.length; i += 2) {
    const left = leaves[i];
    const right = i + 1 < leaves.length ? leaves[i + 1] : left;
    const combined =
      Buffer.compare(left, right) < 0
        ? Buffer.concat([left, right])
        : Buffer.concat([right, left]);
    next.push(createHash("sha256").update(combined).digest());
  }
  return computeMerkleRoot(next);
}

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");
  const oracleKeypair = loadKeypair(); // creator = oracle
  const sdk = RitArena.fromKeypair(connection, oracleKeypair);

  console.log("Oracle:", oracleKeypair.publicKey.toBase58());

  // --- Check arena state ---
  const arena = await sdk.getArena(ARENA_ID);
  if (!arena) {
    console.log("Arena not found. Create one first.");
    return;
  }

  console.log("Arena state:", JSON.stringify(arena.state));
  console.log("Agents:", arena.currentAgents);

  // --- Get all entry PDAs (needed for remaining accounts) ---
  const entries = await sdk.getArenaEntries(ARENA_ID);
  if (entries.length < arena.minAgents) {
    console.log(
      `Need at least ${arena.minAgents} agents, have ${entries.length}. ` +
        `Enter more agents first.`
    );
    return;
  }

  // Derive entry PDAs from the entries
  const arenaPda = pdas.arena(ARENA_ID);
  const entryPdas = entries.map((e) =>
    pdas.arenaEntry(arenaPda, e.agentProfile)
  );

  console.log("Entry PDAs:", entryPdas.map((p) => p.toBase58().slice(0, 8)));

  // --- Step 1: Start arena (Registration → Active) ---
  if ("registration" in arena.state) {
    console.log("\nStarting arena...");
    const tx = await sdk.startArena(ARENA_ID);
    console.log("Arena started:", tx);
  } else {
    console.log("\nArena already started.");
  }

  // --- Step 2: Simulate a game round and submit elimination ---
  console.log("\nSimulating game round...");

  // Build fake Merkle tree from game actions
  const leaves = entries.map((e, i) =>
    hashLeaf(
      `${ARENA_ID}:1:${e.agentProfile.toBase58()}:move_${i}:survived:${(i + 1) * 100}`
    )
  );
  const merkleRoot = computeMerkleRoot(leaves);

  // Score everyone — lowest scorer gets eliminated
  const scores = entryPdas.map((pk, i) => ({
    entry: pk,
    score: (i + 1) * 100, // 100, 200, 300...
  }));

  // Eliminate the lowest scorer
  const eliminatedEntry = entryPdas[0]; // first entry = lowest score

  const eliminationParams: SubmitEliminationParams = {
    merkleRoot: new Uint8Array(merkleRoot),
    roundNumber: arena.currentRound + 1,
    eliminated: [eliminatedEntry],
    scores,
    entryAccounts: entryPdas, // ALL entries as remaining accounts
  };

  console.log("Submitting elimination round", eliminationParams.roundNumber);
  console.log("  Merkle root:", merkleRoot.toString("hex").slice(0, 16) + "...");
  console.log("  Scores:", scores.map((s) => s.score));
  console.log("  Eliminated:", eliminatedEntry.toBase58().slice(0, 8) + "...");

  const submitTx = await sdk.submitElimination(ARENA_ID, eliminationParams);
  console.log("  Submitted:", submitTx);

  // --- Step 3: Finalize arena ---
  console.log("\nFinalizing arena...");

  // Assign prizes to survivors (skip eliminated)
  const survivors = entryPdas.slice(1); // everyone except first
  const winners = survivors
    .slice(0, arena.prizeSplit.length) // top N get prizes
    .map((pk, i) => ({ entry: pk, rank: i + 1 }));

  const finalMerkleRoot = computeMerkleRoot([
    ...leaves,
    hashLeaf("final_round"),
  ]);

  const finalizeParams: FinalizeArenaParams = {
    merkleRoot: new Uint8Array(finalMerkleRoot),
    winners,
    entryAccounts: entryPdas, // ALL entries
  };

  console.log(
    "  Winners:",
    winners.map((w) => `rank ${w.rank}: ${w.entry.toBase58().slice(0, 8)}`)
  );
  const finalizeTx = await sdk.finalizeArena(ARENA_ID, finalizeParams);
  console.log("  Finalized:", finalizeTx);

  // --- Verify final state ---
  const finalArena = await sdk.getArena(ARENA_ID);
  if (finalArena) {
    console.log("\nFinal arena state:", JSON.stringify(finalArena.state));
    console.log(
      "Merkle root:",
      Buffer.from(finalArena.latestMerkleRoot).toString("hex").slice(0, 16) + "..."
    );
  }

  console.log("\n=== Game server flow complete ===");
  console.log("Winners can now call sdk.claimPrize(arenaId)");
  console.log("Creator can call sdk.claimCreatorFee(arenaId)");
}

main().catch(console.error);
