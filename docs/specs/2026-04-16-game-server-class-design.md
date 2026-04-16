# GameServer Class + Agent Discovery — Design Spec

## Goal

Add `GameServer` class to `@ritarena/sdk` that handles the full arena lifecycle for game developers. Add agent-facing APIs (arena discovery, account subscriptions, standard WS protocol). Add `RitArenaError` with actionable error messages. All in one SDK — no new packages.

## Decisions

- Lives in `@ritarena/sdk` as new exports
- Full lifecycle abstraction — developer doesn't call `submitElimination` directly
- Oracle never holds agent private keys — `finish()` takes PublicKeys, agents claim prizes themselves
- Two setup modes: production (agents enter themselves) and demo (server holds bot keypairs)
- Mock mode built into GameServer — `mock: true` flag, no separate adapter needed
- Standard agent-server WS protocol defined (recommended, not enforced)

---

## Part 1: GameServer (Game Developer API)

### API

```ts
import { GameServer, RitArenaError } from "@ritarena/sdk";

const game = new GameServer(connection, oracleKeypair, {
  entryFee: 5_000_000,
  maxAgents: 8,
  prizeSplit: [60, 30, 10],
  actionSchema: "up,down,left,right",
  mock: false,  // true = skip all RPC, simulate in memory
});

// --- Production mode ---
const arenaId = await game.createAndWait();
// ... agents enter on their own ...
await game.start();

// --- Demo mode ---
await game.setupWithBots(botKeypairs);

// --- During gameplay ---
const result = await game.reportRound(eliminated, scores, actions);
// result: { confirmed: boolean; tx?: string; round: number }

// --- End game ---
await game.finish([
  { pubkey: winner1, rank: 1 },
  { pubkey: winner2, rank: 2 },
  { pubkey: winner3, rank: 3 },
]);

// --- Cancel/Abort ---
await game.cancel();  // cancels arena (only during Registration)
await game.abandon(); // abandons arena (after timeout, triggers refunds)

// --- Events ---
game.on("log", (entry: LogEntry) => {});
game.on("phase", (phase: string) => {});
game.on("error", (err: RitArenaError) => {});

// --- Getters ---
game.arenaId;       // number | null
game.phase;         // "idle" | "setup" | "active" | "finished" | "cancelled"
game.currentRound;  // on-chain round number
game.getArenaInfo(); // ArenaInfo object for UI
```

### GameServerConfig

```ts
interface GameServerConfig {
  entryFee: number;
  maxAgents: number;
  minAgents?: number;           // default: 2
  prizeSplit: number[];
  actionSchema: string;
  duration?: number;            // default: 3600
  eliminationInterval?: number; // default: duration + 100
  creatorFeeBps?: number;       // default: 0
  stakeBondAmount?: number;     // default: 0
  retryAttempts?: number;       // default: 3
  retryBaseDelay?: number;      // default: 1000ms
  mock?: boolean;               // default: false — skip RPC, simulate in memory
}
```

### Key Method Changes from v1

#### `reportRound` (renamed from `reportElimination`)

Supports rounds with deaths, score-only rounds, or both:

```ts
async reportRound(
  eliminated: PublicKey[],     // can be empty — score-only round
  scores: ScoreUpdate[],
  actions: GameAction[]
): Promise<RoundReport>

interface RoundReport {
  confirmed: boolean;  // true if on-chain tx succeeded
  tx?: string;         // tx signature (if on-chain)
  round: number;       // the round number that was submitted
}
```

