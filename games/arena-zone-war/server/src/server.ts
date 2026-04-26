import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { Keypair, PublicKey } from "@solana/web3.js";
import { Server } from "socket.io";

import { ArenaService } from "./arena.service.js";
import { config } from "./config.js";
import { GameEngine } from "./game/engine.js";
import {
  ActionMessage,
  ClientConnection,
  ClientRole,
  Player,
  PlayerState,
} from "./game/types.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const fastify = Fastify();

fastify.get("/test", async (req, reply) => {
  return { ok: true };
});

await fastify.register(fastifyStatic, {
  root: path.join(currentDir, "../../frontend/dist"),
  prefix: "/",
  index: "index.html",
  wildcard: true,
});


fastify.setNotFoundHandler((req, reply) => {
  reply.sendFile("index.html");
});

fastify.get("/docs/*", async (request, reply) => {
  const filePath = (request.url as string).replace("/docs/", "");
  const fullPath = path.join(currentDir, "../../docs", filePath);
  const content = fs.readFileSync(fullPath, "utf-8");
  return reply.type("text/markdown").send(content);
});

const arenaService = new ArenaService({
  mode: config.blockchain.mode,
  rpcUrl: config.blockchain.rpcUrl,
  walletPath: config.blockchain.walletPath,
  profileName: config.blockchain.profileName,
  arena: {
    entryFee: config.blockchain.arena.entryFee,
    duration: config.blockchain.arena.duration,
    minAgents: config.game.minPlayers,
    maxAgents: config.game.maxPlayers,
    prizeSplit: config.blockchain.arena.prizeSplit,
    actionSchema: config.blockchain.arena.actionSchema,
  },
});

let game = new GameEngine({
  minPlayers: config.game.minPlayers,
  maxPlayers: config.game.maxPlayers,
});

let arenaTransitionLock = false;

const io = new Server(fastify.server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false,
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
});

const connections = new Map<string, ClientConnection>();
const playerPubkeyMap = new Map<string, PublicKey>();
const sessionJoinedPubkeys = new Set<string>();

let arenaStarted = false;
let arenaLoopHandle: NodeJS.Timeout | null = null;
let spawnedAgents = false;
let serverSessionId = crypto.randomUUID();

function emitArenaReadyToSocket(
  socket: Parameters<typeof io.on>[1] extends (socket: infer T) => void ? T : never,
) {
  socket.emit("arena_ready", {
    arenaId: arenaService.currentArenaId,
    mode: config.blockchain.mode,
    sessionId: serverSessionId,
  });
}

function broadcastArenaReady() {
  io.emit("arena_ready", {
    arenaId: arenaService.currentArenaId,
    mode: config.blockchain.mode,
    sessionId: serverSessionId,
  });
}

