# Snake Game UI Enhancements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the snake game demo with mode selection, restart, preflight checks, color-coded explorer-linked logs, game state indicators, speed control, bot labels, and arena info — making every RitArena SDK interaction visible and explorable.

**Architecture:** Extend existing adapter interface with structured log events (kind, tx, explorerUrl) and preflight checks. Refactor server.ts from auto-start to lobby-based with WS command handling. Enhance renderer.js with new UI controls and visual features. All changes modify existing files — no new files.

**Tech Stack:** TypeScript, WebSocket, vanilla HTML Canvas, `@ritarena/sdk`

---

## File Map

| File | Changes |
|------|---------|
| `examples/snake-game/src/ritarena_sdk/adapter.ts` | Extend `ArenaAdapterEvents.onLog` signature, add `LogEntry` type, add `PreflightCheck` type, add `preflight()` to `ArenaAdapter` |
| `examples/snake-game/src/ritarena_sdk/mock-adapter.ts` | Update log calls to use new signature, implement `preflight()` |
| `examples/snake-game/src/ritarena_sdk/devnet-adapter.ts` | Update log calls with kind/tx/explorerUrl, implement `preflight()` with real checks |
| `examples/snake-game/src/server.ts` | Refactor to lobby/game states, WS command handlers (start/restart/speed), preflight flow, phase broadcasts, arena info |
| `examples/snake-game/public/index.html` | Add mode selector, start/restart/speed buttons, game state chip, preflight panel, arena info section |
| `examples/snake-game/src/game/renderer.js` | Handle new WS message types, color-coded logs, explorer links, bot labels, preflight UI, mode/speed controls |
| `examples/snake-game/src/game/constants.ts` | Add `BOT_LABELS` map |

---

### Task 1: Extend Adapter Interface with Structured Logging + Preflight

**Files:**
- Modify: `examples/snake-game/src/ritarena_sdk/adapter.ts`

- [ ] **Step 1: Add LogEntry and PreflightCheck types, update ArenaAdapterEvents**

Replace the entire contents of `adapter.ts` with:

```ts
// examples/snake-game/src/ritarena_sdk/adapter.ts

import type { Keypair } from "@solana/web3.js";
import type { CreateArenaConfig } from "@ritarena/sdk";

export interface GameAction {
  snakeId: string;
  round: number;
  tick: number;
  action: string;
  result: string;
  score: number;
}

export interface BotIdentity {
  botId: string;
  keypair: Keypair;
}

export interface RoundResult {
  roundNumber: number;
  deaths: BotIdentity[];
  scores: Map<string, number>;
  actions: GameAction[];
}

export type LogKind = "create" | "register" | "enter" | "start" | "eliminate" | "finalize" | "info";

export interface LogEntry {
  message: string;
  kind: LogKind;
  tx?: string;
  explorerUrl?: string;
}

export interface PreflightCheck {
  name: string;
  status: "pending" | "ok" | "fail";
  detail: string;
}

export interface ArenaAdapterEvents {
  onLog: (entry: LogEntry) => void;
}

export interface ArenaAdapter {
  preflight(): Promise<PreflightCheck[]>;
  createArena(config: CreateArenaConfig): Promise<{ arenaId: number; tx: string }>;
  registerProfile(botName: string, keypair: Keypair): Promise<void>;
  enterArena(arenaId: number, keypair: Keypair): Promise<string>;
  startArena(arenaId: number): Promise<void>;
  submitElimination(arenaId: number, round: RoundResult): Promise<void>;
  finalizeArena(arenaId: number, winner: BotIdentity, allBots: BotIdentity[]): Promise<void>;
}
```

- [ ] **Step 2: Commit**

```bash
git add examples/snake-game/src/ritarena_sdk/adapter.ts
git commit -m "feat(snake): extend adapter interface with structured logging and preflight"
```

---

### Task 2: Update MockAdapter

