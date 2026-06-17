# ArenaZoneWar

Real-time multiplayer zone-capture battle royale on Solana Devnet.

## Tech Stack

| Module   | Runtime       | Key Packages                                       |
|----------|---------------|----------------------------------------------------|
| server   | Node.js + TS  | fastify@5.8.4, socket.io@4.8.3, @solana/web3.js@1.98.4, @solana/spl-token@0.4.14, @ritarena/sdk@0.4.0, bs58, dotenv |
| frontend | Vite + TS     | pixi.js@8.17.1, socket.io-client@4.8.3             |
| agent    | Node.js (ESM) | @solana/web3.js, @solana/spl-token, @ritarena/sdk, socket.io-client, dotenv |
| blockchain | Solana Devnet | RitArena SDK (arena management), SPL Token (USDC entry fee) |

## Modules

### `server/src/`
| File | Role |
|------|------|
| `server.ts` | Entry point. Fastify HTTP + Socket.IO. Game loop at 60fps. Arena lifecycle. |
| `arena.service.ts` | On-chain: createArena, registerParticipant, reportRound (Merkle proofs), finishArena, recycleSession. |
| `config.ts` | Loads env vars with defaults. |
| `game/engine.ts` | GameEngine class. Phases (WAITING→COUNTDOWN→PLAYING). Zone capture. Combat. Elimination of lowest-score players. |
| `game/physics.ts` | Position integration, friction, boundary clamping. |
| `game/types.ts` | Player, Zone, Attack, GameState, ActionMessage, EngineRoundReport interfaces. |

### `frontend/src/`
| File | Role |
|------|------|
| `index.tsx` | Entry point. Preact render, Socket.IO spectator connection. |
| `renderer.ts` | Pixi.js WebGL rendering: players (circles+HP bars), zones, attack projectiles. |
| `HUD.tsx` | HTML overlay: phase, player list, round timer, lobby timer, leaderboard. |
| `network.ts` | Socket.IO client wrapper (used by renderer). |
| `interpolation.ts` | Client-side state interpolation for smooth rendering. |
| `store/gameStore.ts` | Zustand state store for game state, HUD metadata, history. |
| `AgentConnect.tsx` | Agent server URL display with copy button. |

### `agent/` (bot AI)
| File | Role |
|------|------|
| `index.js` | Bot AI entry. Decision loop every 150ms. Behaviors: kite, holdZone, fight, findFreeZone. |
| `chain.js` | On-chain bot setup: create/fund keypair, airdrop SOL, mint test USDC, register profile, enter arena. |
| `spawn.js` | Fork N instances of index.js. |

## Configuration

Key environment variables (`server/.env`):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `ARENA_MODE` | mock | "mock" (off-chain) or "onchain" |
| `RPC_URL` | https://api.devnet.solana.com | Solana RPC |
| `WALLET_PATH` | ./keypair.json | Server on-chain wallet |
| `TICK_RATE` | 60 | Game ticks per second |
| `WAIT_TIME` | 5 | Lobby wait time (s) |
| `ROUND_TIME` | 60 | Match duration (s) |
| `MIN_PLAYERS` | 5 | Required to start match |
| `MAX_PLAYERS` | 9 | Cap |
| `MAP_WIDTH` / `MAP_HEIGHT` | 20 | Map units |
| `PLAYER_SPEED` | 5 | Units per tick |
| `PLAYER_HP` | 100 | Max HP |
| `ATTACK_DAMAGE` | 20 | Damage per hit |
| `ATTACK_COOLDOWN` | 2 | Seconds between attacks |
| `ZONE_RADIUS` | 3 | Zone circle radius |
| `ZONE_SCORE_RATE` | 2 | Score per second for zone owner |
| `AUTO_SPAWN_AGENTS` | 5 | Bot count |

## Entry Points

| File | Command |
|------|---------|
| `server/src/server.ts` | `node --loader ts-node/esm src/server.ts` |
| `frontend/src/main.ts` | `vite` (dev) or `vite build` |
| `agent/index.js` | `node index.js` (or via `spawn.js`) |
| `agent/chain.js` | `node chain.js` |

## Socket.IO Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `join_game` | Client→Server | `{ role?: "spectator"\|"player", pubkey?: string }` |
| `join_error` | Server→Client | `{ message: string }` |
| `action` | Client→Server | `{ type: "move", dx, dy }` or `{ type: "attack", dirX, dirY }` |
| `init` | Server→Client | `{ playerId, state, config, arenaId, mode }` |
| `state` | Server→Client | `{ type: "state", state: GameState }` |
| `arena_ready` | Server→Client | `{ arenaId, mode }` |
| `arena_cycle` | Server→Client | `{ arenaId, mode }` |

## State Management

- **In-memory**: `GameState` (players, zones, attacks, phase) in `GameEngine`
- **Connection tracking**: `Map<string, ClientConnection>` in `server.ts`
- **On-chain**: RitArena SDK (arena accounts, entry accounts, profiles on Solana Devnet)
- **Frontend**: Zustand store (`store/gameStore.ts`) for reactive UI updates
