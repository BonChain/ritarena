# Snake Game GameServer Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the snake game's 4-file custom adapter layer with the SDK's `GameServer` class, proving the high-level API works end-to-end.

**Architecture:** `server.ts` creates a `GameServer` instance (mock or devnet), calls `setupWithBots()` to handle the full arena lifecycle, uses `reportRound()` for scoring and `finish()` for finalization. All retry logic, merkle computation, and PDA tracking handled by GameServer internally.

**Tech Stack:** TypeScript, `@ritarena/sdk` (GameServer, pdas, BATTLE_ROYALE_TEMPLATE), `@solana/web3.js`, `ws`

---

### Task 1: Rewrite server.ts — imports and module-level state

**Files:**
- Modify: `examples/snake-game/src/server.ts:1-60`

- [ ] **Step 1: Replace imports**

Replace the top of `server.ts` (lines 1-17) with:

```typescript
// examples/snake-game/src/server.ts

import { createServer } from "http";
import { readFileSync } from "fs";
import { join, extname } from "path";
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { GameServer, BATTLE_ROYALE_TEMPLATE, RitArena } from "@ritarena/sdk";
import type { ScoreUpdate, GameAction } from "@ritarena/sdk";
import { createHash } from "crypto";
import { WebSocketServer, WebSocket } from "ws";
import * as fs from "fs";
import * as path from "path";

import { GameEngine } from "./game/engine.js";
import { TICK_MS } from "./game/constants.js";
import { BotRunner, type BotConfig } from "./agent/bot-runner.js";
```

- [ ] **Step 2: Replace module-level state**

Replace the state block (lines 53-61) with:

```typescript
// --- Types ---
interface LogEntry {
  message: string;
  kind: string;
  tx?: string;
  explorerUrl?: string;
}

interface PreflightCheck {
  name: string;
  status: "pending" | "ok" | "fail";
  detail: string;
}

// --- State ---
const clients: Set<WebSocket> = new Set();
const logs: LogEntry[] = [];
let phase: string = "lobby";
let currentMode: "mock" | "devnet" = "mock";
let gameLoop: ReturnType<typeof setInterval> | null = null;
let engine: GameEngine | null = null;
let speedMultiplier = 1;
let activeServer: GameServer | null = null;
```

- [ ] **Step 3: Verify no compile errors so far**

Run: `cd examples/snake-game && npx tsc --noEmit 2>&1 | head -20`

Expected: Errors about removed adapter references in `startGame()` — that's expected since we haven't rewritten it yet. No errors from the import block.

- [ ] **Step 4: Commit**

```bash
git add examples/snake-game/src/server.ts
git commit -m "refactor(snake): update imports and state for GameServer migration"
```

---

### Task 2: Add standalone preflight function

**Files:**
- Modify: `examples/snake-game/src/server.ts` (add function before `startGame`)

- [ ] **Step 1: Add the preflight function**

Add this function after the `addLog` function and before `startGame`:

```typescript
async function runPreflight(
  connection: Connection,
  oracleKeypair: Keypair,
  botKeypairs: Keypair[]
): Promise<PreflightCheck[]> {
  const checks: PreflightCheck[] = [];

  // Check oracle SOL
  try {
    const balance = await connection.getBalance(oracleKeypair.publicKey);
    const solBalance = balance / LAMPORTS_PER_SOL;
    checks.push({
      name: "Oracle wallet SOL",
      status: solBalance >= 0.01 ? "ok" : "fail",
      detail: `${solBalance.toFixed(4)} SOL`,
    });
  } catch {
    checks.push({ name: "Oracle wallet SOL", status: "fail", detail: "Cannot connect to devnet" });
  }

  // Check protocol
  try {
    const reader = RitArena.readOnly(connection);
    const protocol = await reader.getProtocol();
    checks.push({
      name: "Protocol initialized",
      status: protocol ? "ok" : "fail",
      detail: protocol ? "Found" : "Not initialized. Run setup first.",
    });
  } catch {
    checks.push({ name: "Protocol initialized", status: "fail", detail: "Cannot read protocol" });
  }

  // Check each bot's SOL balance
  for (let i = 0; i < botKeypairs.length; i++) {
    try {
      const balance = await connection.getBalance(botKeypairs[i].publicKey);
      const solBalance = balance / LAMPORTS_PER_SOL;
      checks.push({
        name: `Bot ${i} SOL`,
        status: solBalance >= 0.05 ? "ok" : "fail",
        detail: `${solBalance.toFixed(4)} SOL`,
      });
    } catch {
      checks.push({ name: `Bot ${i} SOL`, status: "fail", detail: "Cannot check" });
    }
  }

  return checks;
}
```