**Files:**
- Modify: `examples/snake-game/src/ritarena_sdk/mock-adapter.ts`

- [ ] **Step 1: Rewrite MockAdapter with structured logs and preflight**

Replace the entire contents of `mock-adapter.ts` with:

```ts
// examples/snake-game/src/ritarena_sdk/mock-adapter.ts

import { Keypair } from "@solana/web3.js";
import type { CreateArenaConfig } from "@ritarena/sdk";
import type {
  ArenaAdapter, RoundResult, BotIdentity, ArenaAdapterEvents,
  LogKind, PreflightCheck,
} from "./adapter.js";
import { hashLeaf, computeMerkleRoot } from "./merkle.js";

export class MockAdapter implements ArenaAdapter {
  private arenaCount = 0;
  private events: ArenaAdapterEvents;

  constructor(events: ArenaAdapterEvents) {
    this.events = events;
  }

  private log(message: string, kind: LogKind, tx?: string): void {
    const formatted = `[RitArena] ${message}`;
    console.log(formatted);
    this.events.onLog({ message: formatted, kind, tx });
  }

  async preflight(): Promise<PreflightCheck[]> {
    return [
      { name: "Mock mode", status: "ok", detail: "No checks needed" },
    ];
  }

  async createArena(config: CreateArenaConfig): Promise<{ arenaId: number; tx: string }> {
    const arenaId = this.arenaCount++;
    const tx = `mock-tx-create-${arenaId}`;
    this.log(
      `createArena -> arenaId: ${arenaId}, maxAgents: ${config.maxAgents}, prizeSplit: [${config.prizeSplit}]`,
      "create", tx
    );
    return { arenaId, tx };
  }

  async registerProfile(botName: string, _keypair: Keypair): Promise<void> {
    this.log(`registerProfile -> "${botName}" registered`, "register");
  }

  async enterArena(arenaId: number, keypair: Keypair): Promise<string> {
    const tx = `mock-tx-enter-${keypair.publicKey.toBase58().slice(0, 8)}`;
    this.log(
      `enterArena -> ${keypair.publicKey.toBase58().slice(0, 8)}... entered arena ${arenaId}`,
      "enter", tx
    );
    return tx;
  }

  async startArena(arenaId: number): Promise<void> {
    this.log(`startArena -> arena ${arenaId} now Active`, "start");
  }

  async submitElimination(arenaId: number, round: RoundResult): Promise<void> {
    const leaves = round.actions.map(hashLeaf);
    const root = computeMerkleRoot(leaves);
    const deathNames = round.deaths.map((d) => d.botId).join(", ") || "none";
    const scores = Array.from(round.scores.entries())
      .map(([id, s]) => `${id}:${s}`)
      .join(", ");
    this.log(
      `submitElimination -> round ${round.roundNumber}, eliminated: [${deathNames}], ` +
      `scores: [${scores}], merkle: ${root.toString("hex").slice(0, 12)}...`,
      "eliminate"
    );
  }

  async finalizeArena(arenaId: number, winner: BotIdentity, _allBots: BotIdentity[]): Promise<void> {
    this.log(`finalizeArena -> arena ${arenaId}, winner: ${winner.botId} (rank 1)`, "finalize");
  }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd examples/snake-game && npx tsc --noEmit`
Expected: No errors (or only errors from server.ts which hasn't been updated yet — that's OK)

- [ ] **Step 3: Commit**

```bash
git add examples/snake-game/src/ritarena_sdk/mock-adapter.ts
git commit -m "feat(snake): update MockAdapter with structured logs and preflight"
```

---

### Task 3: Update DevnetAdapter with Structured Logs + Preflight

**Files:**
- Modify: `examples/snake-game/src/ritarena_sdk/devnet-adapter.ts`

- [ ] **Step 1: Rewrite DevnetAdapter**

Replace the entire contents of `devnet-adapter.ts` with:

