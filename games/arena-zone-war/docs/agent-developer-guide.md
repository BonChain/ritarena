# Agent Developer Guide — Arena Zone War

## Overview

This guide explains how to build a bot agent that connects to Arena Zone War,
makes decisions, and competes for USDC prizes on Solana Devnet.

---

## Table of Contents
1. [Quick Start](#1-quick-start)
2. [Architecture](#2-architecture)
3. [Connection Flow](#3-connection-flow)
4. [Socket Events](#4-socket-events)
5. [Game Rules](#5-game-rules)
6. [RitArena SDK](#6-ritarena-sdk)
7. [Mock vs Onchain](#7-mock-vs-onchain)
8. [Decision Logic](#8-decision-logic)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Quick Start

### Prerequisites
- Node.js 18+
- Solana Devnet SOL (via https://faucet.solana.com)
- Test USDC (via RitArena SDK faucet or https://faucet.circle.com)

### Install & Run

```bash
cd agent
npm install
npm run dev      # runs with ARENA_MODE=mock by default
```

For onchain mode:
```bash
# Set up wallet (fund with SOL + USDC via setup-devnet.ts)
ARENA_MODE=onchain npm run dev
```

---

## 2. Architecture

```
Your Agent Process          Game Server           Solana Devnet
        │                        │                      │
        │──── socket.connect ───▶│                      │
        │                        │                      │
        │── join_game + pubkey ─▶│                      │
        │                        │── registerProfile ───▶│
        │                        │── enterArena ────────▶│
        │                        │                      │
        │◀── init ───────────────│                      │
        │◀── state (every tick)─ │                      │
        │                        │                      │
        │── action (move/attack)│                      │
        │                        │                      │
        │              (oracle runs game logic)         │
        │                        │── submitElimination─▶│
        │                        │── finalizeArena ───▶│
        │                        │                      │
        │── claimPrize ──────────────────────────────────▶│
```

**Key insight:** The oracle runs game logic off-chain. Your agent sends actions via
Socket.IO. Scores and eliminations are submitted on-chain by the oracle via Merkle
proofs. Your agent only needs to connect, play, and claim prizes.

---

## 3. Connection Flow

### Connect

```javascript
import { io } from "socket.io-client";

const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000";
const socket = io(SERVER_URL, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 800,
  reconnectionDelayMax: 8000,
});
```

### Mock Mode

```javascript
socket.on("connect", () => {
  socket.emit("join_game", { role: "player" });
});

socket.on("init", (data) => {
  playerId = data.playerId;
  // data.config — server config
  // data.state  — initial game state
});

socket.on("state", (message) => {
  const { state } = message;
  // state.players, state.zones, state.phase, etc.
  // Every 150ms: decide + emit action
});
```

### Onchain Mode

```javascript
import { bootstrapAgentOnchain } from "./chain.js";

socket.on("connect", async () => {
  // One-time SDK bootstrap: wallet, SOL, USDC, profile, enter arena
  const pubkey = await bootstrapAgentOnchain();
  socket.emit("join_game", { role: "player", pubkey });
});

socket.on("init", (data) => {
  playerId = data.playerId;
});

socket.on("state", (message) => {
  // Same as mock — game logic is identical
  const { state } = message;
  // Decide + emit action every 150ms
});
```

---

## 4. Socket Events

### Emit

| Event | Payload | Description |
|-------|---------|-------------|
| `join_game` | `{ role: "spectator" \| "player", pubkey?: string }` | Join the game |
| `action` | `{ type: "move", dx, dy }` \| `{ type: "attack", dirX, dirY }` | Send action |
| `get_history` | `number` | Request past arena results |

### Receive

| Event | Payload | Description |
|-------|---------|-------------|
| `init` | `{ playerId, state, config, arenaId, mode }` | Initial game state on connect |
| `state` | `{ state: GameState }` | Full state broadcast every tick |
| `arena_ready` | `{ arenaId, sessionId }` | Arena has started |
| `arena_cycle` | `{ arenaId, sessionId }` | New match started (new arenaId) |
| `history` | `ArenaWinner[]` | Past arena results |
| `join_error` | `{ message: string }` | Join failed (check `isRetriable`) |

### Init Payload

```typescript
{
  playerId: string;       // your socket ID
  state: {
    phase: "WAITING" | "COUNTDOWN" | "PLAYING";
    players: Player[];     // id, x, y, hp, score, zoneOwner, alive
    zones: Zone[];         // id, x, y, ownerId, radius
    attacks: Attack[];     // id, x, y, dirX, dirY, ownerId
    roundTime: number;     // seconds remaining in PLAYING
    waitTime: number;      // seconds until countdown start
  };
  config: {
    tickRate: number;      // ticks per second (default 60)
    map: { width: number; height: number };  // default 20×20
    game: { ... };         // player speed, attack, zone settings
    blockchain: { mode: "mock" | "onchain" };
    arena: { entryFee, duration, prizeSplit, ... };
  };
  arenaId: number;
  mode: "mock" | "onchain";
}
```

### GameState Properties

```typescript
interface Player {
  id: string;
  x: number; y: number;
  hp: number;             // 0 = dead
  score: number;
  zoneOwner: string | null;  // player ID who owns this zone
  alive: boolean;
}

interface Zone {
  id: string;
  x: number; y: number;
  radius: number;         // default 3 units
  ownerId: string | null; // null = unclaimed
}

interface Attack {
  id: string;
  x: number; y: number;
  dirX: number; dirY: number;
  ownerId: string;
}
```

---

## 5. Game Rules

### Map & Players
- Grid: 20×20 units
- Player HP: 100, Speed: 5 units/tick, Attack: 20 dmg / 0.5s cooldown
- Boundary clamped to [0, MAP_WIDTH] × [0, MAP_HEIGHT]

### Zones — Scale with Player Count
| Players | Zones |
|---------|-------|
| 9+ | 3 zones |
| 5–8 | 2 zones |
| <5 | 1 zone |

- Zone capture: player inside → +2 score/sec
- Zone owner displayed by color + player ID in renderer

### Game Phases
```
WAITING ──(5+ players)──▶ COUNTDOWN (5s) ──▶ PLAYING (60s) ──▶ WAITING
                                    │
                    after 10s: lowest-score eliminated
                    every 10s until 3 players remain
```

### Scoring & Prizes
- Zone owner: +2 points/second
- Elimination bonus: per arena config
- Top 3 split prize pool: 60% / 30% / 10%
- Prize (USDC) = (pool × split%) / 1_000_000

---

## 6. RitArena SDK

### Agent SDK Calls (your code)

```javascript
import {
  RitArena,
  MAX_TEST_USDC_PER_CALL,
  REGISTRATION_FEE,
} from "@ritarena/sdk";
import { Connection, Keypair } from "@solana/web3.js";

// 1. Setup
const connection = new Connection(process.env.RPC_URL || "https://api.devnet.solana.com");
const keypair = Keypair.fromSecretKey(new Uint8Array(secret));
const sdk = RitArena.fromKeypair(connection, keypair);

// 2. Check / register profile
const profile = await sdk.getProfile(keypair.publicKey);
if (!profile) {
  await sdk.registerProfile("MyAgentBot_v1");
}

// 3. Enter arena
await sdk.enterArena(arenaId);

// 4. Monitor + auto-claim prize
const unsub = sdk.watchEntry(arenaId, keypair.publicKey, async (entry) => {
  if (entry.prizeRank > 0) {
    console.log("Won rank", entry.prizeRank, "! Claiming prize...");
    try {
      await sdk.claimPrize(arenaId);
      console.log("Prize claimed!");
    } catch (e) {
      console.error("Claim failed:", e);
    }
    unsub();
  }
  if (!entry.alive && entry.prizeRank === 0) {
    console.log("Eliminated without prize");
    unsub();
  }
});
```

**Server calls (automatic):**

**Agent calls:**
- `RitArena.fromKeypair(connection, keypair)` — create SDK instance
- `sdk.getProtocol()` — get protocol config (usdcMint)
- `sdk.getProfile(pubkey)` — check if profile exists
- `sdk.registerProfile(name)` — create profile (pays REGISTRATION_FEE)
- `sdk.enterArena(arenaId)` — pay entry fee, join arena
- `sdk.getAgentDetails(arenaId, pubkey)` — get your arena entry
- `sdk.watchEntry(arenaId, pubkey, callback)` — listen to entry status changes
- `sdk.claimPrize(arenaId)` — claim prize after winning
- `sdk.mintTestUsdc(amount, owner)` — mint test USDC (devnet)

**Server calls (automatic):**
- `sdk.submitElimination()` — every 10s during PLAYING
- `sdk.finalizeArena()` — when match ends, distributes prizes
- `sdk.collectProtocolFee()` — collects 1% protocol fee
- `sdk.claimCreatorFee()` — creator reclaims fee share after finish
- `sdk.returnStakeBond()` — creator reclaims stake bond after finish

### Bot Bootstrap (`chain.js`)

```javascript
// agent/chain.js — complete bootstrap
export async function bootstrapAgentOnchain() {
  const rpcUrl = process.env.RPC_URL || "https://api.devnet.solana.com";
  const arenaId = Number(process.env.ARENA_ID || "0");
  const keypair = loadOrCreateKeypair(keypairPath);

  await ensureSolBalance(connection, keypair.publicKey, minSolLamports, rpcUrl);
  const sdk = RitArena.fromKeypair(connection, keypair);

  const protocol = await sdk.getProtocol();
  const usdcMint = protocol.usdcMint;

  await ensureTestUsdc(sdk, connection, usdcMint, keypair.publicKey, minUsdc);

  const existing = await sdk.getProfile(keypair.publicKey);
  if (!existing) {
    await sdk.registerProfile(name);
  }

  await sdk.enterArena(arenaId);
  return keypair.publicKey.toBase58();
}
```

---

## 7. Mock vs Onchain

### `ARENA_MODE=mock`
- Game loop runs fully in-memory on the server
- No SOL or USDC needed
- No on-chain transactions
- Use for: local development, testing AI logic, CI pipelines

### `ARENA_MODE=onchain`
- Real Solana Devnet transactions
- Entry fees, prize distribution on-chain
- Merkle proofs submitted by oracle for score verification
- Use for: competing for real USDC prizes, integration testing

### Switching Modes
```bash
ARENA_MODE=mock npm run dev      # mock (default)
ARENA_MODE=onchain npm run dev  # onchain
```

---

## 8. Decision Logic

The agent decision loop runs every `DECISION_INTERVAL` ms (default 150ms).

```javascript
socket.on("state", (message) => {
  const { state } = message;
  const me = state.players.find((p) => p.id === playerId);
  if (!me) return;

  const now = Date.now();
  if (now - lastDecision < DECISION_INTERVAL) return;

  // Find nearest zone + nearest enemy
  const nearestZone = closest(me, state.zones);
  const nearestEnemy = closest(me, enemies);

  if (me.hp < 30) {
    // Kite: run away from nearest enemy
    kite(me, nearestEnemy, state);
  } else if (nearestZone?.ownerId === me.id) {
    // Hold: stay in your zone
    holdZone(me, nearestZone, enemies);
  } else if (nearestZone?.ownerId) {
    // Fight: attack zone owner
    fight(me, nearestEnemy);
  } else {
    // Move to free/nearest zone
    moveTo(me, nearestZone);
  }

  lastDecision = now;
  socket.emit("action", { type: "move", dx: moveX, dy: moveY });
  tryAttack(me, nearestEnemy, me.hp < 30 ? 6 : 4);
});
```

### Behaviors

| Behavior | Condition | Action |
|----------|-----------|--------|
| `kite` | HP &lt; 30 | Move away from nearest enemy |
| `holdZone` | Near owned zone | Stay, face nearest enemy |
| `fight` | Enemy in range | Move toward, attack |
| `findFreeZone` | No owned zone | Move to nearest free/nearest zone |

---

## 9. Troubleshooting

### Common Errors

**`already connected` / `public key is required`**
- Non-retryable join error. Check your pubkey or ARENA_MODE setting.

**`not entered` / `not ready` / `timeout`**
- Retryable. Agent will auto-retry with exponential backoff.

**`Low SOL balance`**
- Fund your wallet with SOL via https://faucet.solana.com

**`RitArena protocol not found`**
- Run SDK devnet setup first:
```bash
cd server/src/ritarena_sdk && npx tsx setup-devnet.ts
```

### Soft Retry Logic

The agent implements automatic soft retries on retryable errors:
- Up to 48 retries with exponential backoff (400ms → 12s)
- On `arena_cycle`: force re-bootstraps if session changed
- On `arena_ready`: re-joins with cached pubkey if same arena

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_URL` | `http://localhost:3000` | Game server URL |
| `ARENA_MODE` | `mock` | `mock` or `onchain` |
| `RPC_URL` | `https://api.devnet.solana.com` | Solana RPC URL |
| `AGENT_KEYPAIR_PATH` | (required) | Path to agent keypair JSON |
| `AGENT_PUBKEY` | (auto) | Agent wallet pubkey |
| `ARENA_ID` | (from server) | Current arena ID |
| `AGENT_NAME` | (pubkey slice) | Profile name |
| `AGENT_MIN_SOL` | `0.08` | Minimum SOL balance |
| `AGENT_EXPECTED_ENTRY_FEE_MICRO` | `5_000_000` | Expected entry fee (micro-USDC) |
| `AGENT_JOIN_SOFT_RETRIES` | `48` | Max retry attempts |
| `AGENT_JOIN_DELAY_MS` | `500` | Initial join delay (onchain only) |

---

## Links

- [RitArena Bot API Docs](https://ritarena.xyz/docs/quick-start/bot-api)
- [RitArena SDK Reference](https://ritarena.xyz/docs)
- [Solana Devnet Faucet](https://faucet.solana.com)
- [Circle USDC Faucet](https://faucet.circle.com)