- [ ] **Step 2: Commit**

```bash
git add examples/snake-game/src/server.ts
git commit -m "refactor(snake): add standalone preflight function"
```

---

### Task 3: Rewrite startGame() function

**Files:**
- Modify: `examples/snake-game/src/server.ts` — replace `startGame` function entirely

- [ ] **Step 1: Replace the startGame function**

Replace the entire `startGame` function (lines 85-307 in original) with:

```typescript
async function startGame(mode: "mock" | "devnet"): Promise<void> {
  if (gameLoop) {
    clearInterval(gameLoop);
    gameLoop = null;
  }

  currentMode = mode;
  logs.length = 0;
  speedMultiplier = 1;

  // --- Build config ---
  const rulesHash = createHash("sha256")
    .update("snake-game:slither-io-style:shrinking-map")
    .digest();

  const entryFee = 5_000_000;
  const serverConfig = {
    entryFee,
    maxAgents: BOT_ROSTER.length,
    minAgents: 2,
    prizeSplit: [100],
    actionSchema: "up,down,left,right",
    duration: 600,
    eliminationInterval: 700,
    creatorFeeBps: 0,
    stakeBondAmount: 0,
    mock: mode === "mock",
  };

  // --- Generate bot keypairs ---
  let masterKeypair: Keypair | null = null;
  if (mode === "devnet") {
    masterKeypair = loadMasterKeypair();
  }

  const botKeypairs: Keypair[] = [];
  const botPubkeys = new Map<string, PublicKey>();

  for (let i = 0; i < BOT_ROSTER.length; i++) {
    const kp = masterKeypair ? deriveBotKeypair(masterKeypair, i) : Keypair.generate();
    botKeypairs.push(kp);
    botPubkeys.set(BOT_ROSTER[i].id, kp.publicKey);
  }

  // --- Devnet preflight ---
  if (mode === "devnet") {
    setPhase("preflight");
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const checks = await runPreflight(connection, masterKeypair!, botKeypairs);
    broadcast({ type: "preflight", status: "checking", checks });

    const failed = checks.some((c) => c.status === "fail");
    if (failed) {
      broadcast({ type: "preflight", status: "failed", checks });
      setPhase("lobby");
      return;
    }
    broadcast({ type: "preflight", status: "ready", checks });
  }

  // --- Create GameServer ---
  setPhase("setup");
  console.log(`\nStarting game in ${mode} mode...`);

  let connection: Connection | null = null;
  let oracleKeypair: Keypair | null = null;
  if (mode === "devnet") {
    connection = new Connection("https://api.devnet.solana.com", "confirmed");
    oracleKeypair = masterKeypair;
  }

  const gameServer = new GameServer(connection, oracleKeypair, serverConfig);
  activeServer = gameServer;

  // Wire events
  gameServer.on("log", (entry: LogEntry) => addLog(entry));
  gameServer.on("error", (err: Error) => {
    addLog({ message: `[RitArena] Error: ${err.message}`, kind: "info" });
  });

  // --- Setup bots (create arena + register + enter + start) ---
  const arenaId = await gameServer.setupWithBots(botKeypairs);

  // --- Broadcast arena info ---
  const info = gameServer.getArenaInfo()!;
  const arenaInfo: Record<string, unknown> = {
    type: "arena-info",
    arenaId: info.arenaId,
    entryFee: info.entryFee,
    prizePool: info.prizePool,
    prizeSplit: info.prizeSplit,
    mode,
    botCount: BOT_ROSTER.length,
  };
  if (mode === "devnet") {
    arenaInfo.address = info.arenaPda;
    arenaInfo.explorerUrl = `https://explorer.solana.com/address/${info.arenaPda}?cluster=devnet`;
  }
  broadcast(arenaInfo);

  // --- Initialize game engine ---
  engine = new GameEngine();
  const botRunner = new BotRunner();

  for (const bot of BOT_ROSTER) {
    engine.addSnake(bot.id, bot.strategy);
    botRunner.addBot(bot);
  }
  engine.spawnFood();

  setPhase("active");

  // --- Game loop ---
  let roundActions: GameAction[] = [];
  let tickInProgress = false;

  gameLoop = setInterval(async () => {
    if (tickInProgress) return;
    tickInProgress = true;

    try {
      if (!engine || engine.gameOver) {
        if (gameLoop) clearInterval(gameLoop);
        gameLoop = null;

        if (engine) {
          const winnerId = engine.winner!;
          const winnerPubkey = botPubkeys.get(winnerId)!;

          try {
            await gameServer.finish([{ pubkey: winnerPubkey, rank: 1 }]);
          } catch (err: any) {
            addLog({
              message: `[RitArena] Failed to finalize: ${err.message}. Winner: ${winnerId}`,
              kind: "info",
            });
          }

          broadcast({ type: "state", state: engine.getState() });
          setPhase("finished");
          activeServer = null;
          console.log(`Game over! Winner: ${winnerId}`);
        }
        return;
      }

      // Bot AI decisions
      botRunner.update(engine);

      // Collect pre-tick actions
      for (const snake of engine.snakes.filter((s) => s.alive)) {
        roundActions.push({
          snakeId: snake.id,
          round: engine.round,
          tick: engine.tickCount,
          action: snake.direction,
          result: "moved",
          score: snake.score,
        });
      }

      // Execute tick
      const effectiveDelta = TICK_MS * speedMultiplier;
      const tickResult = engine.tick(effectiveDelta);

      // Collect death actions
      for (const deathId of tickResult.deaths) {
        const snake = engine.snakes.find((s) => s.id === deathId)!;
        roundActions.push({
          snakeId: deathId,
          round: engine.round,
          tick: engine.tickCount,
          action: snake.direction,
          result: "died",
          score: snake.score,
        });
      }

      // Round-end processing
      if (!engine.gameOver) {
        const roundEnd = engine.endRound();
        if (roundEnd) {
          setPhase(`round ${engine.round}`);

          if (roundEnd.deaths.length > 0) {
            const eliminatedPubkeys = roundEnd.deaths
              .map((id) => botPubkeys.get(id))
              .filter((pk): pk is PublicKey => pk !== undefined);

            const scoreUpdates: ScoreUpdate[] = Array.from(roundEnd.scores.entries())
              .map(([botId, score]) => ({
                entry: botPubkeys.get(botId)!,
                score,
              }));

            // Cap roundActions to prevent memory growth
            if (roundActions.length > 10000) {
              roundActions = roundActions.slice(-5000);
            }

            try {
              const report = await gameServer.reportRound(
                eliminatedPubkeys,
                scoreUpdates,
                roundActions
              );
              if (report.confirmed) {
                roundActions = [];
              }
            } catch (err: any) {
              addLog({
                message: `[RitArena] submitElimination failed: ${err.message} (will retry next round)`,
                kind: "info",
              });
            }
          } else {
            roundActions = [];
          }
        }
      }

      broadcast({ type: "state", state: engine.getState() });
    } finally {
      tickInProgress = false;
    }
  }, TICK_MS);
}
```

- [ ] **Step 2: Verify compile**

Run: `cd examples/snake-game && npx tsc --noEmit 2>&1 | head -20`

Expected: Clean or only warnings about unused imports (which we'll clean in next step).

- [ ] **Step 3: Commit**

```bash
git add examples/snake-game/src/server.ts
git commit -m "refactor(snake): rewrite startGame() to use SDK GameServer"
```

---

### Task 4: Update shutdown handler

**Files:**
- Modify: `examples/snake-game/src/server.ts` — update `shutdown` function

- [ ] **Step 1: Replace shutdown function**

Replace the shutdown function (near bottom of file) with:

```typescript
async function shutdown() {
  console.log("\nShutting down...");

  if (gameLoop) {
    clearInterval(gameLoop);
    gameLoop = null;
  }

  if (activeServer && activeServer.phase === "active") {
    addLog({
      message: "[RitArena] Server shutting down. Attempting arena abandonment...",
      kind: "info",
    });
    await activeServer.abandon().catch(() => {});
  } else {
    addLog({
      message: "[RitArena] Server shutting down.",
      kind: "info",
    });
  }

  await new Promise((r) => setTimeout(r, 500));
  server.close();
  process.exit(0);
}
```

- [ ] **Step 2: Remove the old `createDevnetAdapter` function**

Delete the `createDevnetAdapter` function (it imported from the adapter layer):

```typescript
// DELETE THIS ENTIRE FUNCTION:
// async function createDevnetAdapter(): Promise<ArenaAdapter> { ... }
```

- [ ] **Step 3: Verify compile**

Run: `cd examples/snake-game && npx tsc --noEmit 2>&1 | head -10`

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add examples/snake-game/src/server.ts
git commit -m "refactor(snake): update shutdown handler for GameServer"
```