```ts
// examples/snake-game/src/ritarena_sdk/devnet-adapter.ts

import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { createHash } from "crypto";
import {
  RitArena,
  pdas,
  REGISTRATION_FEE,
  type CreateArenaConfig,
  type SubmitEliminationParams,
  type FinalizeArenaParams,
} from "@ritarena/sdk";
import type {
  ArenaAdapter, RoundResult, BotIdentity, ArenaAdapterEvents,
  LogKind, PreflightCheck,
} from "./adapter.js";
import { hashLeaf, computeMerkleRoot } from "./merkle.js";

const RPC_URL = "https://api.devnet.solana.com";
const EXPLORER_TX = "https://explorer.solana.com/tx";
const EXPLORER_ADDR = "https://explorer.solana.com/address";

export class DevnetAdapter implements ArenaAdapter {
  private connection: Connection;
  private oracleKeypair: Keypair;
  private sdk: RitArena;
  private events: ArenaAdapterEvents;
  private botPdas: Map<string, { profilePda: PublicKey; entryPda: PublicKey }> = new Map();
  private allEntryPdas: PublicKey[] = [];
  private botKeypairs: Keypair[] = [];
  private entryFee = 5_000_000; // will be set from config

  constructor(oracleKeypair: Keypair, events: ArenaAdapterEvents) {
    this.connection = new Connection(RPC_URL, "confirmed");
    this.oracleKeypair = oracleKeypair;
    this.sdk = RitArena.fromKeypair(this.connection, oracleKeypair);
    this.events = events;
  }

  private log(message: string, kind: LogKind, tx?: string): void {
    const formatted = `[RitArena] ${message}`;
    const explorerUrl = tx ? `${EXPLORER_TX}/${tx}?cluster=devnet` : undefined;
    console.log(formatted);
    if (explorerUrl) console.log(`  Explorer: ${explorerUrl}`);
    this.events.onLog({ message: formatted, kind, tx, explorerUrl });
  }

  getArenaAddress(arenaId: number): string {
    return pdas.arena(arenaId).toBase58();
  }

  getArenaExplorerUrl(arenaId: number): string {
    return `${EXPLORER_ADDR}/${this.getArenaAddress(arenaId)}?cluster=devnet`;
  }

  async preflight(): Promise<PreflightCheck[]> {
    const checks: PreflightCheck[] = [];

    // Check oracle wallet
    try {
      const balance = await this.connection.getBalance(this.oracleKeypair.publicKey);
      const solBalance = balance / LAMPORTS_PER_SOL;
      checks.push({
        name: "Oracle wallet SOL",
        status: solBalance >= 0.01 ? "ok" : "fail",
        detail: `${solBalance.toFixed(4)} SOL`,
      });
    } catch {
      checks.push({ name: "Oracle wallet SOL", status: "fail", detail: "Cannot connect to devnet" });
    }

    // Check protocol initialized
    try {
      const protocol = await this.sdk.getProtocol();
      checks.push({
        name: "Protocol initialized",
        status: protocol ? "ok" : "fail",
        detail: protocol ? "Found" : "Not initialized — run test-devnet.ts first",
      });
    } catch {
      checks.push({ name: "Protocol initialized", status: "fail", detail: "Cannot read protocol" });
    }

    // Check bot keypairs
    for (let i = 0; i < 8; i++) {
      const seed = createHash("sha256")
        .update(Buffer.from(this.oracleKeypair.secretKey))
        .update(Buffer.from([i]))
        .digest();
      const botKp = Keypair.fromSeed(seed.slice(0, 32));
      this.botKeypairs.push(botKp);

      try {
        const balance = await this.connection.getBalance(botKp.publicKey);
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

  async createArena(config: CreateArenaConfig): Promise<{ arenaId: number; tx: string }> {
    this.entryFee = config.entryFee;
    const result = await this.sdk.createArena(config);
    this.log(`createArena -> arenaId: ${result.arenaId}`, "create", result.tx);
    return result;
  }

  async registerProfile(botName: string, keypair: Keypair): Promise<void> {
    const botSdk = RitArena.fromKeypair(this.connection, keypair);
    const existing = await botSdk.getProfile(keypair.publicKey);
    if (existing) {
      this.log(`registerProfile -> "${botName}" already registered`, "register");
      return;
    }
    const tx = await botSdk.registerProfile(botName);
    this.log(`registerProfile -> "${botName}" registered`, "register", tx);
  }

  async enterArena(arenaId: number, keypair: Keypair): Promise<string> {
    const botSdk = RitArena.fromKeypair(this.connection, keypair);
    const tx = await botSdk.enterArena(arenaId);

    const profilePda = pdas.agentProfile(keypair.publicKey);
    const arenaPda = pdas.arena(arenaId);
    const entryPda = pdas.arenaEntry(arenaPda, profilePda);
    const pubkey58 = keypair.publicKey.toBase58();
    this.botPdas.set(pubkey58, { profilePda, entryPda });
    this.allEntryPdas.push(entryPda);

    this.log(`enterArena -> ${pubkey58.slice(0, 8)}...`, "enter", tx);
    return tx;
  }

  async startArena(arenaId: number): Promise<void> {
    const tx = await this.sdk.startArena(arenaId);
    this.log(`startArena -> arena ${arenaId}`, "start", tx);
  }

  async submitElimination(arenaId: number, round: RoundResult): Promise<void> {
    const leaves = round.actions.map(hashLeaf);
    const merkleRoot = computeMerkleRoot(leaves);

    const eliminated = round.deaths.map((d) => {
      const pubkey58 = d.keypair.publicKey.toBase58();
      const pdaInfo = this.botPdas.get(pubkey58);
      if (!pdaInfo) throw new Error(`No entry PDA for bot ${d.botId}`);
      return pdaInfo.entryPda;
    });

    const scores = this.allEntryPdas.map((entryPda) => ({
      entry: entryPda,
      score: 0,
    }));

    const params: SubmitEliminationParams = {
      merkleRoot: new Uint8Array(merkleRoot),
      roundNumber: round.roundNumber,
      eliminated,
      scores,
      entryAccounts: this.allEntryPdas,
    };

    const tx = await this.sdk.submitElimination(arenaId, params);
    this.log(`submitElimination -> round ${round.roundNumber}`, "eliminate", tx);
  }

  async finalizeArena(arenaId: number, winner: BotIdentity, _allBots: BotIdentity[]): Promise<void> {
    const pubkey58 = winner.keypair.publicKey.toBase58();
    const winnerPda = this.botPdas.get(pubkey58);
    if (!winnerPda) throw new Error(`No entry PDA for winner ${winner.botId}`);

    const leaves = [Buffer.from(`final:${winner.botId}`)];
    const merkleRoot = computeMerkleRoot(leaves);

    const params: FinalizeArenaParams = {
      merkleRoot: new Uint8Array(merkleRoot),
      winners: [{ entry: winnerPda.entryPda, rank: 1 }],
      entryAccounts: this.allEntryPdas,
    };

    const tx = await this.sdk.finalizeArena(arenaId, params);
    this.log(`finalizeArena -> winner: ${winner.botId}`, "finalize", tx);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add examples/snake-game/src/ritarena_sdk/devnet-adapter.ts
git commit -m "feat(snake): update DevnetAdapter with structured logs, explorer links, and preflight"
```

