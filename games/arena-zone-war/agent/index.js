import "dotenv/config";
import { io } from "socket.io-client";
import { Connection, Keypair } from "@solana/web3.js";

import { bootstrapAgentOnchain, watchEntryAndClaim } from "./chain.js";

const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000";
const arenaMode = (process.env.ARENA_MODE || "mock").toLowerCase();

const socket = io(SERVER_URL, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 800,
  reconnectionDelayMax: 8000,
});

let playerId = null;
let moveX = 0;
let moveY = 0;
let aimX = 1;
let aimY = 0;
let lastDecision = 0;
let lockedTargetId = null;
let lockTime = 0;

/** On-chain: reuse pubkey + skip re-enter when retrying join for same arena */
let cachedJoinPubkey = null;
let bootstrappedArenaKey = null;

let joinSoftRetryTimer = null;
let joinSoftRetryAttempts = 0;

/** Serialize join/bootstrap so arena_ready + connect cannot race */
let joinQueue = Promise.resolve();

let currentSessionId = null;
let currentArenaId = null;
let prizeWatchUnsub = null;
let agentKeypair = null;
let agentConnection = null;

const DECISION_INTERVAL = 150;
const TARGET_LOCK_DURATION = 400;

const maxJoinSoftRetries = Number(process.env.AGENT_JOIN_SOFT_RETRIES || 48);
const initialJoinDelayMs =
  arenaMode !== "mock" ? Number(process.env.AGENT_JOIN_DELAY_MS || 500) : 0;

function arenaBootstrapKey(arenaIdStr) {
  return `${arenaMode}|${arenaIdStr}`;
}

function clearJoinSoftRetry() {
  if (joinSoftRetryTimer) {
    clearTimeout(joinSoftRetryTimer);
    joinSoftRetryTimer = null;
  }
  joinSoftRetryAttempts = 0;
}

function emitJoinPayload(payload) {
  socket.emit("join_game", payload);
}

function emitCachedJoinOnly() {
  if (arenaMode !== "mock") {
    if (cachedJoinPubkey) {
      emitJoinPayload({ role: "player", pubkey: cachedJoinPubkey });
    }
    return;
  }

  const payload = { role: "player" };
  if (process.env.AGENT_PUBKEY) {
    payload.pubkey = process.env.AGENT_PUBKEY;
  }
  emitJoinPayload(payload);
}

function isRetriableJoinError(message) {
  if (!message) return false;
  if (/already connected|public key is required/i.test(message)) {
    return false;
  }
  return /not entered|not ready|not found|timeout|429|blockhash|fetch failed|403|503|unable to join/i.test(
    message,
  );
}

function scheduleJoinSoftRetry() {
  if (joinSoftRetryAttempts >= maxJoinSoftRetries) {
    console.error("agent join: max soft retries reached");
    return;
  }

  joinSoftRetryAttempts += 1;
  const delay = Math.min(12_000, 400 + joinSoftRetryAttempts * 400);

  joinSoftRetryTimer = setTimeout(() => {
    joinSoftRetryTimer = null;
    console.log(`agent join retry #${joinSoftRetryAttempts} after ${delay}ms`);
    emitCachedJoinOnly();
  }, delay);
}

/**
 * @param {string|number|undefined|null} arenaId
 * @param {{ forceBootstrap?: boolean }} [opts]
 */
function joinAsPlayer(arenaId, opts = {}) {
  joinQueue = joinQueue
    .then(() => runJoinAsPlayer(arenaId, opts))
    .catch((error) => {
      console.error("agent join queue error:", error);
    });
  return joinQueue;
}

/**
 * @param {string|number|undefined|null} arenaId
 * @param {{ forceBootstrap?: boolean }} [opts]
 */
async function runJoinAsPlayer(arenaId, opts = {}) {
  const forceBootstrap = Boolean(opts.forceBootstrap);

  if (arenaId !== undefined && arenaId !== null && arenaId !== "") {
    process.env.ARENA_ID = String(arenaId);
  }

  const arenaIdStr = process.env.ARENA_ID || "";
  const bootKey = arenaBootstrapKey(arenaIdStr);

  if (arenaMode !== "mock") {
    if (!forceBootstrap && bootstrappedArenaKey === bootKey && cachedJoinPubkey) {
      emitJoinPayload({ role: "player", pubkey: cachedJoinPubkey });
      return;
    }

    const result = await bootstrapAgentOnchain();
    cachedJoinPubkey = result.pubkey;
    agentKeypair = result.keypair;
    agentConnection = result.connection;
    bootstrappedArenaKey = bootKey;
    emitJoinPayload({ role: "player", pubkey: cachedJoinPubkey });

    if (arenaMode === "onchain") {
      const numArenaId = Number(process.env.ARENA_ID || "0");
      watchEntryAndClaim(result.connection, result.keypair, numArenaId)
        .then((unsub) => { prizeWatchUnsub = unsub; })
        .catch((e) => console.error("watchEntryAndClaim failed:", e));
    }
    return;
  }

  const payload = { role: "player" };
  if (process.env.AGENT_PUBKEY) {
    payload.pubkey = process.env.AGENT_PUBKEY;
  }
  emitJoinPayload(payload);
}

