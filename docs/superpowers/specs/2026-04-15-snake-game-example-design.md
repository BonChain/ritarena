# Snake Game Example — Design Spec

## Goal

A runnable, well-documented slither.io-style snake game example that demonstrates how to build a custom game on RitArena. AI bots play against each other on a shrinking map, with round-based on-chain elimination via the RitArena SDK.

The primary audience is developers evaluating RitArena. The focus is on **how RitArena integrates with a custom game**, not on game engine sophistication.

## Decisions

- **UI**: Vanilla HTML Canvas + JS, no framework, no bundler
- **Server**: Node.js + `ws` (WebSocket)
- **AI agents**: Hardcoded strategies (no LLM)
- **Game style**: Real-time snake movement with round-based elimination (map shrinks each round)
- **On-chain**: Mock by default, `--devnet` flag for real devnet
- **Location**: `examples/snake-game/` — standalone project, imports `@ritarena/sdk`

## Project Structure

```
examples/snake-game/
├── src/
│   ├── server.ts            # WS server + static file serving + game orchestration
│   ├── engine.ts            # Snake game logic: movement, collision, food, map shrink
│   ├── bot.ts               # Hardcoded bot strategies
│   ├── arena-adapter.ts     # ArenaAdapter interface + DevnetAdapter (RitArena SDK)
│   └── mock-adapter.ts      # In-memory MockAdapter
├── public/
│   ├── index.html           # Single page: canvas + scoreboard
│   └── game.js              # Client-side renderer
├── package.json
├── tsconfig.json
└── README.md
```

## Game Flow

```
npm start          → mock mode (runs immediately, no wallet needed)
npm start --devnet → devnet mode (requires wallet + SOL + USDC)
```

### Lifecycle

1. Server boots, creates arena via `ArenaAdapter.createArena()`
   - Config: `eliminationPercent: 1`, `eliminationInterval` > `duration` (disable auto-elimination)
   - `actionSchema: "up,down,left,right"`
   - `prizeSplit: [100]` (winner takes all)
2. Spawn 6-8 bots, each calls `enterArena()`
3. `startArena()` — game loop begins
4. **During a round** (30 seconds): snakes move in real-time, eat food, can die from collisions
5. **End of round**: map shrinks, collect all deaths from that round → `submitElimination()` with scores and merkle root
6. Repeat until one snake remains → `finalizeArena()` with prize ranking
7. Client shows winner + Solana Explorer link (devnet mode)

### Why This Maps Cleanly to RitArena

- Each round = one `submitElimination` call with `roundNumber` incrementing
- Deaths within a round are batched naturally (snakes that died during those 30 seconds)
- No awkward real-time-to-round conversion — the game has actual rounds (map shrink events)
- `eliminationPercent` is set to minimum (1) because elimination is driven by game logic, not by the contract

## Game Engine (`engine.ts`)

### Map
- Grid: 800x800 pixels
- Safe zone: rectangle that starts at full map size
- Shrinks 15% per round (each side moves inward)
- Snakes outside the safe zone die

### Snake
- Moves on a grid, one cell per tick
- Grows longer when eating food
- Dies when: hitting wall, hitting own body, hitting another snake, leaving safe zone
- Score = food eaten (1 point per food)

### Food
- Random spawn within safe zone
- Constant count maintained (e.g., 10 food items on map at all times)

### Tick
- Server ticks every 100ms
- Each tick: move all snakes → check collisions → spawn food if needed
- Sends full game state to all connected WS clients

### Rounds
- 30 seconds per round
- At round end: shrink safe zone, collect deaths, submit elimination on-chain
- New round starts immediately after

## Bot Strategies (`bot.ts`)

Each bot implements: `decideMove(state: GameState): Direction`

Where `GameState` contains: own snake position/body, all other snakes, food positions, safe zone bounds.

### Strategies

| Name | Logic |
|------|-------|
| **Greedy** | Move toward nearest food, basic wall avoidance |
| **Cautious** | Avoid other snakes (keep distance > 3 cells), then seek food |
| **Aggressive** | Move toward nearest snake's head to block it |
| **Random** | Pick a random valid direction (not into wall/self) |

## Arena Adapter

```ts
interface ArenaAdapter {
  createArena(config: CreateArenaConfig): Promise<{ arenaId: number }>;
  enterArena(arenaId: number, botName: string): Promise<{ entryId: string }>;
  startArena(arenaId: number): Promise<void>;
  submitElimination(arenaId: number, params: SubmitEliminationParams): Promise<void>;
  finalizeArena(arenaId: number, params: FinalizeArenaParams): Promise<void>;
}
```

### MockAdapter (`mock-adapter.ts`)
- In-memory state tracking
- Logs every call to console with readable output:
  ```
  [RitArena] createArena → arenaId: 0, maxAgents: 8, prizeSplit: [100]
  [RitArena] enterArena → bot "greedy-1" entered arena 0
  [RitArena] submitElimination → round 2, eliminated: [greedy-1, random-1], scores: [...]
  [RitArena] finalizeArena → winner: cautious-1 (rank 1)
  ```

### DevnetAdapter (`arena-adapter.ts`)
- Uses `RitArena.fromKeypair()` from `@ritarena/sdk`
- Each bot gets a derived keypair (from a single master keypair + index)
- Logs transaction signatures + explorer links

## Client UI (`public/`)

### Canvas
- Draws snakes in distinct colors per strategy (green=greedy, blue=cautious, red=aggressive, gray=random)
- Food as small circles
- Safe zone boundary as a red dashed line
- Dead snakes fade out

### Scoreboard (side panel)
- Bot name, strategy, score, alive/dead status
- Round counter + countdown timer
- Shrink zone indicator

### RitArena Log Panel (bottom)
- Scrolling log of all SDK calls happening in real-time
- Shows: which call, parameters, tx hash (devnet mode)
- This is the key educational element — user sees exactly when and why each on-chain call happens

## README Contents

1. Quick start (`npm install && npm start`)
2. What this demonstrates (RitArena game integration)
3. Architecture diagram (server ↔ bots ↔ SDK ↔ Solana)
4. Devnet setup instructions
5. How to add your own bot strategy
6. How to adapt this for your own game