- Empty `eliminated` + non-empty `scores` = score update round (still submits on-chain to record Merkle root)
- Non-empty `eliminated` = elimination round
- On non-retryable failure: returns `{ confirmed: false }` + emits error event (doesn't throw)

#### `finish` (multiple winners)

```ts
async finish(winners: Array<{ pubkey: PublicKey; rank: number }>): Promise<void>
```

- Maps to `FinalizeArenaParams.winners` directly
- Must match `prizeSplit` length (e.g., 3 winners for `[60, 30, 10]`)
- Auto-collects protocol fee
- Winners claim prizes themselves via `sdk.claimPrize(arenaId)`

#### `cancel(): Promise<void>`

- Only works during Registration phase (before `start()`)
- Calls `sdk.cancelArena()` on-chain
- Agents get refunds automatically
- Sets phase to "cancelled"

#### `abandon(): Promise<void>`

- Works after timeout (`eliminationInterval * 2` since last submission)
- Calls `sdk.abandonArena()` on-chain
- Slashes stake bond, agents get entry fee refunds
- Sets phase to "cancelled"

### Mock Mode

When `mock: true`:
- No `Connection` or `Keypair` needed (can pass `null`)
- All methods simulate success immediately
- `reportRound` returns `{ confirmed: true, tx: "mock-tx-...", round: N }`
- Events still fire (log, phase) for UI testing
- Tracks state in memory (round counter, arena info, entries)

```ts
// Mock mode — zero setup
const game = new GameServer(null, null, { ...config, mock: true });
await game.setupWithBots([]); // no real keypairs needed
```

### Internal State

```ts
class GameServer {
  private connection: Connection | null;
  private oracleKeypair: Keypair | null;
  private sdk: RitArena | null;
  private config: GameServerConfig;

  private _arenaId: number | null = null;
  private _phase: Phase = "idle";
  private onChainRound = 0;
  private entryPdas: Map<string, PublicKey> = new Map();
  private allEntryPdas: PublicKey[] = [];
  private roundLock = false;
  private emitter: EventEmitter;
  private mockState: MockState | null = null;  // when mock: true
}
```

---

## Part 2: Agent Discovery (Agent Developer API)

### Arena Listing

Add to `RitArenaReader`:

```ts
// List all arenas, optionally filtered
async listArenas(filter?: ArenaFilter): Promise<Arena[]>

interface ArenaFilter {
  state?: "registration" | "active" | "finished";  // filter by state
  maxEntryFee?: number;      // only arenas with fee <= this
  minPrizePool?: number;     // only arenas with pool >= this
  creator?: PublicKey;       // only arenas by this creator
}
```

Implementation: uses `getProgramAccounts` with `memcmp` filters on the Arena account discriminator + state field.

### Account Subscriptions

Add to `RitArenaReader`:

```ts
// Watch an arena entry for changes (elimination, prize assignment)
watchEntry(arenaId: number, agentOwner: PublicKey, 
  callback: (entry: ArenaEntry) => void
): () => void  // returns unsubscribe function

// Watch an arena for state changes
watchArena(arenaId: number,
  callback: (arena: Arena) => void
): () => void  // returns unsubscribe function
```

Implementation: uses `connection.onAccountChange()` on the PDA.

This lets agents:
- Know when they've been eliminated (entry.alive → false)
- Know when they've won (entry.prizeRank > 0)
- Know when arena finishes (arena.state → Finished)
- Know when to claim prizes

---

## Part 3: Agent-Server WS Protocol (Recommended Standard)

Not enforced by SDK, but documented as the recommended protocol. Game developers can use it or define their own.

### Messages: Server → Agent

```ts
// Game state update (every tick or on change)
{ type: "state", round: number, data: any }

// Agent was eliminated
{ type: "eliminated", reason: string }

// Game finished
{ type: "finished", winners: Array<{ pubkey: string; rank: number }>, arenaId: number }

// Arena info on connect
{ type: "arena", arenaId: number, actionSchema: string, config: any }

// Error
{ type: "error", message: string }
```

### Messages: Agent → Server

```ts
// Submit action
{ type: "action", action: string }  // must match actionSchema

// Identify on connect
{ type: "identify", pubkey: string, signature: string }
// signature = sign(arenaId) with agent keypair — proves ownership
```

This protocol is documented in SDK README, not implemented in SDK code. Game developers copy the types and adapt to their game.

---

## Part 4: RitArenaError

```ts
type ErrorCode =
  | "PROTOCOL_NOT_INITIALIZED"
  | "ARENA_NOT_FOUND"
  | "ARENA_ALREADY_FINISHED"
  | "ARENA_NOT_ACTIVE"
  | "ARENA_NOT_REGISTRATION"
  | "INVALID_PHASE"
  | "INVALID_ROUND"
  | "PROFILE_NOT_FOUND"
  | "INSUFFICIENT_SOL"
  | "INSUFFICIENT_USDC"
  | "NO_USDC_ACCOUNT"
  | "ENTRY_NOT_FOUND"
  | "NOT_ENOUGH_AGENTS"
  | "ROUND_IN_PROGRESS"
  | "WINNER_NOT_FOUND"
  | "WINNERS_MISMATCH";  // winners.length != prizeSplit.length

class RitArenaError extends Error {
  code: ErrorCode;
  suggestion: string;

  constructor(code: ErrorCode, message: string, suggestion: string) {
    super(message);
    this.code = code;
    this.suggestion = suggestion;
  }
}
```

## Part 5: Pre-flight Validation in Existing SDK Methods

Add `RitArenaError` throws to `RitArena` class methods:

| Method | Validation |
|---|---|
| `enterArena` | Arena exists? State == Registration? |
| `submitElimination` | Arena exists? State != Finished? roundNumber == currentRound + 1? |
| `finalizeArena` | Arena exists? State == Active or Eliminating? |
| `startArena` | Arena exists? State == Registration? currentAgents >= minAgents? |
| `claimPrize` | Arena exists? State == Finished? Entry has prizeRank > 0? Not already claimed? |

---

## Files

| File | Change |
|---|---|
| `packages/sdk/src/game-server.ts` | **New** — GameServer class + MockState |
| `packages/sdk/src/errors.ts` | **New** — RitArenaError + ErrorCode |
| `packages/sdk/src/reader.ts` | Add `listArenas()`, `watchEntry()`, `watchArena()` |
| `packages/sdk/src/client.ts` | Add pre-flight validation to all mutation methods |
| `packages/sdk/src/types.ts` | Add `GameServerConfig`, `RoundReport`, `ArenaFilter`, `ArenaInfo` |
| `packages/sdk/src/index.ts` | Export new types + classes |
| `packages/sdk/package.json` | Bump to 0.3.0 |
