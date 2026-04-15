# GameServer Class — Design Spec

## Goal

Add a `GameServer` class to `@ritarena/sdk` that handles the full arena lifecycle — round tracking, retry, validation, Merkle trees, protocol fees — so game developers only report deaths and winners. Also add `RitArenaError` with descriptive error messages that tell developers what to do.

## Decisions

- Lives in `@ritarena/sdk` as a new export (no new package)
- Full lifecycle abstraction — developer doesn't call `submitElimination` directly
- Oracle never holds agent private keys — `finish()` takes PublicKey, agents claim prizes themselves
- Two setup modes: production (agents enter themselves) and demo (server holds bot keypairs)

## API

```ts
import { GameServer, RitArenaError } from "@ritarena/sdk";

const game = new GameServer(connection, oracleKeypair, {
  entryFee: 5_000_000,
  maxAgents: 8,
  prizeSplit: [100],
  actionSchema: "up,down,left,right",
});

// --- Production mode ---
// Server creates arena, agents enter on their own
const arenaId = await game.createAndWait();
// ... agents call sdk.enterArena(arenaId) themselves ...
await game.start();  // transitions arena to Active

// --- Demo mode ---
// Server holds bot keypairs (testing/demo only)
await game.setupWithBots(botKeypairs);  // create + register + enter + start

// --- During gameplay ---
await game.reportElimination(deadPublicKeys, scores, actions);
// internally: builds Merkle tree, tracks round number, retries, validates

// --- End game ---
await game.finish(winnerPublicKey);
// internally: finalizeArena + collectProtocolFee
// winner calls sdk.claimPrize(arenaId) themselves

// --- Events ---
game.on("log", (entry: LogEntry) => { /* SDK call happened */ });
game.on("phase", (phase: string) => { /* lifecycle transition */ });
game.on("error", (err: RitArenaError) => { /* non-fatal error */ });

// --- Getters ---
game.arenaId;       // number | null
game.phase;         // "idle" | "setup" | "active" | "finished"
game.currentRound;  // on-chain round number
```

## GameServer Internals

### State

```ts
class GameServer {
  private connection: Connection;
  private oracleKeypair: Keypair;
  private sdk: RitArena;
  private config: GameServerConfig;

  private _arenaId: number | null = null;
  private _phase: "idle" | "setup" | "active" | "finished" = "idle";
  private onChainRound = 0;
  private entryPdas: Map<string, PublicKey> = new Map();  // pubkey58 -> entryPda
  private allEntryPdas: PublicKey[] = [];
  private eliminationLock = false;
  private emitter: EventEmitter;
}
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
  eliminationInterval?: number; // default: duration + 100 (disable auto-elimination)
  creatorFeeBps?: number;       // default: 0
  stakeBondAmount?: number;     // default: 0
  retryAttempts?: number;       // default: 3
  retryBaseDelay?: number;      // default: 1000ms
}
```

### Methods

#### `createAndWait(): Promise<number>`
1. Validate: phase must be "idle"
2. Build `CreateArenaConfig` from `GameServerConfig` + defaults
3. Generate `rulesHash` from actionSchema
4. Call `sdk.createArena()` with retry
5. Poll until arena account visible on RPC (max 30s)
6. Store arenaId, set phase to "setup"
7. Emit phase + log events
8. Return arenaId

#### `setupWithBots(keypairs: Keypair[]): Promise<number>`
1. Call `createAndWait()`
2. For each keypair:
   - Check if profile exists, if not `registerProfile()`
   - Check if USDC token account exists and has balance
   - Call `enterArena()`
   - Store entryPda mapping
3. Call `start()`
4. Return arenaId

#### `start(): Promise<void>`
1. Validate: phase must be "setup", arenaId exists
2. Read arena, check `currentAgents >= minAgents`
3. Call `sdk.startArena()` with retry
4. Set phase to "active"
5. Emit phase + log events

#### `reportElimination(eliminated: PublicKey[], scores: ScoreUpdate[], actions: GameAction[]): Promise<void>`
1. Validate: phase must be "active", not locked
2. Acquire lock
3. Validate: all eliminated pubkeys have entry PDAs
4. Build Merkle tree from actions
5. Call `sdk.submitElimination()` with:
   - `roundNumber: onChainRound + 1`
   - `eliminated`: mapped to entry PDAs
   - `scores`: mapped to entry PDAs
   - `merkleRoot`: computed from actions
   - `entryAccounts`: all entry PDAs
6. On success: increment `onChainRound`
7. On retryable failure: retry with backoff
8. On non-retryable failure: emit error event, don't throw (game continues)
9. Release lock