---

### Task 4: Add Bot Labels Constant

**Files:**
- Modify: `examples/snake-game/src/game/constants.ts`

- [ ] **Step 1: Add BOT_LABELS to constants.ts**

Append to the end of the file:

```ts

export function botLabel(id: string): string {
  // "greedy-1" -> "G1", "cautious-2" -> "C2", "aggressive-1" -> "A1", "random-1" -> "R1"
  const parts = id.split("-");
  return (parts[0][0].toUpperCase() + (parts[1] || "")).slice(0, 2);
}
```

- [ ] **Step 2: Commit**

```bash
git add examples/snake-game/src/game/constants.ts
git commit -m "feat(snake): add botLabel helper for canvas labels"
```

---

### Task 5: Refactor Server to Lobby-Based with WS Commands

**Files:**
- Modify: `examples/snake-game/src/server.ts`

This is the biggest task — the server needs to go from auto-start to lobby-based with support for start, restart, speed, preflight, phase broadcasts, and arena info.

- [ ] **Step 1: Rewrite server.ts**

Replace the entire file with:

```ts
// examples/snake-game/src/server.ts

import { createServer } from "http";
import { readFileSync } from "fs";
import { join, extname } from "path";
import { Keypair } from "@solana/web3.js";
import { BATTLE_ROYALE_TEMPLATE } from "@ritarena/sdk";
import { createHash } from "crypto";
import { WebSocketServer, WebSocket } from "ws";

import { GameEngine } from "./game/engine.js";
import { TICK_MS, ROUND_DURATION_MS } from "./game/constants.js";
import { BotRunner, type BotConfig } from "./agent/bot-runner.js";
import { MockAdapter } from "./ritarena_sdk/mock-adapter.js";
import type { ArenaAdapter, BotIdentity, GameAction, LogEntry } from "./ritarena_sdk/adapter.js";

const PORT = 3000;

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
};

const BOT_ROSTER: BotConfig[] = [
  { id: "greedy-1", strategy: "greedy" },
  { id: "greedy-2", strategy: "greedy" },
  { id: "cautious-1", strategy: "cautious" },
  { id: "cautious-2", strategy: "cautious" },
  { id: "aggressive-1", strategy: "aggressive" },
  { id: "aggressive-2", strategy: "aggressive" },
  { id: "random-1", strategy: "random" },
  { id: "random-2", strategy: "random" },
];

// --- State ---
const clients: Set<WebSocket> = new Set();
const logs: LogEntry[] = [];
let phase: string = "lobby";
let currentMode: "mock" | "devnet" = "mock";
let gameLoop: ReturnType<typeof setInterval> | null = null;
let engine: GameEngine | null = null;
let speedMultiplier = 1;

function broadcast(data: object): void {
  const msg = JSON.stringify(data);
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  }
}

function setPhase(p: string): void {
  phase = p;
  broadcast({ type: "phase", phase: p });
}

function addLog(entry: LogEntry): void {
  logs.push(entry);
  broadcast({ type: "log", ...entry });
}

function createAdapter(mode: "mock" | "devnet"): ArenaAdapter {
  if (mode === "devnet") {
    // Dynamic import handled in startGame
    throw new Error("Use createDevnetAdapter()");
  }
  return new MockAdapter({ onLog: addLog });
}

async function createDevnetAdapter(): Promise<ArenaAdapter> {
  const { DevnetAdapter } = await import("./ritarena_sdk/devnet-adapter.js");
  const fs = await import("fs");
  const path = await import("path");
  const keypairPath = path.join(process.env.HOME || "~", ".config/solana/id.json");
  const secret = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  const oracleKeypair = Keypair.fromSecretKey(Uint8Array.from(secret));
  return new DevnetAdapter(oracleKeypair, { onLog: addLog });
}

async function startGame(mode: "mock" | "devnet"): Promise<void> {
  // Clean up previous game
  if (gameLoop) {
    clearInterval(gameLoop);
    gameLoop = null;
  }

  currentMode = mode;
  logs.length = 0;
  speedMultiplier = 1;

  let adapter: ArenaAdapter;

  if (mode === "devnet") {
    // Preflight checks
    setPhase("preflight");
    adapter = await createDevnetAdapter();

    const checks = await adapter.preflight();
    broadcast({ type: "preflight", status: "checking", checks });

    const failed = checks.some((c) => c.status === "fail");
    if (failed) {
      broadcast({ type: "preflight", status: "failed", checks });
      setPhase("lobby");
      return;
    }
    broadcast({ type: "preflight", status: "ready", checks });
  } else {
    adapter = createAdapter("mock");
  }

  setPhase("setup");
  console.log(`\nStarting game in ${mode} mode...`);

  const rulesHash = createHash("sha256")
    .update("snake-game:slither-io-style:shrinking-map")
    .digest();

  const entryFee = 5_000_000;
  const { arenaId } = await adapter.createArena({
    ...BATTLE_ROYALE_TEMPLATE,
    entryFee,
    maxAgents: BOT_ROSTER.length,
    minAgents: 2,
    duration: 600,
    eliminationInterval: 700,
    eliminationPercent: 1,
    creatorFeeBps: 0,
    actionSchema: "up,down,left,right",
    prizeSplit: [100],
    rulesHash: new Uint8Array(rulesHash),
  });

  // Send arena info
  const arenaInfo: Record<string, unknown> = {
    type: "arena-info",
    arenaId,
    entryFee: entryFee / 1_000_000,
    prizePool: (entryFee * BOT_ROSTER.length) / 1_000_000,
    prizeSplit: [100],
    mode,
    botCount: BOT_ROSTER.length,
  };

  // Add on-chain address for devnet
  if (mode === "devnet" && "getArenaExplorerUrl" in adapter) {
    const devAdapter = adapter as any;
    arenaInfo.address = devAdapter.getArenaAddress(arenaId);
    arenaInfo.explorerUrl = devAdapter.getArenaExplorerUrl(arenaId);
  }

  broadcast(arenaInfo);

  const botIdentities: Map<string, BotIdentity> = new Map();
  for (const bot of BOT_ROSTER) {
    const keypair = Keypair.generate();
    await adapter.registerProfile(bot.id, keypair);
    await adapter.enterArena(arenaId, keypair);
    botIdentities.set(bot.id, { botId: bot.id, keypair });
  }

  await adapter.startArena(arenaId);

  // Create engine
  engine = new GameEngine();
  const botRunner = new BotRunner();

  for (const bot of BOT_ROSTER) {
    engine.addSnake(bot.id, bot.strategy);
    botRunner.addBot(bot);
  }
  engine.spawnFood();

  setPhase("active");

  let roundActions: GameAction[] = [];

  gameLoop = setInterval(async () => {
    if (!engine || engine.gameOver) {
      if (gameLoop) clearInterval(gameLoop);
      gameLoop = null;
      if (engine) {
        const winnerId = engine.winner!;
        const winnerBot = botIdentities.get(winnerId)!;
        await adapter.finalizeArena(arenaId, winnerBot, Array.from(botIdentities.values()));
        broadcast({ type: "state", state: engine.getState() });
        setPhase("finished");
        console.log(`Game over! Winner: ${winnerId}`);
      }
      return;
    }

    botRunner.update(engine);

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

    const effectiveDelta = TICK_MS * speedMultiplier;
    const tickResult = engine.tick(effectiveDelta);

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

    const roundEnd = engine.endRound();
    if (roundEnd) {
      setPhase(`round ${engine.round}`);
      if (roundEnd.deaths.length > 0) {
        const deathBots = roundEnd.deaths
          .map((id) => botIdentities.get(id))
          .filter((b): b is BotIdentity => b !== undefined);

        await adapter.submitElimination(arenaId, {
          roundNumber: roundEnd.roundNumber,
          deaths: deathBots,
          scores: roundEnd.scores,
          actions: roundActions,
        });
      }
      roundActions = [];
    }

    broadcast({ type: "state", state: engine.getState() });
  }, TICK_MS);
}

// --- HTTP + WebSocket ---

const publicDir = join(__dirname, "..", "public");
const rendererPath = join(__dirname, "game", "renderer.js");

const server = createServer((req, res) => {
  let filePath: string;
  if (req.url === "/" || req.url === "/index.html") {
    filePath = join(publicDir, "index.html");
  } else if (req.url === "/renderer.js") {
    filePath = rendererPath;
  } else {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  try {
    const content = readFileSync(filePath);
    const ext = extname(filePath);
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "text/plain" });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  clients.add(ws);

  // Send current state
  ws.send(JSON.stringify({ type: "phase", phase }));
  if (engine) {
    ws.send(JSON.stringify({ type: "state", state: engine.getState() }));
  }
  for (const log of logs) {
    ws.send(JSON.stringify({ type: "log", ...log }));
  }

  ws.on("message", (raw) => {
    let msg: any;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.type === "start" && (phase === "lobby" || phase === "finished")) {
      const mode = msg.mode === "devnet" ? "devnet" : "mock";
      broadcast({ type: "reset" });
      startGame(mode).catch((err) => {
        console.error("Failed to start game:", err);
        addLog({ message: `[RitArena] Error: ${err.message}`, kind: "info" });
        setPhase("lobby");
      });
    } else if (msg.type === "restart" && phase === "finished") {
      broadcast({ type: "reset" });
      startGame(currentMode).catch((err) => {
        console.error("Failed to restart game:", err);
        addLog({ message: `[RitArena] Error: ${err.message}`, kind: "info" });
        setPhase("lobby");
      });
    } else if (msg.type === "speed" && typeof msg.multiplier === "number") {
      if ([1, 2, 5].includes(msg.multiplier)) {
        speedMultiplier = msg.multiplier;
        broadcast({ type: "speed", multiplier: speedMultiplier });
      }
    }
  });

  ws.on("close", () => clients.delete(ws));
});

server.listen(PORT, () => {
  console.log(`\nSnake Game server running at http://localhost:${PORT}`);
  console.log("Open the URL in your browser. Select mode and press Start.\n");
});
```

- [ ] **Step 2: Verify server starts in lobby mode**

Run: `cd examples/snake-game && npx tsx src/server.ts`
Expected: Prints "Snake Game server running at http://localhost:3000" and waits (no auto-start). Ctrl+C to stop.

- [ ] **Step 3: Commit**

```bash
git add examples/snake-game/src/server.ts
git commit -m "feat(snake): refactor server to lobby-based with start/restart/speed WS commands"
```

---

### Task 6: Update HTML with New UI Elements

**Files:**
- Modify: `examples/snake-game/public/index.html`

- [ ] **Step 1: Rewrite index.html**

Replace the entire file. The new version adds:
- Mode selector (`<select>`) + Start button + Restart button + Speed buttons in header
- Game state chip in header
- Preflight panel (hidden by default, shown during devnet checks)
- Arena info section in sidebar
- Updated winner overlay with "Play Again" button
- CSS for new elements: log tag colors, flash animation, preflight styles, button styles
- All new CSS classes for color-coded logs: `.log-create`, `.log-register`, `.log-enter`, `.log-start`, `.log-eliminate`, `.log-finalize`

Key element IDs:
- `mode-select` (select), `btn-start` (button), `btn-restart` (button)
- `speed-1x`, `speed-2x`, `speed-5x` (buttons)
- `phase-chip` (span)
- `preflight-panel` (div), `preflight-list` (ul)
- `arena-info` (div) with children: `arena-id`, `arena-state`, `arena-fee`, `arena-pool`, `arena-split`, `arena-mode`, `arena-address`
- `btn-play-again` (button in winner overlay)

CSS additions:
- `.log-tag` — bold, colored per log kind
- `@keyframes flash` — brief background pulse for new log entries
- `.preflight-panel` — centered checklist panel
- `.controls` — flexbox for header buttons
- `.speed-btn.active` — highlighted speed button
- Button styles: dark background, #14F195 border on hover/active

- [ ] **Step 2: Commit**

```bash
git add examples/snake-game/public/index.html
git commit -m "feat(snake): add mode selector, speed controls, preflight panel, arena info to HTML"
```

---

### Task 7: Update Renderer with All UI Features

**Files:**
- Modify: `examples/snake-game/src/game/renderer.js`

- [ ] **Step 1: Rewrite renderer.js**

Replace the entire file. The new renderer handles:

**New WS message types:**
- `phase` — update phase chip text and color
- `reset` — clear canvas, scoreboard, logs, hide overlays, re-enable controls
- `preflight` — show/update/hide preflight panel
- `arena-info` — populate arena info section
- `speed` — update active speed button
- `log` — now receives `{ message, kind, tx?, explorerUrl? }` instead of just string

**New controls:**
- Mode select + Start button: send `{ type: "start", mode }` on click
- Restart button: send `{ type: "restart" }` on click
- Speed buttons: send `{ type: "speed", multiplier }` on click
- Play Again button: send `{ type: "restart" }` on click + hide overlay
- Disable controls during active game, re-enable on finished/lobby

**Color-coded logs:**
- Each log entry gets a colored tag span based on `kind`
- Tag text: `[CREATE]`, `[REGISTER]`, `[ENTER]`, `[START]`, `[ELIM]`, `[FINAL]`, `[INFO]`
- If `explorerUrl` present, append clickable `<a>` link (using createElement)
- Flash animation class added then removed after 500ms

**Bot labels on canvas:**
- For each alive snake, draw abbreviated label (first letter of strategy + number) above the head
- White text, 10px monospace, with dark shadow for contrast

**Arena info panel:**
- Populate fields from `arena-info` message
- If `explorerUrl` field present (devnet), show as clickable link

**Preflight panel:**
- Show over canvas area when phase=preflight
- List checks with green checkmark / red X / spinner based on status
- Show "Run `npm run setup:devnet`" text + Retry button on failure
- Retry sends `{ type: "start", mode: "devnet" }`

All DOM manipulation MUST use createElement + textContent + appendChild. No innerHTML anywhere.

**Phase chip colors:**
- lobby: gray (#888)
- setup: blue (#60a5fa)
- preflight: yellow (#fbbf24)
- active/round N: green (#14F195)
- finished: gold (#fbbf24)

- [ ] **Step 2: Verify full flow**

Run: `cd examples/snake-game && npx tsx src/server.ts`

Open http://localhost:3000 in browser.

Verify:
- [ ] Page shows lobby state: mode selector, Start button enabled, Restart disabled
- [ ] Select Mock, click Start -> game begins, controls disabled, phase chip shows "ACTIVE"
- [ ] Snakes have labels (G1, G2, C1, C2, A1, A2, R1, R2) above their heads
- [ ] Log entries are color-coded with tags: [CREATE] purple, [REGISTER] blue, etc.
- [ ] Speed buttons work: 2x and 5x speed up the round timer
- [ ] Arena info panel shows: Arena ID, Entry Fee, Prize Pool, Mode
- [ ] Game ends -> phase chip shows "FINISHED", Restart + Play Again buttons enabled
- [ ] Click Play Again -> game resets and starts fresh
- [ ] Logs are cleared on restart

- [ ] **Step 3: Commit**

```bash
git add examples/snake-game/src/game/renderer.js
git commit -m "feat(snake): add color-coded logs, explorer links, bot labels, mode/speed/restart controls"
```

---

### Task 8: End-to-End Test

- [ ] **Step 1: Full mock mode test**

```bash
cd examples/snake-game && npx tsx src/server.ts
```

Open http://localhost:3000. Run through complete flow:

1. Page loads in lobby state
2. Select "Mock", click Start
3. Game plays with color-coded logs, bot labels, speed controls
4. Game ends, click Play Again
5. Second game completes
6. Verify no console errors

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd examples/snake-game && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Final commit**

```bash
git add -A examples/snake-game/
git commit -m "feat(snake): complete UI enhancements — mode selector, restart, logs, speed, labels, arena info"
```