socket.on("connect", () => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [AGENT_CONNECT] socket_id=${socket.id} server=${SERVER_URL}`);
  clearJoinSoftRetry();
  setTimeout(() => {
    void joinAsPlayer(process.env.ARENA_ID).catch((error) => {
      console.error("agent join failed:", error);
    });
  }, initialJoinDelayMs);
});

socket.on("connect_error", (err) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [AGENT_CONNECT_ERROR] socket_id=${socket.id} server=${SERVER_URL} error=${err?.message || 'unknown'}`);
  console.error(`[${timestamp}] [AGENT_CONNECT_ERROR] err=${JSON.stringify(err)}`);
});

socket.on("disconnect", (reason) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [AGENT_DISCONNECT] socket_id=${socket.id} reason=${reason}`);
});

socket.on("arena_ready", (payload) => {
  const aid = payload?.arenaId;
  const sid = payload?.sessionId;
  if (aid === undefined || aid === null) {
    return;
  }

  if (sid && currentSessionId && sid !== currentSessionId) {
    console.log("arena_ready: session mismatch, clearing state");
    cachedJoinPubkey = null;
    bootstrappedArenaKey = null;
    currentSessionId = sid;
    currentArenaId = aid;
  } else if (sid) {
    currentSessionId = sid;
  }
  if (aid) currentArenaId = aid;

  void joinAsPlayer(aid, { forceBootstrap: false }).catch((error) => {
    console.error("agent arena_ready join failed:", error);
  });
});

socket.on("arena_cycle", (payload) => {
  playerId = null;
  clearJoinSoftRetry();

  const sid = payload?.sessionId;
  const nextArenaId = payload?.arenaId ?? process.env.ARENA_ID;
  const bootKey = arenaBootstrapKey(String(nextArenaId));

  if (sid && currentSessionId && sid !== currentSessionId) {
    console.log("arena_cycle: new session detected, clearing cached state");
    cachedJoinPubkey = null;
    bootstrappedArenaKey = null;
    currentSessionId = sid;
  } else if (sid) {
    currentSessionId = sid;
  }
  if (nextArenaId) currentArenaId = nextArenaId;

  if (prizeWatchUnsub) {
    prizeWatchUnsub();
    prizeWatchUnsub = null;
  }

  if (arenaMode !== "mock" && cachedJoinPubkey && bootstrappedArenaKey === bootKey) {
    process.env.ARENA_ID = String(nextArenaId);
    emitJoinPayload({ role: "player", pubkey: cachedJoinPubkey });
    return;
  }

  cachedJoinPubkey = null;
  bootstrappedArenaKey = null;

  void joinAsPlayer(nextArenaId, { forceBootstrap: true }).catch((error) => {
    console.error("agent arena_cycle join failed:", error);
  });
});

socket.on("init", (data) => {
  clearJoinSoftRetry();
  playerId = data.playerId;
});

socket.on("join_error", (error) => {
  const msg = error?.message || String(error);
  console.error("agent join_error:", msg);

  if (!isRetriableJoinError(msg)) {
    return;
  }

  scheduleJoinSoftRetry();
});

socket.on("state", (message) => {
  if (!playerId) return;

  const now = Date.now();
  const state = message.state;
  const me = state.players.find((player) => player.id === playerId);
  if (!me) return;

  const enemies = state.players.filter((player) => player.id !== me.id);
  if (enemies.length === 0) return;

  const nearestZone = closest(me, state.zones);
  const nearestEnemy = getLockedTarget(me, enemies, now);

  if (now - lastDecision > DECISION_INTERVAL) {
    if (me.hp < 30) {
      const freeZone = findFreeZone(me, state.zones);
      if (freeZone) {
        moveTo(me, freeZone);
      } else {
        kite(me, nearestEnemy, state);
      }
    } else if (nearestZone && nearestZone.ownerId === me.id) {
      holdZone(me, nearestZone, enemies);
    } else if (nearestZone && nearestZone.ownerId) {
      const owner = enemies.find((player) => player.id === nearestZone.ownerId);
      if (owner) {
        fight(me, owner);
      } else {
        moveTo(me, nearestZone);
      }
    } else {
      moveTo(me, nearestZone);
    }

    lastDecision = now;
  }

  if (nearestEnemy) {
    updateAim(me, nearestEnemy);
  }

  socket.emit("action", {
    type: "move",
    dx: moveX,
    dy: moveY,
  });

  tryAttack(me, nearestEnemy, me.hp < 30 ? 6 : 4);
});

function getLockedTarget(me, enemies, now) {
  if (lockedTargetId && now < lockTime) {
    const existing = enemies.find((enemy) => enemy.id === lockedTargetId);
    if (existing) return existing;
  }

  const nextTarget = closest(me, enemies);
  if (nextTarget) {
    lockedTargetId = nextTarget.id;
    lockTime = now + TARGET_LOCK_DURATION;
  }

  return nextTarget;
}

function updateAim(me, target) {
  const dx = target.x - me.x;
  const dy = target.y - me.y;
  const distance = Math.hypot(dx, dy) || 1;

  const targetX = dx / distance;
  const targetY = dy / distance;

  aimX = aimX * 0.85 + targetX * 0.15;
  aimY = aimY * 0.85 + targetY * 0.15;

  const len = Math.hypot(aimX, aimY) || 1;
  aimX /= len;
  aimY /= len;
}

function holdZone(me, zone, enemies) {
  const distanceToZone = dist(me, zone);
  const radius = zone.radius || 3;

  if (distanceToZone > radius * 0.8) {
    moveTo(me, zone);
    return;
  }

  const enemy = closest(me, enemies);
  if (!enemy) return;

  const dx = enemy.x - me.x;
  const dy = enemy.y - me.y;
  const distance = Math.hypot(dx, dy) || 1;
  const dirX = dx / distance;
  const dirY = dy / distance;

  if (distance < 2.1) {
    moveX = -dirX;
    moveY = -dirY;
  } else {
    moveX = -dirY;
    moveY = dirX;
  }

  normalizeMove();
}

function fight(me, enemy) {
  const dx = enemy.x - me.x;
  const dy = enemy.y - me.y;
  const distance = Math.hypot(dx, dy) || 1;

  moveX = dx / distance;
  moveY = dy / distance;
  normalizeMove();
}

function moveTo(me, target) {
  if (!target) return;

  const dx = target.x - me.x;
  const dy = target.y - me.y;
  const distance = Math.hypot(dx, dy) || 1;

  moveX = dx / distance;
  moveY = dy / distance;
  normalizeMove();
}

function kite(me, enemy, state) {
  if (!enemy) return;

  const dx = enemy.x - me.x;
  const dy = enemy.y - me.y;
  const distance = Math.hypot(dx, dy) || 1;
  const dirX = dx / distance;
  const dirY = dy / distance;
  const safeRange = 5;

  if (distance < safeRange) {
    moveX = -dirX;
    moveY = -dirY;
  } else if (distance > safeRange * 1.5) {
    moveX = dirX;
    moveY = dirY;
  } else {
    moveX = -dirY;
    moveY = dirX;
  }

  const margin = 1;

  if (me.x < margin) moveX = Math.abs(moveX);
  if (me.x > state.width - margin) moveX = -Math.abs(moveX);
  if (me.y < margin) moveY = Math.abs(moveY);
  if (me.y > state.height - margin) moveY = -Math.abs(moveY);

  normalizeMove();
}

function tryAttack(me, enemy, range) {
  if (!enemy) return;

  if (me.attackCooldown <= 0 && dist(me, enemy) < range) {
    socket.emit("action", {
      type: "attack",
      dirX: aimX,
      dirY: aimY,
    });
  }
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function closest(me, list) {
  if (!list || list.length === 0) return null;

  return list.reduce((best, candidate) => {
    return dist(me, candidate) < dist(me, best) ? candidate : best;
  }, list[0]);
}

function findFreeZone(me, zones) {
  const freeZones = zones.filter((zone) => !zone.ownerId);
  if (freeZones.length === 0) return null;
  return closest(me, freeZones);
}

function normalizeMove() {
  const len = Math.hypot(moveX, moveY);

  if (len < 0.01) {
    moveX = (Math.random() - 0.5) * 0.5;
    moveY = (Math.random() - 0.5) * 0.5;
    return;
  }

  moveX /= len;
  moveY /= len;
}
