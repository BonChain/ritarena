# Rules & Constraints

## Coding Conventions

### TypeScript
- Server: `strict: true`, `module: NodeNext`, `moduleResolution: NodeNext`, `skipLibCheck: true`
- Frontend: `verbatimModuleSyntax: true`, `noUnusedLocals: true`, `noUnusedParameters: true`
- Agent: plain JavaScript ESM (`"type": "module"`)

### ESM Modules
- All server/frontend imports use `.js` extension (required for ESM)
- Dynamic `import()` for async loads
- No CommonJS `require()`

### Environment-Driven Config
- All config via env vars with defaults in `config.ts`
- No hardcoded magic numbers in game logic (all from env/config)
- `.env` files gitignored; real values injected at runtime

### Gitignore
- **Never commit:** `*.json` keypairs (`keypair.json`, `agent/bots/bot-*.json`), `.env` files, `dist/`, `build/`, `node_modules/`

## Module Responsibilities

| Module | Responsibility | Forbidden |
|--------|---------------|-----------|
| `server/src/server.ts` | HTTP, Socket.IO, game loop orchestration | No rendering |
| `server/src/game/` | All game logic: physics, combat, zones, phases | No blockchain, no HTTP |
| `server/src/arena.service.ts` | All blockchain interactions | No game logic |
| `server/src/config.ts` | Env loading only | No side effects |
| `frontend/src/` | Rendering + HUD (Preact) + network receive | No game logic, no blockchain |
| `agent/index.js` | AI decision + action emit | No rendering, no blockchain |

## Game Rules

### Map
- 2D grid: `MAP_WIDTH × MAP_HEIGHT` units (default 20×20)
- Coordinates: `(x, y)` with `(0,0)` at top-left
- Boundary: players clamped to `[0, MAP_WIDTH]` / `[0, MAP_HEIGHT]`

### Player
```typescript
{ id, x, y, hp, score, dirX, dirY, state, invulnTime, stunTime, attackCooldown, ... }
```
| Property | Value |
|----------|-------|
| Max HP | 100 |
| Speed | 5 units/tick |
| Attack damage | 20 |
| Attack cooldown | 2 seconds |
| Starting zone | None |

### Movement
- Client sends `{ type: "move", dx, dy }` where `dx, dy ∈ [-1, 1]`
- Server normalizes vector, applies speed, clamps to map bounds
- `physics.ts`: position integration + friction + boundary clamping

### Attack
- Client sends `{ type: "attack", dirX, dirY }` (direction vector)
- Server spawns `Attack` projectile moving along direction
- Projectile hits first player in radius → apply 20 damage
- Dead players (HP ≤ 0) are marked `alive: false`

### Zones
- 3 zones on map at fixed positions
- Zone is a circle with `ZONE_RADIUS` (default 3 units)
- Capture: player inside zone → capture progress increases
- Owner scores `ZONE_SCORE_RATE` (default 2) points per second
- Zone ownership displayed in renderer with color + owner ID

### Elimination
- After `eliminateStartTime` (10s into PLAYING), lowest-score player removed every 10s
- 1 elimination per round report cycle
- Eliminated players cannot rejoin until next match

### Scoring
- Zone owner: +2 score/second (ZONE_SCORE_RATE)
- Per elimination: additional score (defined by arena)
- Top 3 players at match end receive prize distribution on-chain

### Phases
```
waiting ──(MIN_PLAYERS reached)──> countdown ──(WAIT_TIME)──> playing ──(ROUND_TIME=60s)──> waiting
                                                            │
                                                (eliminate lowest every 10s after 10s)
```

| Phase | Condition to enter | Duration |
|-------|-------------------|----------|
| waiting | Match ended or started | Until MIN_PLAYERS |
| countdown | waiting + MIN_PLAYERS | WAIT_TIME seconds |
| playing | countdown timer expires | ROUND_TIME seconds |

## Socket Event Contracts

### Client → Server
```typescript
// join game
socket.emit("join_game", { role: "spectator" | "player", pubkey?: string })

// action
socket.emit("action", { type: "move", dx: number, dy: number })
socket.emit("action", { type: "attack", dirX: number, dirY: number })

// request history
socket.emit("get_history", number)
```

### Server → Client
```typescript
// init (on join)
{
  playerId: string | null,
  state: GameState,
  config: GameConfig,
  arenaId: number,
  mode: "mock" | "onchain",
  sessionId: string,
  entryFee: number,
  prizeSplit: number[],
  maxPlayers: number,
  rpcUrl: string
}

// state broadcast (every tick)
{ type: "state", state: GameState }

// arena events
{ arenaId: number, mode: string, sessionId: string }
{ arenaId: number, mode: string, sessionId: string, state: GameState } // arena_cycle includes state

// history
ArenaWinner[]
```

## Agent Constraints

| Parameter | Value |
|-----------|-------|
| Decision interval | 150ms |
| Retry join attempts | up to 48 with exponential backoff |
| Behaviors | `kite()` (HP < 30), `holdZone()`, `fight()`, `findFreeZone()` |
| Target priority | Nearest zone → nearest enemy |

## Blockchain Rules

| Action | Trigger | On-Chain Call |
|--------|---------|--------------|
| Create arena | Server startup | `ritArena.createArena()` |
| Register player | Client join as player | `ritArena.registerParticipant(pubkey)` |
| Report round | Every 10s during PLAYING | `ritArena.reportRound(merkleProof)` |
| Finish arena | When match ends | `ritArena.finishArena()` |
| Recycle session | After arena finish | `ritArena.recycleSession()` |
| Collect protocol fee | After arena finish | `ritArena.collectProtocolFee()` |

- All on-chain amounts in micro-USDC (entry fee, prizes)
- Merkle proofs: `computeMerkleRoot` from leaves `{ playerId, score, eliminations }`
- Wallet keypairs derived via SHA256 seed from master key

## Mock Mode

`ARENA_MODE=mock` bypasses all blockchain calls. Game loop runs fully in-memory. Used for:
- Local development without SOL/USDC
- Testing game mechanics without network latency
- CI/testing pipelines

Toggle via `server/.env`: `ARENA_MODE=mock` or `ARENA_MODE=onchain`.
