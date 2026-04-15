// examples/snake-game/src/server.ts

import { createServer } from "http";
import { readFileSync } from "fs";
import { join, extname } from "path";
import { Keypair } from "@solana/web3.js";
import { BATTLE_ROYALE_TEMPLATE } from "@ritarena/sdk";
import { createHash } from "crypto";
import { WebSocketServer, WebSocket } from "ws";
import * as fs from "fs";
import * as path from "path";

import { GameEngine } from "./game/engine.js";
import { TICK_MS } from "./game/constants.js";
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

async function createDevnetAdapter(): Promise<ArenaAdapter> {
  const { DevnetAdapter } = await import("./ritarena_sdk/devnet-adapter.js");
  const oracleKeypair = loadMasterKeypair();
  return new DevnetAdapter(oracleKeypair, { onLog: addLog });
}

async function startGame(mode: "mock" | "devnet"): Promise<void> {
  if (gameLoop) {
    clearInterval(gameLoop);
    gameLoop = null;
  }

  currentMode = mode;
  logs.length = 0;
  speedMultiplier = 1;

  let adapter: ArenaAdapter;

  if (mode === "devnet") {
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
    adapter = new MockAdapter({ onLog: addLog });
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

  const arenaInfo: Record<string, unknown> = {
    type: "arena-info",
    arenaId,
    entryFee: entryFee / 1_000_000,
    prizePool: (entryFee * BOT_ROSTER.length) / 1_000_000,
    prizeSplit: [100],
    mode,
    botCount: BOT_ROSTER.length,
  };

  if (mode === "devnet" && "getArenaExplorerUrl" in adapter) {
    const devAdapter = adapter as any;
    arenaInfo.address = devAdapter.getArenaAddress(arenaId);
    arenaInfo.explorerUrl = devAdapter.getArenaExplorerUrl(arenaId);
  }

  broadcast(arenaInfo);

  // For devnet: use deterministic keypairs (same as setup-devnet.ts)
  // For mock: use random keypairs (no real SOL needed)
  let masterKeypair: Keypair | null = null;
  if (mode === "devnet") {
    masterKeypair = loadMasterKeypair();
  }

  const botIdentities: Map<string, BotIdentity> = new Map();
  for (let i = 0; i < BOT_ROSTER.length; i++) {
    const bot = BOT_ROSTER[i];
    const keypair = masterKeypair ? deriveBotKeypair(masterKeypair, i) : Keypair.generate();
    await adapter.registerProfile(bot.id, keypair);
    await adapter.enterArena(arenaId, keypair);
    botIdentities.set(bot.id, { botId: bot.id, keypair });
  }

  await adapter.startArena(arenaId);

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

    // Skip round-end processing if game ended this tick —
    // finalizeArena will be called on the next interval tick
    if (!engine.gameOver) {
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
