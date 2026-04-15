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
│   ├── ritarena_sdk/                # ✅ REUSABLE — copy to any game project
│   │   ├── adapter.ts               #   ArenaAdapter interface
│   │   ├── devnet-adapter.ts        #   DevnetAdapter (real SDK calls)
│   │   ├── mock-adapter.ts          #   MockAdapter (in-memory, console logs)
│   │   ├── merkle.ts                #   Merkle tree helpers (hash leaves, compute root)
│   │   └── setup-devnet.ts          #   Script: airdrop SOL + mint USDC for bot keypairs
│   │
│   ├── game/                        # 🎮 GAME-SPECIFIC — replace for your own game
│   │   ├── engine.ts                #   Snake game logic: movement, collision, food, map shrink
│   │   ├── types.ts                 #   GameState, Snake, Food, Direction, SafeZone
│   │   ├── constants.ts             #   Grid size, tick rate, round duration, shrink %
│   │   └── renderer.js              #   Canvas rendering (client-side)
│   │
│   ├── agent/                       # 🤖 AGENT-SPECIFIC — agent devs read this folder only
│   │   ├── strategies.ts            #   Greedy, Cautious, Aggressive, Random
│   │   ├── bot-runner.ts            #   Connects bot to game via WS
│   │   └── README.md                #   "How to write your own bot"
│   │
│   └── server.ts                    # Entry point: WS server + static files + orchestration
│
├── public/                          # --- UI shell ---
│   └── index.html                   #   Single page (loads game/renderer.js)
│
├── package.json
├── tsconfig.json
└── README.md
```

Three folders by audience: `ritarena_sdk/` = reusable RitArena integration (copy to any game), `game/` = snake-specific logic + renderer (replace for your game), `agent/` = bot strategies (agent devs start here). Each folder can be read independently.

This is a standalone project (not inside `packages/sdk/examples/`) because it is a full application with its own dependencies, static files, and build config — unlike the existing single-file script examples.

## Game Flow

```
npm start          → mock mode (runs immediately, no wallet needed)
npm start --devnet → devnet mode (requires wallet + SOL + USDC)
```

### Lifecycle

1. Server boots, creates arena via `ArenaAdapter.createArena()`
   - Uses `BATTLE_ROYALE_TEMPLATE` as base with overrides:
   - `entryFee: 5_000_000` (5 USDC), `maxAgents: 8`, `minAgents: 2`
   - `duration: 600` (10 min), `eliminationInterval: 700` (> duration, disables auto-elimination)
   - `eliminationPercent: 1` (minimum, unused — elimination is game-driven)
   - `creatorFeeBps: 0` (no creator fee for demo)
   - `actionSchema: "up,down,left,right"`
   - `prizeSplit: [100]` (winner takes all)
   - `rulesHash`: SHA-256 of the game rules string
2. Spawn 6-8 bots, each calls `registerProfile(botName)` then `enterArena(arenaId)`
   - Each bot needs a registered `AgentProfile` on-chain before entering
   - In devnet mode: each derived keypair needs SOL (for tx fees) + USDC (for entry fee + profile registration)
3. `startArena()` — game loop begins (requires `currentAgents >= minAgents`)
4. **During a round** (30 seconds): snakes move in real-time, eat food, can die from collisions
5. **End of round**: map shrinks, collect all deaths from that round → `submitElimination()` with:
   - Merkle root built from game actions that round (SHA-256 hash tree)
   - Incrementing `roundNumber`
   - `eliminated`: entry PDA PublicKeys of dead snakes
   - `scores`: ScoreUpdate for each entry PDA (alive or dead)
   - `entryAccounts`: ALL entry PDAs as remaining accounts
6. Repeat until one snake remains → `finalizeArena()` with:
   - Final Merkle root
   - `winners`: `[{ entry: winnerEntryPda, rank: 1 }]`
   - `entryAccounts`: ALL entry PDAs
7. Client shows winner + Solana Explorer link (devnet mode)

### Edge Case: All Snakes Die in Same Round

If all remaining snakes die simultaneously (e.g., head-on collision of last two), the snake with the higher score wins. If scores are tied, the snake that was alive longer (earlier `entryId`) wins. This ensures `finalizeArena` always has exactly one winner for `prizeSplit: [100]`.

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
- After zone shrink: food outside the new safe zone is removed and respawned inside

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

The adapter wraps the RitArena SDK and handles the complexity of PDA derivation, Merkle tree construction, and on-chain account management. Game code calls simple methods; the adapter translates to SDK calls.

```ts
interface ArenaAdapter {
  createArena(config: CreateArenaConfig): Promise<{ arenaId: number; tx: string }>;
  registerProfile(botName: string): Promise<void>;
  enterArena(arenaId: number): Promise<string>;  // returns tx signature
  startArena(arenaId: number): Promise<void>;
  submitElimination(arenaId: number, round: RoundResult): Promise<void>;
  finalizeArena(arenaId: number, winner: BotIdentity): Promise<void>;
}

// Game-level types — adapter translates these to SDK types internally
interface RoundResult {
  roundNumber: number;
  deaths: BotIdentity[];          // bots that died this round
  scores: Map<string, number>;    // botId → score
  actions: GameAction[];          // raw actions for Merkle tree
}

interface BotIdentity {
  botId: string;                  // e.g., "greedy-1"
  keypair: Keypair;               // derived keypair for this bot
}
```

The adapter internally:
- Derives entry PDAs via `pdas.arenaEntry(arenaPda, profilePda)`
- Maintains a mapping of `botId → { keypair, profilePda, entryPda }`
- Builds Merkle trees from `GameAction[]` for each `submitElimination` call
- Passes ALL entry PDAs as `entryAccounts` remaining accounts

### MockAdapter (`mock-adapter.ts`)
- In-memory state tracking, same interface
- Logs every call to console with readable output:
  ```
  [RitArena] createArena → arenaId: 0, maxAgents: 8, prizeSplit: [100]
  [RitArena] registerProfile → "greedy-1" registered
  [RitArena] enterArena → "greedy-1" entered arena 0 (tx: mock-tx-001)
  [RitArena] submitElimination → round 2, eliminated: [greedy-1, random-1], scores: [...]
  [RitArena] finalizeArena → winner: cautious-1 (rank 1)
  ```

### DevnetAdapter (`arena-adapter.ts`)
- Uses `RitArena.fromKeypair()` from `@ritarena/sdk`
- Each bot gets a derived keypair (from a single master keypair + bot index)
- Calls `registerProfile(botName)` for each bot before entering
- Devnet setup requires a `setup-devnet.ts` script that:
  1. Airdrops SOL to master keypair
  2. Derives bot keypairs and transfers SOL to each
  3. Mints/transfers USDC to each bot (entry fee + profile registration)
- Logs transaction signatures + Solana Explorer links

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
4. Devnet setup instructions (wallet setup, airdrop SOL, mint USDC, `setup-devnet.ts`)
5. How to add your own bot strategy
6. How to adapt this for your own game

## Known Limitations (acceptable for demo)

- No graceful shutdown: if the server crashes mid-game, the devnet arena stays in `Active` state. Users can call `abandonArena` after `eliminationInterval * 2` has passed to recover funds.
- Full game state sent every tick over WebSocket — fine for 6-8 snakes, not optimized for scale.
