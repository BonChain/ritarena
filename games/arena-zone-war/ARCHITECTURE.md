# Architecture

## System Overview

```
Browser (frontend)              Bot Processes (agent)           Solana Devnet
      │                                  │                              │
      │──socket.emit("join_game")───────>│                              │
      │                                  │──socket.emit("join_game")───>│
      │<──socket.emit("init")────────────│<──socket.emit("init")────────│
      │<──socket.emit("state")───────────│<──socket.emit("state")────────│
      │                                  │                              │
      │     Docker Container (single image)                             │
      │          │ Game Loop (server/src/server.ts)                    │
      │          │ 60fps tick                                           │
      │          ├──> game/engine.ts: update(dt)                       │
      │          │     ├── physics.ts (movement, friction)             │
      │          │     ├── zone capture logic                          │
      │          │     └── combat (attacks, HP, elimination)           │
      │          │                                                      │
      │          └──> io.emit("state") ───────────────────────────────>│
      │                                                                   │
      │     Arena Round (every 10s)                                      │
      │          ├──> game.consumeRoundReport()                         │
      │          ├──> arena.service.ts: reportRound() ─────────────────>│
      │          │    (Merkle proofs of eliminations/scores)             │
      │          └──> arena.service.ts: finishArena() ─────────────────>│
      │               (prize distribution)                               │
      │               └──> beginNextMatch()                              │
```

## Server (`server/src/server.ts`)

### Startup Flow
1. `config()` — load env
2. `arenaService.init()` — init RitArena SDK (mock or onchain mode)
3. `arenaService.createArena()` — create arena on/off chain
4. `fastify.listen()` — start HTTP + Socket.IO on port 3000
5. `maybeSpawnAgents()` — fork N bot processes if `AUTO_SPAWN_AGENTS > 0`

### Game Loop (every `1000/TICK_RATE` ms)
```
for each tick:
    game.update(dt)          # physics, zone capture, combat, elimination
    io.emit("state", ...)   # broadcast full state to all clients
```

### Arena Round Processing (every 10s)
```
arenaService.reportRound()  # submit Merkle proofs of eliminations/scores on-chain
if game.isFinished():
    arenaService.finishArena()  # distribute prizes on-chain
    beginNextMatch()            # reset game, recycle session, broadcast arena_cycle
```

### Client Connection Handling
- `join_game` → assigns player slot or spectator role, emits `init`
- `action` (move/attack) → `game.handleMove()` / `game.handleAttack()`
- `disconnect` → remove from game state

## Frontend (`frontend/src/index.tsx`)

```
socket.connect() as "spectator"
    ├── on "init"       → store playerId, initialize Pixi canvas
    ├── on "state"      → store gameState via Zustand, renderer draws
    ├── on "arena_ready" → update arena metadata
    └── on "arena_cycle" → reset UI for new match

Render Pipeline:
    Pixi.js Application (rendered via GameCanvas component)
        → zones (colored circles + owner name)
        → players (circles + HP bars + direction arrows + cooldown bars)
        → attacks (yellow projectiles with glow)
        → particles (hit, death, zone capture effects)
        → screen shake on death
        → HUD overlay (phase, leaderboard, timers)
```

## Agent (`agent/index.js`)

```
socket.connect()
    ├── on "arena_ready" → join as player with wallet pubkey
    ├── on "init"        → store playerId
    └── on "state"      → trigger AI decision

Decision Loop (every 150ms):
    evaluate current state
        → kite()      if low HP: move away from nearest enemy
        → holdZone()  if near owned zone: stay
        → fight()     if enemy in range: attack
        → findFreeZone() otherwise: move toward free/nearest zone
    emit("action", { type: "move"|"attack", ... })
```

## Arena Lifecycle (On-Chain)

```
createArena()
    └── creates arena + oracle session on RitArena

registerParticipant(pubkey)
    └── registers player entry with entry fee (micro-USDC)

reportRound()
    └── called every 10s during match
    └── computes Merkle root of eliminations + scores
    └── submits proof to on-chain arena

finishArena()
    └── called when match ends
    └── distributes prize pool to top players

recycleSession()
    └── creates fresh oracle session for next match
```

## Data Structures

### In-Memory (GameState)
```typescript
{
  phase: "waiting" | "countdown" | "playing" | "battle";
  players: Player[],       // id, x, y, hp, score, dirX, dirY, state, etc.
  zones: Zone[],           // id, x, y, ownerId, ownerName, captureProgress
  attacks: Attack[],       // id, x, y, vx, vy, life, damage, ownerId
  width: number;           // map width (default 20)
  height: number;          // map height (default 20)
  roundTime: number;       // seconds remaining in PLAYING
  waitTime: number;        // seconds remaining in COUNTDOWN
  eventTimeInterval: number; // tracker for elimination interval
}
```

### On-Chain (RitArena SDK)
- Arena account: manages match lifecycle, oracle session
- Entry accounts: per-player, tracks pubkey + entry fee paid
- Profile accounts: per-wallet, tracks lifetime stats

## Mock Mode

When `ARENA_MODE=mock`, `arena.service.ts` skips all blockchain calls. The server still runs the full game loop, allowing offline testing of game mechanics without a Solana wallet.