#### `finish(winner: PublicKey): Promise<void>`
1. Validate: phase must be "active"
2. Map winner to entry PDA
3. Build final Merkle root
4. Call `sdk.finalizeArena()` with retry (3 attempts, 2s delay)
5. Call `sdk.collectProtocolFee()` (ignore if already collected)
6. Set phase to "finished"
7. Emit phase + log events
8. Note: winner must call `sdk.claimPrize()` themselves

#### `getArenaInfo(): ArenaInfo`
Returns current arena state for UI display:
```ts
interface ArenaInfo {
  arenaId: number;
  entryFee: number;
  prizePool: number;
  prizeSplit: number[];
  currentRound: number;
  phase: string;
  arenaPda: string;           // base58
  explorerUrl?: string;       // if devnet/mainnet
}
```

### Retry Logic

```ts
private async retryRpc<T>(fn: () => Promise<T>, label: string): Promise<T> {
  for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isRetryable(err) || attempt === maxRetries) throw err;
      const delay = baseDelay * 2^(attempt-1), capped at 8s;
      this.emit("log", { message: `${label} retry ${attempt}/${max}`, kind: "info" });
      await sleep(delay);
    }
  }
}

function isRetryable(err): boolean {
  return message includes "timeout" | "429" | "blockhash" | "Blockhash not found";
}
```

## RitArenaError

```ts
// packages/sdk/src/errors.ts

type ErrorCode =
  | "PROTOCOL_NOT_INITIALIZED"
  | "ARENA_NOT_FOUND"
  | "ARENA_ALREADY_FINISHED"
  | "ARENA_NOT_ACTIVE"
  | "INVALID_PHASE"
  | "PROFILE_NOT_FOUND"
  | "INSUFFICIENT_SOL"
  | "INSUFFICIENT_USDC"
  | "NO_USDC_ACCOUNT"
  | "ENTRY_NOT_FOUND"
  | "NOT_ENOUGH_AGENTS"
  | "ELIMINATION_IN_PROGRESS"
  | "WINNER_NOT_FOUND";

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

### Error Examples

```ts
// BEFORE (cryptic Anchor error)
"AnchorError caused by account: owner_usdc. Error Code: AccountNotInitialized"

// AFTER (actionable RitArenaError)
RitArenaError {
  code: "NO_USDC_ACCOUNT",
  message: "Bot 7wso9h6Z has no USDC token account",
  suggestion: "Run: npx ritarena setup-devnet, or create an ATA for mint Gh9ZwEm..."
}
```

```ts
// BEFORE
"Error: Arena not found"

// AFTER
RitArenaError {
  code: "ARENA_NOT_FOUND",
  message: "Arena 5 not found on-chain",
  suggestion: "Arena may not have propagated yet. GameServer.createAndWait() handles this automatically."
}
```

## Pre-flight Validation in Existing SDK Methods

Add validation to `RitArena` class methods (not just GameServer):

```ts
// client.ts — enterArena
async enterArena(arenaId: number): Promise<string> {
  const arena = await this.getArena(arenaId);
  if (!arena) throw new RitArenaError("ARENA_NOT_FOUND", ...);
  if (!("registration" in arena.state))
    throw new RitArenaError("ARENA_NOT_ACTIVE",
      `Arena ${arenaId} is in ${stateLabel(arena.state)} state, not Registration`,
      "Agents can only enter during Registration phase");
  // ... existing logic
}

// client.ts — submitElimination
async submitElimination(arenaId: number, params: SubmitEliminationParams): Promise<string> {
  const arena = await this.getArena(arenaId);
  if (!arena) throw new RitArenaError("ARENA_NOT_FOUND", ...);
  if ("finished" in arena.state)
    throw new RitArenaError("ARENA_ALREADY_FINISHED",
      `Arena ${arenaId} is Finished`,
      "Cannot submit elimination after finalization");
  if (params.roundNumber !== arena.currentRound + 1)
    throw new RitArenaError("INVALID_ROUND",
      `Expected round ${arena.currentRound + 1}, got ${params.roundNumber}`,
      "Use GameServer which tracks round numbers automatically");
  // ... existing logic
}
```

## Files

| File | Change |
|---|---|
| `packages/sdk/src/game-server.ts` | **New** — GameServer class |
| `packages/sdk/src/errors.ts` | **New** — RitArenaError + error codes |
| `packages/sdk/src/index.ts` | Export GameServer, RitArenaError |
| `packages/sdk/src/client.ts` | Add pre-flight validation to enterArena, submitElimination, finalizeArena, startArena, claimPrize |
| `packages/sdk/package.json` | Bump version to 0.3.0 |

## What This Does NOT Cover

- `create-ritarena-game` CLI tool — separate project
- Agent-side SDK (how agents register/enter/claim) — already works via `RitArena` class
- WebSocket / game loop — that's the game developer's responsibility
- Devnet setup script — stays in example project
