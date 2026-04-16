// games/snake/src/server.ts

import { createServer } from "http";
import { readFileSync } from "fs";
import { join, extname } from "path";
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { GameServer, RitArena } from "@ritarena/sdk";
import type { ScoreUpdate, GameAction } from "@ritarena/sdk";
import { createHash } from "crypto";
import { WebSocketServer, WebSocket } from "ws";
import * as fs from "fs";
import * as path from "path";

import { GameEngine } from "./game/engine.js";
import { TICK_MS } from "./game/constants.js";
import { BotRunner, type BotConfig } from "./agent/bot-runner.js";

interface LogEntry { message: string; kind: string; tx?: string; explorerUrl?: string; }
interface PreflightCheck { name: string; status: "pending" | "ok" | "fail"; detail: string; }

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

function loadMasterKeypair(): Keypair {
  const keypairPath = path.join(process.env.HOME || "~", ".config/solana/id.json");
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

// --- State ---
let activeServer: GameServer | null = null;
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

// --- Preflight (devnet only) ---

async function runPreflight(connection: Connection, oracleKeypair: Keypair, botKeypairs: Keypair[]): Promise<PreflightCheck[]> {
  const checks: PreflightCheck[] = [];

  // Check oracle SOL balance
  try {
    const balance = await connection.getBalance(oracleKeypair.publicKey);
    const sol = balance / LAMPORTS_PER_SOL;
    checks.push({
      name: "Oracle SOL balance",
      status: sol >= 0.1 ? "ok" : "fail",
      detail: `${sol.toFixed(4)} SOL${sol < 0.1 ? " (need >= 0.1)" : ""}`,
    });
  } catch (err: any) {
    checks.push({ name: "Oracle SOL balance", status: "fail", detail: err.message });
  }

  // Check protocol initialized
  try {
    const reader = RitArena.readOnly(connection);
    const config = await reader.getProtocol();
    checks.push({
      name: "Protocol initialized",
      status: config ? "ok" : "fail",
      detail: config ? "Protocol config found" : "Protocol not initialized",
    });
  } catch (err: any) {
    checks.push({ name: "Protocol initialized", status: "fail", detail: err.message });
  }

  // Check per-bot SOL balances
  for (let i = 0; i < botKeypairs.length; i++) {
    const kp = botKeypairs[i];
    try {
      const balance = await connection.getBalance(kp.publicKey);
      const sol = balance / LAMPORTS_PER_SOL;
      checks.push({
        name: `Bot ${i} SOL (${kp.publicKey.toBase58().slice(0, 8)})`,
        status: sol >= 0.01 ? "ok" : "fail",
        detail: `${sol.toFixed(4)} SOL${sol < 0.01 ? " (need >= 0.01)" : ""}`,
      });
    } catch (err: any) {
      checks.push({ name: `Bot ${i} SOL`, status: "fail", detail: err.message });
    }
  }

  return checks;
}

// --- Game lifecycle ---

async function startGame(mode: "mock" | "devnet"): Promise<void> {
  // Guard against concurrent startGame calls (race between WS messages)
  if (phase === "setup" || phase === "preflight" || phase === "active") return;
  setPhase("setup");

  if (gameLoop) {
    clearInterval(gameLoop);
    gameLoop = null;
  }

  currentMode = mode;
  logs.length = 0;
  speedMultiplier = 1;

  let connection: Connection | null = null;
  let oracleKeypair: Keypair | null = null;
  let masterKeypair: Keypair | null = null;

  if (mode === "devnet") {
    connection = new Connection("https://api.devnet.solana.com", "confirmed");
    oracleKeypair = loadMasterKeypair();
    masterKeypair = oracleKeypair;
  }

  // Generate bot keypairs
  const botKeypairs: Keypair[] = BOT_ROSTER.map((_, i) =>
    masterKeypair ? deriveBotKeypair(masterKeypair, i) : Keypair.generate()
  );

  // Preflight for devnet
  if (mode === "devnet") {
    setPhase("preflight");

    const checks = await runPreflight(connection!, oracleKeypair!, botKeypairs);
    broadcast({ type: "preflight", status: "checking", checks });

    const failed = checks.some((c) => c.status === "fail");
    if (failed) {
      broadcast({ type: "preflight", status: "failed", checks });
      setPhase("lobby");
      return;
    }
    broadcast({ type: "preflight", status: "ready", checks });
  }

  setPhase("setup");
  console.log(`\nStarting game in ${mode} mode...`);

  const entryFee = 5_000_000;
  const gameServer = new GameServer(connection, oracleKeypair, {
    entryFee,
    maxAgents: BOT_ROSTER.length,
    minAgents: 2,
    duration: 600,
    eliminationInterval: 300,
    creatorFeeBps: 0,
    actionSchema: "up,down,left,right",
    prizeSplit: [100],
    mock: mode === "mock",
  });
  activeServer = gameServer;

  gameServer.on("log", (entry: LogEntry) => addLog(entry));
  gameServer.on("error", (err: Error) => {
    console.error("[GameServer error]", err.message);
  });

  const arenaId = await gameServer.setupWithBots(botKeypairs);

  // Map botId -> PublicKey for game logic
  const botPubkeys: Map<string, PublicKey> = new Map();
  for (let i = 0; i < BOT_ROSTER.length; i++) {
    botPubkeys.set(BOT_ROSTER[i].id, botKeypairs[i].publicKey);
  }

  // Broadcast arena info
  const arenaInfo = gameServer.getArenaInfo();
  const arenaInfoMsg: Record<string, unknown> = {
    type: "arena-info",
    arenaId,
    entryFee: arenaInfo?.entryFee ?? entryFee / 1_000_000,
    prizePool: arenaInfo?.prizePool ?? (entryFee * BOT_ROSTER.length) / 1_000_000,
    prizeSplit: [100],
    mode,
    botCount: BOT_ROSTER.length,
  };
  if (mode === "devnet" && arenaInfo?.arenaPda) {
    arenaInfoMsg.address = arenaInfo.arenaPda;
    arenaInfoMsg.explorerUrl = `https://explorer.solana.com/address/${arenaInfo.arenaPda}?cluster=devnet`;
  }
  broadcast(arenaInfoMsg);

  engine = new GameEngine();
  const botRunner = new BotRunner();

  for (const bot of BOT_ROSTER) {
    engine.addSnake(bot.id, bot.strategy);
    botRunner.addBot(bot);
  }
  engine.spawnFood();

  setPhase("active");

  let roundActions: GameAction[] = [];
  let tickInProgress = false;

  gameLoop = setInterval(async () => {
    // Prevent overlapping async ticks (devnet calls are slow)
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
          addLog({ message: "[RitArena] Failed to finalize arena. Winner: " + winnerId + ". Arena may need manual finalization.", kind: "info" });
        }
        activeServer = null;
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

    // Skip round-end processing if game ended this tick —
    // finalizeArena will be called on the next interval tick
    if (!engine.gameOver) {
      const roundEnd = engine.endRound();
      if (roundEnd) {
        setPhase(`round ${engine.round}`);
        if (roundEnd.deaths.length > 0) {
          const eliminatedPubkeys = roundEnd.deaths
            .map((id) => botPubkeys.get(id))
            .filter((pk): pk is PublicKey => pk !== undefined);

          const scoreUpdates: ScoreUpdate[] = Array.from(roundEnd.scores.entries())
            .map(([id, score]) => ({ entry: botPubkeys.get(id)!, score }))
            .filter((s) => s.entry !== undefined);

          // Cap roundActions to prevent memory growth on repeated failures
          if (roundActions.length > 10000) {
            roundActions = roundActions.slice(-5000);
          }

          const report = await gameServer.reportRound(eliminatedPubkeys, scoreUpdates, roundActions);
          if (report.confirmed) {
            roundActions = [];
          }
          // If not confirmed, keep roundActions for the next attempt
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

    // Admin commands (start/restart) require GAME_ADMIN_KEY in devnet mode
    const adminKey = process.env.GAME_ADMIN_KEY;
    const isAdmin = !adminKey || msg.adminKey === adminKey;

    if (msg.type === "start" && (phase === "lobby" || phase === "finished")) {
      const mode = msg.mode === "devnet" ? "devnet" : "mock";
      if (mode === "devnet" && !isAdmin) {
        ws.send(JSON.stringify({ type: "error", message: "Unauthorized — set GAME_ADMIN_KEY" }));
        return;
      }
      broadcast({ type: "reset" });
      startGame(mode).catch((err) => {
        console.error("Failed to start game:", err);
        addLog({ message: `[RitArena] Error: ${err.message}`, kind: "info" });
        setPhase("lobby");
      });
    } else if (msg.type === "restart" && phase === "finished") {
      if (currentMode === "devnet" && !isAdmin) {
        ws.send(JSON.stringify({ type: "error", message: "Unauthorized" }));
        return;
      }
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
  console.log("Open the URL in your browser. Select mode and press Start.");
  console.log("Press Ctrl+C to stop. Active devnet arenas will need manual cleanup.\n");
});

// --- Graceful shutdown ---
async function shutdown() {
  console.log("\nShutting down...");

  if (gameLoop) {
    clearInterval(gameLoop);
    gameLoop = null;
  }

  if (activeServer && activeServer.phase === "active") {
    addLog({ message: "[RitArena] Server shutting down, abandoning active arena...", kind: "info" });
    try {
      await activeServer.abandon();
    } catch (err: any) {
      addLog({ message: `[RitArena] abandon failed: ${err.message}`, kind: "info" });
    }
    activeServer = null;
  } else {
    addLog({
      message: "[RitArena] Server shutting down. No active arena to abandon.",
      kind: "info"
    });
  }

  // Give WS clients time to receive the message
  await new Promise(r => setTimeout(r, 500));

  server.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
