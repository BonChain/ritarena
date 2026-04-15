// examples/snake-game/src/server.ts

import { createServer } from "http";
import { readFileSync } from "fs";
import { join, extname } from "path";
import { Keypair } from "@solana/web3.js";
import { BATTLE_ROYALE_TEMPLATE } from "@ritarena/sdk";
import { createHash } from "crypto";
import { WebSocketServer, WebSocket } from "ws";

import { GameEngine } from "./game/engine.js";
import { TICK_MS } from "./game/constants.js";
import { BotRunner, type BotConfig } from "./agent/bot-runner.js";
import { MockAdapter } from "./ritarena_sdk/mock-adapter.js";
import type { ArenaAdapter, BotIdentity, GameAction } from "./ritarena_sdk/adapter.js";

const PORT = 3000;
const useDevnet = process.argv.includes("--devnet");

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

async function main() {
  const logs: string[] = [];
  const clients: Set<WebSocket> = new Set();

  function broadcast(data: object): void {
    const msg = JSON.stringify(data);
    for (const ws of clients) {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    }
  }

  let adapter: ArenaAdapter;

  if (useDevnet) {
    const { DevnetAdapter } = await import("./ritarena_sdk/devnet-adapter.js");
    const fs = await import("fs");
    const path = await import("path");
    const keypairPath = path.join(process.env.HOME || "~", ".config/solana/id.json");
    const secret = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
    const oracleKeypair = Keypair.fromSecretKey(Uint8Array.from(secret));
    adapter = new DevnetAdapter(oracleKeypair, {
      onLog: (msg) => {
        logs.push(msg);
        broadcast({ type: "log", message: msg });
      },
    });
  } else {
    adapter = new MockAdapter({
      onLog: (msg) => {
        logs.push(msg);
        broadcast({ type: "log", message: msg });
      },
    });
  }

  console.log(`Mode: ${useDevnet ? "devnet" : "mock"}`);

  const rulesHash = createHash("sha256")
    .update("snake-game:slither-io-style:shrinking-map")
    .digest();

  const { arenaId } = await adapter.createArena({
    ...BATTLE_ROYALE_TEMPLATE,
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

  const botIdentities: Map<string, BotIdentity> = new Map();
  for (const bot of BOT_ROSTER) {
    const keypair = Keypair.generate();
    await adapter.registerProfile(bot.id, keypair);
    await adapter.enterArena(arenaId, keypair);
    botIdentities.set(bot.id, { botId: bot.id, keypair });
  }

  await adapter.startArena(arenaId);

  const engine = new GameEngine();
  const botRunner = new BotRunner();

  for (const bot of BOT_ROSTER) {
    engine.addSnake(bot.id, bot.strategy);
    botRunner.addBot(bot);
  }
  engine.spawnFood();

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
    ws.send(JSON.stringify({ type: "state", state: engine.getState() }));
    for (const log of logs) {
      ws.send(JSON.stringify({ type: "log", message: log }));
    }
    ws.on("close", () => clients.delete(ws));
  });

  let roundActions: GameAction[] = [];

  const gameLoop = setInterval(async () => {
    if (engine.gameOver) {
      clearInterval(gameLoop);
      const winnerId = engine.winner!;
      const winnerBot = botIdentities.get(winnerId)!;
      await adapter.finalizeArena(arenaId, winnerBot, Array.from(botIdentities.values()));
      broadcast({ type: "state", state: engine.getState() });
      console.log(`\nGame over! Winner: ${winnerId}`);
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

    const tickResult = engine.tick(TICK_MS);

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
    if (roundEnd && roundEnd.deaths.length > 0) {
      const deathBots = roundEnd.deaths
        .map((id) => botIdentities.get(id))
        .filter((b): b is BotIdentity => b !== undefined);

      await adapter.submitElimination(arenaId, {
        roundNumber: roundEnd.roundNumber,
        deaths: deathBots,
        scores: roundEnd.scores,
        actions: roundActions,
      });
      roundActions = [];
    } else if (roundEnd) {
      roundActions = [];
    }

    broadcast({ type: "state", state: engine.getState() });
  }, TICK_MS);

  server.listen(PORT, () => {
    console.log(`\nSnake Game running at http://localhost:${PORT}`);
    console.log(`${BOT_ROSTER.length} bots competing, ${useDevnet ? "devnet" : "mock"} mode`);
    console.log("Open the URL in your browser to watch!\n");
  });
}

main().catch(console.error);
