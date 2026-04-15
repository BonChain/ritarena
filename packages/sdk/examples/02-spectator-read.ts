/**
 * Example 2: Read Arena State (No Wallet Required)
 *
 * This shows how a spectator, dashboard, or frontend reads
 * on-chain state without needing a wallet.
 *
 * Prerequisites:
 *   - An arena must exist on devnet (run example 01 first)
 *
 * Run: npx tsx examples/02-spectator-read.ts
 */
import { Connection, PublicKey } from "@solana/web3.js";
import { RitArena, pdas } from "../src";

const RPC_URL = "https://api.devnet.solana.com";

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");

  // No wallet needed for reads
  const reader = RitArena.readOnly(connection);

  // --- Protocol info ---
  console.log("=== Protocol ===");
  const protocol = await reader.getProtocol();
  if (protocol) {
    console.log("Authority:", protocol.authority.toBase58());
    console.log("USDC mint:", protocol.usdcMint.toBase58());
    console.log("Total arenas:", Number(protocol.totalArenas));
  } else {
    console.log("Protocol not initialized");
    return;
  }

  // --- Read arena 0 ---
  const arenaId = 0;
  console.log(`\n=== Arena ${arenaId} ===`);
  const arena = await reader.getArena(arenaId);
  if (!arena) {
    console.log("Arena not found. Create one first with example 01.");
    return;
  }

  console.log("Creator:", arena.creator.toBase58());
  console.log("Entry fee:", Number(arena.entryFee) / 1e6, "USDC");
  console.log("Max agents:", arena.maxAgents);
  console.log("Current agents:", arena.currentAgents);
  console.log("Alive agents:", arena.aliveAgents);
  console.log("State:", JSON.stringify(arena.state));
  console.log("Action schema:", arena.actionSchema);
  console.log("Creator fee:", Number(arena.creatorFeeBps) / 100 + "%");
  console.log("Prize split:", arena.prizeSplit.join("/"));
  console.log("Stake bond:", Number(arena.stakeBondAmount) / 1e6, "USDC");

  // --- Leaderboard (all entries) ---
  console.log(`\n=== Entries ===`);
  const entries = await reader.getArenaEntries(arenaId);
  if (entries.length === 0) {
    console.log("No agents have entered yet.");
  } else {
    // Sort by score descending
    const sorted = [...entries].sort(
      (a, b) => Number(b.score) - Number(a.score)
    );
    for (let i = 0; i < sorted.length; i++) {
      const e = sorted[i];
      const status = e.alive ? "ALIVE" : "ELIMINATED";
      console.log(
        `  #${i + 1} | Score: ${Number(e.score)} | ${status} | Owner: ${e.owner.toBase58().slice(0, 8)}...`
      );
    }
  }

  // --- Elimination log ---
  console.log(`\n=== Elimination Log ===`);
  const eliminated = await reader.getEliminationLog(arenaId);
  if (eliminated.length === 0) {
    console.log("No eliminations yet.");
  } else {
    for (const e of eliminated) {
      console.log(
        `  Eliminated | Score: ${Number(e.score)} | Owner: ${e.owner.toBase58().slice(0, 8)}...`
      );
    }
  }

  // --- Look up a specific profile ---
  // Replace with an actual pubkey if you want to check a specific agent
  const creatorProfile = await reader.getProfile(arena.creator);
  if (creatorProfile) {
    console.log(`\n=== Creator Profile ===`);
    console.log("Name:", creatorProfile.name);
    console.log("Arenas entered:", Number(creatorProfile.arenasEntered));
    console.log("Wins:", Number(creatorProfile.wins));
    console.log(
      "Total earnings:",
      Number(creatorProfile.totalEarnings) / 1e6,
      "USDC"
    );
  }
}

main().catch(console.error);