io.on("connection", (socket) => {
  const timestamp = new Date().toISOString();
  const transport = socket.conn.transport.name;
  console.log(`[${timestamp}] [CONNECTION] socket_id=${socket.id} transport=${transport} ip=${socket.handshake.address}`);

  socket.conn.on("upgrade", (transport) => {
    console.log(`[${new Date().toISOString()}] [TRANSPORT] socket_id=${socket.id} upgraded_to=${transport.name}`);
  });

  connections.set(socket.id, {
    id: socket.id,
    role: ClientRole.SPECTATOR,
  });

  emitArenaReadyToSocket(socket);

  socket.on("join_game", async (data: { role?: ClientRole; pubkey?: string }) => {
    console.log("join_game event:", socket.id, "role:", data?.role);
    const connection = connections.get(socket.id);
    if (!connection) {
      console.log("no connection found for:", socket.id);
      return;
    }

    connection.role = data?.role || ClientRole.PLAYER;

    if (connection.role !== ClientRole.PLAYER || connection.playerId) {
      emitInit(socket, connection.playerId || null);
      try {
        const history = await arenaService.getHistory(20);
        socket.emit("history", history);
      } catch (historyErr) {
        console.error("getHistory error:", historyErr);
      }
      return;
    }

    const requestedPubkey =
      data.pubkey || (arenaService.isMockMode() ? Keypair.generate().publicKey.toBase58() : "");

    if (!requestedPubkey) {
      socket.emit("join_error", {
        message: "A public key is required to join as a player.",
      });
      return;
    }

    if ([...connections.values()].some((entry) => entry.pubkey === requestedPubkey)) {
      socket.emit("join_error", {
        message: "This public key is already connected.",
      });
      return;
    }

    if (sessionJoinedPubkeys.has(requestedPubkey)) {
      socket.emit("join_error", {
        message: "Player already joined in this session.",
      });
      return;
    }

    let owner: PublicKey;
    let playerName: string | null = null;
    try {
      const result = await arenaService.registerParticipant(requestedPubkey);
      owner = result.owner;
      playerName = result.name;
    } catch (error) {
      socket.emit("join_error", {
        message:
          error instanceof Error ? error.message : "Unable to join the arena.",
      });
      return;
    }

    const player = createPlayer(owner.toBase58(), playerName);
    game.state.players.push(player);

    sessionJoinedPubkeys.add(owner.toBase58());

    connection.playerId = player.id;
    connection.pubkey = owner.toBase58();
    playerPubkeyMap.set(player.id, owner);

    emitInit(socket, player.id);
    const history = await arenaService.getHistory(20);
    socket.emit("history", history);
  });

  socket.on("action", (action: ActionMessage) => {
    const connection = connections.get(socket.id);
    if (!connection?.playerId) return;

    const player = game.state.players.find((entry) => entry.id === connection.playerId);
    if (!player || player.state !== PlayerState.NORMAL) {
      return;
    }

    if (action.type === "move") {
      game.handleMove(player, action.dx, action.dy);
      return;
    }

    if (typeof action.dirX === "number" && typeof action.dirY === "number") {
      const len = Math.hypot(action.dirX, action.dirY) || 1;
      player.dirX = action.dirX / len;
      player.dirY = action.dirY / len;
    }

    game.handleAttack(player);
  });

  socket.on("disconnect", (reason) => {
    const timestamp = new Date().toISOString();
    const connection = connections.get(socket.id);
    console.log(`[${timestamp}] [DISCONNECT] socket_id=${socket.id} reason=${reason} had_player=${!!connection?.playerId}`);

    if (connection?.playerId) {
      game.state.players = game.state.players.filter(
        (player) => player.id !== connection.playerId,
      );
      playerPubkeyMap.delete(connection.playerId);
    }

    connections.delete(socket.id);
  });

  socket.on("get_history", async (count: number = 20) => {
    const history = await arenaService.getHistory(count);
    socket.emit("history", history);
  });
});

const tickRate = config.game.tickRate;
const dt = 1 / tickRate;

setInterval(() => {
  game.update(dt);
  io.emit("state", {
    type: "state",
    state: game.state,
  });
}, 1000 / tickRate);

async function processArenaRound() {
  if (!arenaStarted && game.state.players.length >= game.minPlayers) {
    try {
      await arenaService.startArena();
      arenaStarted = true;
      console.log("Arena started");
    } catch (error) {
      console.error("startArena error:", error);
      return;
    }
  }

  if (!arenaStarted) {
    return;
  }

  const report = game.consumeRoundReport();

  const eliminated = report.eliminatedPlayerIds
    .map((playerId) => playerPubkeyMap.get(playerId))
    .filter((pubkey): pubkey is PublicKey => !!pubkey);

  const scores = report.scores
    .map((score) => {
      const pubkey = playerPubkeyMap.get(score.playerId);
      if (!pubkey) return null;

      return {
        entry: pubkey,
        score: score.score,
      };
    })
    .filter((score): score is { entry: PublicKey; score: number } => !!score);

  const actions = report.actions.map((action, index) => ({
    snakeId: playerPubkeyMap.get(action.playerId)?.toBase58() ?? action.playerId,
    round: Date.now(),
    tick: index,
    action: action.type,
    result: action.targetId ? `${action.type}:${action.targetId}` : action.type,
    score: action.value ?? 0,
  }));

  try {
    await arenaService.reportRound(eliminated, scores, actions);
  } catch (error) {
    console.error("report error:", error);
  }

  if (!game.isFinished()) {
    return;
  }

  if (arenaTransitionLock) {
    return;
  }

  arenaTransitionLock = true;

  try {
    const winners = game
      .getTop3()
      .map((winner) => {
        const pubkey = playerPubkeyMap.get(winner.playerId);
        if (!pubkey) return null;

        return {
          pubkey,
          rank: winner.rank,
        };
      })
      .filter((winner): winner is { pubkey: PublicKey; rank: number } => !!winner);

    if (winners.length > 0) {
      await arenaService.finishArena(winners);
      console.log("Arena finished");
    }

    await beginNextMatch();
    console.log("Next match session ready");
  } catch (error) {
    console.error("Arena transition failed:", error);
  } finally {
    arenaTransitionLock = false;
  }
}

