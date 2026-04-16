/**
 * Quick smoke test for GameServer in mock mode.
 * Run: npx tsx scripts/test-game-server.ts
 */
import { PublicKey, Keypair } from "@solana/web3.js";
import { GameServer, RitArenaError } from "../src";

async function main() {
  console.log("--- GameServer Mock Mode Test ---\n");

  // 1. Create GameServer in mock mode
  const game = new GameServer(null, null, {
    entryFee: 5_000_000,
    maxAgents: 4,
    prizeSplit: [60, 30, 10],
    actionSchema: "up,down,left,right",
    mock: true,
  });

  const logs: string[] = [];
  game.on("log", (entry: any) => logs.push(entry.message));
  game.on("phase", (p: string) => console.log("  Phase:", p));

  // 2. Setup with bots
  console.log("1. setupWithBots()");
  const arenaId = await game.setupWithBots([]);
  console.log("  Arena ID:", arenaId);
  console.log("  Phase:", game.phase);
  console.assert(game.phase === "active", "Phase should be active");

  // 3. Report a score-only round (no eliminations)
  console.log("\n2. reportRound() — score only");
  const result = await game.reportRound(
    [],
    [],
    [{ snakeId: "bot-1", round: 1, tick: 1, action: "up", result: "moved", score: 5 }]
  );
  console.log("  Result:", result);
  console.assert(result.confirmed === true, "Should be confirmed");
  console.assert(result.round === 1, "Should be round 1");
  console.assert(game.currentRound === 1, "currentRound should be 1");

  // 4. Report elimination round
  console.log("\n3. reportRound() — with elimination");
  const fakePk = Keypair.generate().publicKey;
  const result2 = await game.reportRound(
    [fakePk],
    [],
    [{ snakeId: "bot-2", round: 2, tick: 100, action: "left", result: "died", score: 3 }]
  );
  console.log("  Result:", result2);
  console.assert(result2.round === 2, "Should be round 2");
  console.assert(game.currentRound === 2, "currentRound should be 2");

  // 5. Finish with multiple winners
  console.log("\n4. finish() — 3 winners");
  const winner1 = Keypair.generate().publicKey;
  const winner2 = Keypair.generate().publicKey;
  const winner3 = Keypair.generate().publicKey;
  await game.finish([
    { pubkey: winner1, rank: 1 },
    { pubkey: winner2, rank: 2 },
    { pubkey: winner3, rank: 3 },
  ]);
  console.log("  Phase:", game.phase);
  console.assert(game.phase === "finished", "Phase should be finished");

  // 6. Test phase validation
  console.log("\n5. Phase validation");
  try {
    await game.start();
    console.assert(false, "Should have thrown");
  } catch (err) {
    if (err instanceof RitArenaError) {
      console.log("  Caught RitArenaError:", err.code);
      console.log("  Message:", err.message);
      console.log("  Suggestion:", err.suggestion);
    } else {
      throw err;
    }
  }

  // 7. Winners mismatch validation
  console.log("\n6. Winners mismatch");
  const game2 = new GameServer(null, null, {
    entryFee: 5_000_000,
    maxAgents: 2,
    prizeSplit: [100],
    actionSchema: "move",
    mock: true,
  });
  await game2.setupWithBots([]);
  try {
    await game2.finish([
      { pubkey: winner1, rank: 1 },
      { pubkey: winner2, rank: 2 },
    ]);
    console.assert(false, "Should have thrown");
  } catch (err) {
    if (err instanceof RitArenaError) {
      console.log("  Caught:", err.code, "-", err.message);
    } else {
      throw err;
    }
  }

  // 8. Arena info
  console.log("\n7. getArenaInfo()");
  const info = game.getArenaInfo();
  console.log("  Info:", JSON.stringify(info, null, 2));
  console.assert(info !== null, "Info should not be null");
  console.assert(info!.phase === "finished", "Phase should be finished");

  console.log("\n--- All tests passed! ---");
  console.log(`  ${logs.length} log entries emitted`);
}

main().catch(console.error);