---

### Task 5: Delete adapter layer files

**Files:**
- Delete: `examples/snake-game/src/ritarena_sdk/adapter.ts`
- Delete: `examples/snake-game/src/ritarena_sdk/mock-adapter.ts`
- Delete: `examples/snake-game/src/ritarena_sdk/devnet-adapter.ts`
- Delete: `examples/snake-game/src/ritarena_sdk/merkle.ts`
- Keep: `examples/snake-game/src/ritarena_sdk/setup-devnet.ts`

- [ ] **Step 1: Delete the four adapter files**

```bash
cd examples/snake-game
rm src/ritarena_sdk/adapter.ts
rm src/ritarena_sdk/mock-adapter.ts
rm src/ritarena_sdk/devnet-adapter.ts
rm src/ritarena_sdk/merkle.ts
```

- [ ] **Step 2: Verify setup-devnet.ts still exists**

```bash
ls src/ritarena_sdk/
```

Expected: only `setup-devnet.ts` remains.

- [ ] **Step 3: Verify full compile**

Run: `cd examples/snake-game && npx tsc --noEmit 2>&1`

Expected: No errors (server.ts no longer imports from deleted files).

- [ ] **Step 4: Commit**

```bash
git add -A examples/snake-game/src/ritarena_sdk/
git commit -m "refactor(snake): delete adapter layer (replaced by SDK GameServer)"
```