async function beginNextMatch() {
  serverSessionId = crypto.randomUUID();

  io.sockets.sockets.forEach((socket) => {
    const connection = connections.get(socket.id);
    if (connection) {
      delete connection.playerId;
      delete connection.pubkey;
    }
  });

  playerPubkeyMap.clear();
  sessionJoinedPubkeys.clear();

  game = new GameEngine({
    minPlayers: config.game.minPlayers,
    maxPlayers: config.game.maxPlayers,
  });

  arenaStarted = false;
  spawnedAgents = false;

  try {
    await arenaService.recycleSession();
  } catch (error) {
    console.error("recycleSession failed:", error);
  }

  io.emit("arena_cycle", {
    arenaId: arenaService.currentArenaId,
    mode: config.blockchain.mode,
    sessionId: serverSessionId,
    state: game.state,
  });

  io.emit("state", {
    type: "state",
    state: game.state,
  });

  io.sockets.sockets.forEach((socket) => {
    emitInit(socket, null);
  });
}

async function start() {
  sessionJoinedPubkeys.clear();

  await arenaService.init();
  await arenaService.createArena();

  await fastify.listen({
    port: config.port,
    host: "0.0.0.0", // 🔥 ใส่นี่
  });
  console.log(`Server running on http://0.0.0.0:${config.port}`);
  console.log(`[STARTUP] Server session_id=${serverSessionId} mode=${config.blockchain.mode}`);
  console.log("Agent:", arenaService.publicKey?.toBase58() ?? "mock-mode");

  broadcastArenaReady();

  if (config.autoSpawnAgents > 0) {
    maybeSpawnAgents();
  }

  arenaLoopHandle = setInterval(() => {
    void processArenaRound();
  }, 10000);
}

function maybeSpawnAgents() {
  if (config.autoSpawnAgents <= 0) {
    return;
  }

  const agentDir = path.resolve(currentDir, "..", "..", "agent");
  spawn(process.execPath, ["spawn.js"], {
    cwd: agentDir,
    env: {
      ...process.env,
      AGENT_COUNT: String(config.autoSpawnAgents),
      SERVER_URL: `http://localhost:${config.port}`,
      ARENA_ID: String(arenaService.currentArenaId ?? ""),
      ARENA_MODE: config.blockchain.mode,
      RPC_URL: config.blockchain.rpcUrl,
      AGENT_EXPECTED_ENTRY_FEE_MICRO: String(config.blockchain.arena.entryFee),
    },
    stdio: "inherit",
  });
}

function emitInit(
  socket: Parameters<typeof io.on>[1] extends (socket: infer T) => void ? T : never,
  playerId: string | null,
) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [INIT] socket_id=${socket.id} playerId=${playerId} sessionId=${serverSessionId}`);
  socket.emit("init", {
    playerId,
    state: game.state,
    config: config.game,
    arenaId: arenaService.currentArenaId,
    mode: config.blockchain.mode,
    sessionId: serverSessionId,
    entryFee: config.blockchain.arena.entryFee,
    prizeSplit: config.blockchain.arena.prizeSplit,
    maxPlayers: config.game.maxPlayers,
    rpcUrl: config.blockchain.rpcUrl,
  });
}

function createPlayer(pubkey: string, name: string | null = null): Player {
  return {
    id: crypto.randomUUID(),
    pubkey,
    name: name ?? undefined,
    x: Math.random() * game.state.width,
    y: Math.random() * game.state.height,
    vx: 0,
    vy: 0,
    hp: config.game.player.defaultHp,
    state: PlayerState.NORMAL,
    stunTime: 0,
    invulnTime: 0,
    attackCooldown: 0,
    maxHp: config.game.player.defaultHp,
    moveSpeed: config.game.player.speed,
    bulletSpeed: 0,
    bulletSize: 0,
    knockbackOut: 0,
    knockbackIn: 0,
    dirX: 1,
    dirY: 0,
    score: 0,
    attackCooldownMax: config.game.attack.cooldown,
    upgradePoints: 0,
    upgradeLevel: 0,
  };
}

void start();