---

### Task 6: Smoke test — mock mode

**Files:** None (testing only)

- [ ] **Step 1: Start the snake game server**

```bash
cd examples/snake-game
npx tsx src/server.ts &
sleep 3
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

Expected: `200` and console shows:
```
Snake Game server running at http://localhost:3000
```

- [ ] **Step 2: Test mock game via WebSocket**

Open http://localhost:3000 in browser. Click "Start" (mock mode). Verify:
- Snakes move on the canvas
- Scoreboard updates
- Log panel shows `[RitArena] createArena`, `registerProfile`, `enterArena`, `startArena`
- Round ends show `[RitArena] submitElimination`
- Game ends with `[RitArena] finalizeArena`
- Winner announced

- [ ] **Step 3: Test restart**

After game finishes, click Restart. Verify a new game starts cleanly (new GameServer instance created).

- [ ] **Step 4: Test speed multiplier**

During a game, switch between 1x, 2x, 5x speeds. Verify game speeds up without errors.

- [ ] **Step 5: Kill the server**

```bash
kill %1 2>/dev/null; fuser -k 3000/tcp 2>/dev/null
```

- [ ] **Step 6: Final commit**

```bash
git add examples/snake-game/
git commit -m "refactor(snake): complete GameServer migration, verified mock mode"
```

---

### Summary

| Task | What | Time |
|---|---|---|
| 1 | Update imports + state | 5 min |
| 2 | Add preflight function | 5 min |
| 3 | Rewrite startGame() | 15 min |
| 4 | Update shutdown + cleanup | 5 min |
| 5 | Delete adapter files | 2 min |
| 6 | Smoke test mock mode | 10 min |
| **Total** | | **~40 min** |
