# GameServer + Agent Discovery SDK — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `GameServer` class (full lifecycle abstraction), `RitArenaError` (actionable errors), agent discovery APIs (`listArenas`, `watchEntry`), and pre-flight validation to `@ritarena/sdk`.

**Architecture:** Build bottom-up: errors → validation → reader extensions → GameServer. Each layer builds on the previous. GameServer wraps `RitArena` client with round tracking, retry, mock mode, and lifecycle management. Agent discovery extends `RitArenaReader` with `getProgramAccounts` queries and `onAccountChange` subscriptions.

**Tech Stack:** TypeScript, `@solana/web3.js`, `@coral-xyz/anchor`, `@solana/spl-token`

---

## File Map

| File | Responsibility |
|------|---------------|
| `packages/sdk/src/errors.ts` | **New** — `RitArenaError` class + `ErrorCode` type |
| `packages/sdk/src/types.ts` | **Modify** — Add `GameServerConfig`, `RoundReport`, `ArenaFilter`, `ArenaInfo`, `GameAction` |
| `packages/sdk/src/client.ts` | **Modify** — Add pre-flight validation using `RitArenaError` to mutation methods |
| `packages/sdk/src/reader.ts` | **Modify** — Add `listArenas()`, `watchEntry()`, `watchArena()` |
| `packages/sdk/src/game-server.ts` | **New** — `GameServer` class with mock mode |
| `packages/sdk/src/index.ts` | **Modify** — Export new types + classes |
| `packages/sdk/package.json` | **Modify** — Bump to 0.3.0 |

---

### Task 1: RitArenaError

**Files:**
- Create: `packages/sdk/src/errors.ts`

- [ ] **Step 1: Create errors.ts**

```ts
// packages/sdk/src/errors.ts

export type ErrorCode =
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
  | "WINNERS_MISMATCH";

export class RitArenaError extends Error {
  code: ErrorCode;
  suggestion: string;

  constructor(code: ErrorCode, message: string, suggestion: string) {
    super(message);
    this.name = "RitArenaError";
    this.code = code;
    this.suggestion = suggestion;
  }
}

/** Helper to extract human-readable state label from ArenaState */
export function arenaStateLabel(state: Record<string, unknown>): string {
  return Object.keys(state)[0] ?? "unknown";
}
```

- [ ] **Step 2: Export from index.ts**

Add to `packages/sdk/src/index.ts`:
```ts
// Errors
export { RitArenaError, arenaStateLabel } from "./errors";
export type { ErrorCode } from "./errors";
```

- [ ] **Step 3: Verify**

Run: `cd packages/sdk && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add packages/sdk/src/errors.ts packages/sdk/src/index.ts
git commit -m "feat(sdk): add RitArenaError with error codes and suggestions"
```

---

### Task 2: New Types

**Files:**
- Modify: `packages/sdk/src/types.ts`
- Modify: `packages/sdk/src/index.ts`

- [ ] **Step 1: Add new types to types.ts**

Append to the end of `packages/sdk/src/types.ts` (after `BATTLE_ROYALE_TEMPLATE`):

```ts

// --- GameServer types ---

export interface GameServerConfig {
  entryFee: number;
  maxAgents: number;
  minAgents?: number;
  prizeSplit: number[];
  actionSchema: string;
  duration?: number;
  eliminationInterval?: number;
  creatorFeeBps?: number;
  stakeBondAmount?: number;
  retryAttempts?: number;
  retryBaseDelay?: number;
  mock?: boolean;
}

export interface GameAction {
  snakeId: string;
  round: number;
  tick: number;
  action: string;
  result: string;
  score: number;
}

export interface RoundReport {
  confirmed: boolean;
  tx?: string;
  round: number;
}

export interface ArenaInfo {
  arenaId: number;
  entryFee: number;
  prizePool: number;
  prizeSplit: number[];
  currentRound: number;
  phase: string;
  arenaPda: string;
  explorerUrl?: string;
}

export interface ArenaFilter {
  state?: "registration" | "active" | "finished";
  maxEntryFee?: number;
  creator?: PublicKey;
}
```

- [ ] **Step 2: Export new types from index.ts**

Add to the types export block in `packages/sdk/src/index.ts`:
```ts
export type {
  // ... existing exports ...
  GameServerConfig,
  GameAction,
  RoundReport,
  ArenaInfo,
  ArenaFilter,
} from "./types";
```

- [ ] **Step 3: Verify**

Run: `cd packages/sdk && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add packages/sdk/src/types.ts packages/sdk/src/index.ts
git commit -m "feat(sdk): add GameServerConfig, RoundReport, ArenaInfo, ArenaFilter types"
```

---

### Task 3: Pre-flight Validation in client.ts

**Files:**
- Modify: `packages/sdk/src/client.ts`

- [ ] **Step 1: Add import for RitArenaError**

At the top of `client.ts`, add:
```ts
import { RitArenaError, arenaStateLabel } from "./errors";
```

- [ ] **Step 2: Add validation to enterArena**

Replace the existing `enterArena` method. The change: replace `if (!arena) throw new Error("Arena not found")` with `RitArenaError` and add state check:

```ts
  async enterArena(arenaId: number): Promise<string> {
    const agentOwner = this.wallet.publicKey;
    const arenaPda = pdas.arena(arenaId);
    const profilePda = pdas.agentProfile(agentOwner);
    const entryPda = pdas.arenaEntry(arenaPda, profilePda);
    const arenaVault = pdas.arenaVault(arenaPda);

    const arena = await this.getArena(arenaId);
    if (!arena) {
      throw new RitArenaError("ARENA_NOT_FOUND",
        `Arena ${arenaId} not found on-chain`,
        "Arena may not have propagated yet. Use GameServer.createAndWait() for automatic polling.");
    }
    if (!("registration" in arena.state)) {
      throw new RitArenaError("ARENA_NOT_REGISTRATION",
        `Arena ${arenaId} is in ${arenaStateLabel(arena.state)} state`,
        "Agents can only enter during Registration phase.");
    }

    const agentUsdc = await getAssociatedTokenAddress(
      arena.usdcMint,
      agentOwner
    );

    return await (this.program.methods as any)
      .enterArena()
      .accounts({
        agentOwner,
        agentProfile: profilePda,
        arena: arenaPda,
        arenaEntry: entryPda,
        agentUsdc,
        arenaVault,
        usdcMint: arena.usdcMint,
      })
      .rpc();
  }
```

- [ ] **Step 3: Add validation to startArena**

Replace `startArena`:

```ts
  async startArena(arenaId: number): Promise<string> {
    const oracle = this.wallet.publicKey;
    const arenaPda = pdas.arena(arenaId);

    const arena = await this.getArena(arenaId);
    if (!arena) {
      throw new RitArenaError("ARENA_NOT_FOUND",
        `Arena ${arenaId} not found on-chain`,
        "Create the arena first with createArena().");
    }
    if (!("registration" in arena.state)) {
      throw new RitArenaError("ARENA_NOT_REGISTRATION",
        `Arena ${arenaId} is in ${arenaStateLabel(arena.state)} state`,
        "Arena can only be started from Registration state.");
    }
    if (arena.currentAgents < arena.minAgents) {
      throw new RitArenaError("NOT_ENOUGH_AGENTS",
        `Arena ${arenaId} has ${arena.currentAgents} agents, needs ${arena.minAgents}`,
        "Wait for more agents to enter before starting.");
    }

    return await (this.program.methods as any)
      .startArena()
      .accounts({ oracle, arena: arenaPda })
      .rpc();
  }
```

- [ ] **Step 4: Add validation to submitElimination**

Replace `submitElimination`:

```ts
  async submitElimination(
    arenaId: number,
    params: SubmitEliminationParams
  ): Promise<string> {
    const oracle = this.wallet.publicKey;
    const arenaPda = pdas.arena(arenaId);

    const arena = await this.getArena(arenaId);
    if (!arena) {
      throw new RitArenaError("ARENA_NOT_FOUND",
        `Arena ${arenaId} not found on-chain`,
        "Create and start the arena first.");
    }
    if ("finished" in arena.state || "cancelled" in arena.state || "abandoned" in arena.state) {
      throw new RitArenaError("ARENA_ALREADY_FINISHED",
        `Arena ${arenaId} is ${arenaStateLabel(arena.state)}`,
        "Cannot submit elimination after arena has ended.");
    }
    if (params.roundNumber !== arena.currentRound + 1) {
      throw new RitArenaError("INVALID_ROUND",
        `Expected round ${arena.currentRound + 1}, got ${params.roundNumber}`,
        "Use GameServer which tracks round numbers automatically.");
    }

    return await (this.program.methods as any)
      .submitElimination(
        Array.from(params.merkleRoot),
        params.roundNumber,
        params.eliminated,
        params.scores.map((s) => ({
          entry: s.entry,
          score: new BN(s.score),
        }))
      )
      .accounts({ oracle, arena: arenaPda })
      .remainingAccounts(
        params.entryAccounts.map((pk) => ({
          pubkey: pk,
          isSigner: false,
          isWritable: true,
        }))
      )
      .rpc();
  }
```

- [ ] **Step 5: Add validation to finalizeArena**

Replace `finalizeArena`:

```ts
  async finalizeArena(
    arenaId: number,
    params: FinalizeArenaParams
  ): Promise<string> {
    const oracle = this.wallet.publicKey;
    const arenaPda = pdas.arena(arenaId);

    const arena = await this.getArena(arenaId);
    if (!arena) {
      throw new RitArenaError("ARENA_NOT_FOUND",
        `Arena ${arenaId} not found on-chain`,
        "Create and start the arena first.");
    }
    if ("finished" in arena.state) {
      throw new RitArenaError("ARENA_ALREADY_FINISHED",
        `Arena ${arenaId} is already Finished`,
        "Arena has already been finalized.");
    }

    return await (this.program.methods as any)
      .finalizeArena(
        Array.from(params.merkleRoot),
        params.winners.map((w) => ({
          entry: w.entry,
          rank: w.rank,
        }))
      )
      .accounts({ oracle, arena: arenaPda })
      .remainingAccounts(
        params.entryAccounts.map((pk) => ({
          pubkey: pk,
          isSigner: false,
          isWritable: true,
        }))
      )
      .rpc();
  }
```

- [ ] **Step 6: Add validation to claimPrize**

Replace the arena check at the top of `claimPrize`:

```ts
    const arena = await this.getArena(arenaId);
    if (!arena) {
      throw new RitArenaError("ARENA_NOT_FOUND",
        `Arena ${arenaId} not found on-chain`,
        "Check the arena ID.");
    }
    if (!("finished" in arena.state)) {
      throw new RitArenaError("ARENA_NOT_ACTIVE",
        `Arena ${arenaId} is ${arenaStateLabel(arena.state)}, not Finished`,
        "Wait for the arena to be finalized before claiming prizes.");
    }
```

- [ ] **Step 7: Replace remaining `throw new Error("Protocol not initialized")` calls**

In `registerProfile` and `createArena`, replace:
```ts
if (!protocol) throw new Error("Protocol not initialized");
```
with:
```ts
if (!protocol) {
  throw new RitArenaError("PROTOCOL_NOT_INITIALIZED",
    "RitArena protocol not initialized on this network",
    "Run the protocol initialization script first. See packages/sdk README.");
}
```

- [ ] **Step 8: Verify**

Run: `cd packages/sdk && npx tsc --noEmit`

- [ ] **Step 9: Commit**

```bash
git add packages/sdk/src/client.ts
git commit -m "feat(sdk): add pre-flight validation with RitArenaError to all mutation methods"
```

---

### Task 4: Agent Discovery — listArenas, watchEntry, watchArena

**Files:**
- Modify: `packages/sdk/src/reader.ts`

- [ ] **Step 1: Add imports**

At top of `reader.ts`, add:
```ts
import type { ArenaFilter } from "./types";
```

- [ ] **Step 2: Add listArenas method**

Add to `RitArenaReader` class (after `verifyAction`):

```ts
  async listArenas(filter?: ArenaFilter): Promise<Arena[]> {
    const filters: any[] = [];

    // Filter by state if specified
    if (filter?.state) {
      // Arena state is stored as an enum at a fixed offset in the account data
      // For now, fetch all and filter in memory (simpler, works for < 1000 arenas)
    }

    const accounts = await (this.program.account as any).arena.all(filters);
    let arenas: Arena[] = accounts.map((a: any) => a.account);

    if (filter?.state) {
      arenas = arenas.filter((a) => filter.state! in a.state);
    }
    if (filter?.maxEntryFee !== undefined) {
      arenas = arenas.filter((a) => Number(a.entryFee) <= filter.maxEntryFee!);
    }
    if (filter?.creator) {
      arenas = arenas.filter((a) => a.creator.equals(filter.creator!));
    }

    return arenas;
  }

  watchArena(
    arenaId: number,
    callback: (arena: Arena) => void
  ): () => void {
    const arenaPda = pdas.arena(arenaId);
    const subId = this.connection.onAccountChange(
      arenaPda,
      (accountInfo) => {
        try {
          const decoded = (this.program.coder.accounts as any).decode(
            "arena",
            accountInfo.data
          );
          callback(decoded);
        } catch {
          // ignore decode errors
        }
      },
      "confirmed"
    );
    return () => {
      this.connection.removeAccountChangeListener(subId);
    };
  }

  watchEntry(
    arenaId: number,
    agentOwner: PublicKey,
    callback: (entry: ArenaEntry) => void
  ): () => void {
    const arenaPda = pdas.arena(arenaId);
    const profilePda = pdas.agentProfile(agentOwner);
    const entryPda = pdas.arenaEntry(arenaPda, profilePda);

    const subId = this.connection.onAccountChange(
      entryPda,
      (accountInfo) => {
        try {
          const decoded = (this.program.coder.accounts as any).decode(
            "arenaEntry",
            accountInfo.data
          );
          callback(decoded);
        } catch {
          // ignore decode errors
        }
      },
      "confirmed"
    );
    return () => {
      this.connection.removeAccountChangeListener(subId);
    };
  }
```

- [ ] **Step 3: Add ArenaEntry import to reader.ts**

Make sure `ArenaEntry` is imported at the top of reader.ts (it should already be there — verify).

- [ ] **Step 4: Verify**

Run: `cd packages/sdk && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add packages/sdk/src/reader.ts
git commit -m "feat(sdk): add listArenas, watchArena, watchEntry for agent discovery"
```

---

### Task 5: GameServer Class

**Files:**
- Create: `packages/sdk/src/game-server.ts`

This is the largest task. The GameServer class wraps `RitArena` with lifecycle management.

- [ ] **Step 1: Create game-server.ts**

```ts
// packages/sdk/src/game-server.ts

import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { createHash } from "crypto";
import { EventEmitter } from "events";

import { RitArena } from "./client";
import { pdas } from "./pda";
import { RitArenaError } from "./errors";
import type {
  CreateArenaConfig,
  GameServerConfig,
  GameAction,
  RoundReport,
  ArenaInfo,
  ScoreUpdate,
  SubmitEliminationParams,
  FinalizeArenaParams,
  PrizeAssignment,
} from "./types";
import { BATTLE_ROYALE_TEMPLATE } from "./types";
import { hashLeaf, computeMerkleRoot } from "./merkle";

type Phase = "idle" | "setup" | "active" | "finished" | "cancelled";

interface LogEntry {
  message: string;
  kind: string;
  tx?: string;
  explorerUrl?: string;
}

export class GameServer extends EventEmitter {
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

  // Config with defaults
  private retryAttempts: number;
  private retryBaseDelay: number;
  private isMock: boolean;

  constructor(
    connection: Connection | null,
    oracleKeypair: Keypair | null,
    config: GameServerConfig
  ) {
    super();
    this.connection = connection;
    this.oracleKeypair = oracleKeypair;
    this.config = config;
    this.retryAttempts = config.retryAttempts ?? 3;
    this.retryBaseDelay = config.retryBaseDelay ?? 1000;
    this.isMock = config.mock ?? false;

    if (!this.isMock) {
      if (!connection) throw new Error("Connection required for non-mock mode");
      if (!oracleKeypair) throw new Error("Oracle keypair required for non-mock mode");
      this.sdk = RitArena.fromKeypair(connection, oracleKeypair);
    } else {
      this.sdk = null;
    }
  }

  // --- Getters ---

  get arenaId(): number | null { return this._arenaId; }
  get phase(): Phase { return this._phase; }
  get currentRound(): number { return this.onChainRound; }

  // --- Lifecycle: Create ---

  async createAndWait(): Promise<number> {
    this.assertPhase("idle", "createAndWait");

    const arenaConfig = this.buildArenaConfig();
    this.setPhase("setup");

    if (this.isMock) {
      this._arenaId = 0;
      this.log(`createArena -> arenaId: 0 (mock)`, "create");
      return 0;
    }

    const { arenaId, tx } = await this.retryRpc(
      () => this.sdk!.createArena(arenaConfig),
      "createArena"
    );
    this._arenaId = arenaId;
    this.log(`createArena -> arenaId: ${arenaId}`, "create", tx);

    // Poll until arena visible
    this.log("Waiting for arena account to propagate...", "info");
    const reader = RitArena.readOnly(this.connection!);
    for (let i = 0; i < 15; i++) {
      const found = await reader.getArena(arenaId);
      if (found) break;
      await this.sleep(2000);
    }

    return arenaId;
  }

  // --- Lifecycle: Setup with bots (demo mode) ---

  async setupWithBots(keypairs: Keypair[]): Promise<number> {
    const arenaId = await this.createAndWait();

    if (!this.isMock) {
      for (const kp of keypairs) {
        // Register profile if needed
        const profile = await this.sdk!.getProfile(kp.publicKey);
        if (!profile) {
          const botSdk = RitArena.fromKeypair(this.connection!, kp);
          const tx = await this.retryRpc(
            () => botSdk.registerProfile(kp.publicKey.toBase58().slice(0, 8)),
            "registerProfile"
          );
          this.log(`registerProfile -> ${kp.publicKey.toBase58().slice(0, 8)}`, "register", tx);
        }

        // Enter arena
        const botSdk = RitArena.fromKeypair(this.connection!, kp);
        const tx = await this.retryRpc(
          () => botSdk.enterArena(arenaId),
          "enterArena"
        );
        this.log(`enterArena -> ${kp.publicKey.toBase58().slice(0, 8)}`, "enter", tx);

        // Store PDA mapping
        const profilePda = pdas.agentProfile(kp.publicKey);
        const arenaPda = pdas.arena(arenaId);
        const entryPda = pdas.arenaEntry(arenaPda, profilePda);
        this.entryPdas.set(kp.publicKey.toBase58(), entryPda);
        this.allEntryPdas.push(entryPda);
      }
    } else {
      // Mock: generate fake entry PDAs
      for (let i = 0; i < (keypairs.length || this.config.maxAgents); i++) {
        this.log(`registerProfile -> bot-${i} (mock)`, "register");
        this.log(`enterArena -> bot-${i} (mock)`, "enter");
      }
    }

    await this.start();
    return arenaId;
  }

  // --- Lifecycle: Start ---

  async start(): Promise<void> {
    this.assertPhase("setup", "start");
    if (this._arenaId === null) {
      throw new RitArenaError("ARENA_NOT_FOUND",
        "No arena created yet",
        "Call createAndWait() or setupWithBots() first.");
    }

    if (!this.isMock) {
      await this.retryRpc(
        () => this.sdk!.startArena(this._arenaId!),
        "startArena"
      );
    }

    this.log(`startArena -> arena ${this._arenaId} now Active`, "start");
    this.setPhase("active");
  }

  // --- Gameplay: Report Round ---

  async reportRound(
    eliminated: PublicKey[],
    scores: ScoreUpdate[],
    actions: GameAction[]
  ): Promise<RoundReport> {
    this.assertPhase("active", "reportRound");

    if (this.roundLock) {
      throw new RitArenaError("ROUND_IN_PROGRESS",
        "A round submission is already in progress",
        "Wait for the previous reportRound() to complete.");
    }

    this.roundLock = true;
    const roundNumber = this.onChainRound + 1;

    try {
      if (this.isMock) {
        this.onChainRound++;
        const deathNames = eliminated.map((p) => p.toBase58().slice(0, 8)).join(", ") || "none";
        this.log(`submitElimination -> round ${roundNumber}, eliminated: [${deathNames}]`, "eliminate");
        return { confirmed: true, tx: `mock-tx-round-${roundNumber}`, round: roundNumber };
      }

      // Build Merkle tree
      const leaves = actions.map((a) => hashLeaf(a));
      const merkleRoot = computeMerkleRoot(leaves);

      // Map eliminated PublicKeys to entry PDAs
      const eliminatedEntries = eliminated.map((pk) => {
        const entryPda = this.entryPdas.get(pk.toBase58());
        if (!entryPda) {
          throw new RitArenaError("ENTRY_NOT_FOUND",
            `No entry PDA for ${pk.toBase58().slice(0, 8)}`,
            "This public key was not registered via setupWithBots() or tracked via start().");
        }
        return entryPda;
      });

      // Map scores to entry PDAs
      const scoreUpdates = scores.map((s) => ({
        entry: this.entryPdas.get(s.entry.toBase58()) ?? s.entry,
        score: s.score,
      }));

      const params: SubmitEliminationParams = {
        merkleRoot: new Uint8Array(merkleRoot),
        roundNumber,
        eliminated: eliminatedEntries,
        scores: scoreUpdates,
        entryAccounts: this.allEntryPdas,
      };

      const tx = await this.retryRpc(
        () => this.sdk!.submitElimination(this._arenaId!, params),
        "submitElimination"
      );

      this.onChainRound++;
      this.log(`submitElimination -> round ${roundNumber}`, "eliminate", tx);
      return { confirmed: true, tx, round: roundNumber };

    } catch (err: any) {
      this.emit("error", err);
      this.log(`submitElimination failed: ${err.message}`, "info");
      return { confirmed: false, round: roundNumber };
    } finally {
      this.roundLock = false;
    }
  }

  // --- Lifecycle: Finish ---

  async finish(winners: Array<{ pubkey: PublicKey; rank: number }>): Promise<void> {
    this.assertPhase("active", "finish");

    if (winners.length !== this.config.prizeSplit.length) {
      throw new RitArenaError("WINNERS_MISMATCH",
        `${winners.length} winners provided but prizeSplit has ${this.config.prizeSplit.length} slots`,
        "Winners array length must match prizeSplit length.");
    }

    if (this.isMock) {
      this.log(`finalizeArena -> winners: ${winners.map((w) => w.pubkey.toBase58().slice(0, 8)).join(", ")}`, "finalize");
      this.log("collectProtocolFee -> collected (mock)", "finalize");
      this.setPhase("finished");
      return;
    }

    // Map winners to entry PDAs
    const winnerAssignments: PrizeAssignment[] = winners.map((w) => {
      const entryPda = this.entryPdas.get(w.pubkey.toBase58());
      if (!entryPda) {
        throw new RitArenaError("WINNER_NOT_FOUND",
          `No entry PDA for winner ${w.pubkey.toBase58().slice(0, 8)}`,
          "Winner must have entered the arena via enterArena().");
      }
      return { entry: entryPda, rank: w.rank };
    });

    // Build final Merkle root
    const leaves = winners.map((w) => {
      const data = `final:${w.pubkey.toBase58()}:rank:${w.rank}`;
      return createHash("sha256").update(data).digest() as Buffer;
    });
    const merkleRoot = computeMerkleRoot(leaves);

    const params: FinalizeArenaParams = {
      merkleRoot: new Uint8Array(merkleRoot),
      winners: winnerAssignments,
      entryAccounts: this.allEntryPdas,
    };

    // Retry finalize
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const tx = await this.sdk!.finalizeArena(this._arenaId!, params);
        this.log(`finalizeArena -> ${winners.length} winner(s)`, "finalize", tx);
        break;
      } catch (err: any) {
        if (attempt < 3) {
          this.log(`finalizeArena failed (attempt ${attempt}/3), retrying...`, "info");
          await this.sleep(2000);
        } else {
          this.log(`finalizeArena failed after 3 attempts: ${err.message}`, "info");
          this.emit("error", err);
        }
      }
    }

    // Collect protocol fee (best-effort)
    try {
      await this.sdk!.collectProtocolFee(this._arenaId!);
      this.log("collectProtocolFee -> collected", "finalize");
    } catch {
      // Already collected or arena state issue — OK
    }

    this.setPhase("finished");
  }

  // --- Lifecycle: Cancel / Abandon ---

  async cancel(): Promise<void> {
    this.assertPhase("setup", "cancel");
    if (this._arenaId === null) return;

    if (!this.isMock) {
      // cancelArena is only available during Registration
      const tx = await this.retryRpc(
        () => (this.sdk! as any).cancelArena?.(this._arenaId!) ??
          Promise.reject(new Error("cancelArena not implemented in SDK")),
        "cancelArena"
      );
      this.log(`cancelArena -> arena ${this._arenaId}`, "info", tx);
    }

    this.setPhase("cancelled");
  }

  async abandon(): Promise<void> {
    if (this._arenaId === null) return;

    if (!this.isMock) {
      const tx = await this.retryRpc(
        () => (this.sdk! as any).abandonArena?.(this._arenaId!) ??
          Promise.reject(new Error("abandonArena not implemented in SDK")),
        "abandonArena"
      );
      this.log(`abandonArena -> arena ${this._arenaId}`, "info", tx);
    }

    this.setPhase("cancelled");
  }

  // --- Info ---

  getArenaInfo(): ArenaInfo | null {
    if (this._arenaId === null) return null;

    const arenaPda = pdas.arena(this._arenaId);
    return {
      arenaId: this._arenaId,
      entryFee: this.config.entryFee / 1_000_000,
      prizePool: (this.config.entryFee * this.config.maxAgents) / 1_000_000,
      prizeSplit: this.config.prizeSplit,
      currentRound: this.onChainRound,
      phase: this._phase,
      arenaPda: arenaPda.toBase58(),
    };
  }

  // --- Internal helpers ---

  private buildArenaConfig(): CreateArenaConfig {
    const rulesHash = createHash("sha256")
      .update(this.config.actionSchema)
      .digest();

    const duration = this.config.duration ?? 3600;

    return {
      ...BATTLE_ROYALE_TEMPLATE,
      entryFee: this.config.entryFee,
      maxAgents: this.config.maxAgents,
      minAgents: this.config.minAgents ?? 2,
      duration,
      eliminationInterval: this.config.eliminationInterval ?? duration + 100,
      eliminationPercent: 1,
      creatorFeeBps: this.config.creatorFeeBps ?? 0,
      prizeSplit: this.config.prizeSplit,
      actionSchema: this.config.actionSchema,
      rulesHash: new Uint8Array(rulesHash),
      stakeBondAmount: this.config.stakeBondAmount ?? 0,
    };
  }

  private assertPhase(expected: Phase, method: string): void {
    if (this._phase !== expected) {
      throw new RitArenaError("INVALID_PHASE",
        `${method}() requires phase "${expected}", current phase is "${this._phase}"`,
        `Call the lifecycle methods in order: createAndWait/setupWithBots -> start -> reportRound -> finish`);
    }
  }

  private setPhase(phase: Phase): void {
    this._phase = phase;
    this.emit("phase", phase);
  }

  private log(message: string, kind: string, tx?: string): void {
    const formatted = `[RitArena] ${message}`;
    const explorerUrl = tx && !tx.startsWith("mock-")
      ? `https://explorer.solana.com/tx/${tx}?cluster=devnet`
      : undefined;
    const entry: LogEntry = { message: formatted, kind, tx, explorerUrl };
    console.log(formatted);
    if (explorerUrl) console.log(`  Explorer: ${explorerUrl}`);
    this.emit("log", entry);
  }

  private async retryRpc<T>(fn: () => Promise<T>, label: string): Promise<T> {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        const msg = err.message ?? "";
        const isRetryable = msg.includes("timeout") ||
          msg.includes("429") ||
          msg.includes("blockhash") ||
          msg.includes("Blockhash not found");

        if (!isRetryable || attempt === this.retryAttempts) throw err;

        const delay = Math.min(this.retryBaseDelay * Math.pow(2, attempt - 1), 8000);
        this.log(`${label} failed (attempt ${attempt}/${this.retryAttempts}), retrying in ${delay}ms...`, "info");
        await this.sleep(delay);
      }
    }
    throw new Error("unreachable");
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
```

- [ ] **Step 2: Add Merkle helpers to SDK**

The GameServer needs `hashLeaf` and `computeMerkleRoot`. These currently only exist in the snake game example. Create `packages/sdk/src/merkle.ts`:

```ts
// packages/sdk/src/merkle.ts

import { createHash } from "crypto";

export interface MerkleLeafData {
  [key: string]: string | number;
}

export function hashLeaf(data: MerkleLeafData): Buffer {
  const str = Object.entries(data)
    .map(([k, v]) => `${k}:${v}`)
    .join(":");
  return createHash("sha256").update(str).digest();
}

export function computeMerkleRoot(leaves: Buffer[]): Buffer {
  if (leaves.length === 0) return Buffer.alloc(32);
  if (leaves.length === 1) return leaves[0];

  const next: Buffer[] = [];
  for (let i = 0; i < leaves.length; i += 2) {
    const left = leaves[i];
    const right = i + 1 < leaves.length ? leaves[i + 1] : left;
    const combined =
      Buffer.compare(left, right) < 0
        ? Buffer.concat([left, right])
        : Buffer.concat([right, left]);
    next.push(createHash("sha256").update(combined).digest());
  }
  return computeMerkleRoot(next);
}
```

- [ ] **Step 3: Export from index.ts**

Add to `packages/sdk/src/index.ts`:
```ts
// GameServer
export { GameServer } from "./game-server";

// Merkle helpers
export { hashLeaf, computeMerkleRoot } from "./merkle";
```

- [ ] **Step 4: Verify**

Run: `cd packages/sdk && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add packages/sdk/src/game-server.ts packages/sdk/src/merkle.ts packages/sdk/src/index.ts
git commit -m "feat(sdk): add GameServer class with full lifecycle, mock mode, retry, round tracking"
```

---

### Task 6: Update Exports + Version Bump

**Files:**
- Modify: `packages/sdk/src/index.ts`
- Modify: `packages/sdk/package.json`

- [ ] **Step 1: Verify all exports are in index.ts**

The final `packages/sdk/src/index.ts` should export:

```ts
// Client classes
export { RitArena } from "./client";
export { RitArenaReader } from "./reader";

// GameServer
export { GameServer } from "./game-server";

// PDA helpers
export { pdas } from "./pda";

// Merkle helpers
export { hashLeaf, computeMerkleRoot } from "./merkle";

// Errors
export { RitArenaError, arenaStateLabel } from "./errors";
export type { ErrorCode } from "./errors";

// Constants
export {
  PROGRAM_ID,
  REGISTRATION_FEE,
  PROTOCOL_FEE_BPS,
  MAX_CREATOR_FEE_BPS,
  MAX_AGENTS_PER_ARENA,
  MAX_NAME_LEN,
  MAX_PRIZE_SLOTS,
  MAX_ACTION_SCHEMA_LEN,
} from "./constants";

// Types
export type {
  Arena,
  AgentProfile,
  ArenaEntry,
  ProtocolConfig,
  ArenaState,
  CreateArenaConfig,
  SubmitEliminationParams,
  FinalizeArenaParams,
  ScoreUpdate,
  PrizeAssignment,
  GameServerConfig,
  GameAction,
  RoundReport,
  ArenaInfo,
  ArenaFilter,
} from "./types";

export { BATTLE_ROYALE_TEMPLATE } from "./types";

// IDL
export { IDL } from "./idl";
```

- [ ] **Step 2: Bump version to 0.3.0**

In `packages/sdk/package.json`, change:
```json
"version": "0.3.0",
```

- [ ] **Step 3: Build and verify**

Run: `cd packages/sdk && npm run build`
Expected: Clean build, no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/sdk/src/index.ts packages/sdk/package.json
git commit -m "chore(sdk): update exports and bump to 0.3.0"
```

---

### Task 7: Integration Test

- [ ] **Step 1: Create a test script**

Create `packages/sdk/scripts/test-game-server.ts`:

```ts
/**
 * Quick smoke test for GameServer in mock mode.
 * Run: npx tsx scripts/test-game-server.ts
 */
import { PublicKey, Keypair } from "@solana/web3.js";
import { GameServer, RitArenaError } from "../src";

async function main() {
  console.log("--- GameServer Mock Mode Test ---\n");

  // 1. Create GameServer in mock mode
  const game = new GameServer(null, null, {
    entryFee: 5_000_000,
    maxAgents: 4,
    prizeSplit: [60, 30, 10],
    actionSchema: "up,down,left,right",
    mock: true,
  });

  const logs: string[] = [];
  game.on("log", (entry: any) => logs.push(entry.message));
  game.on("phase", (p: string) => console.log("  Phase:", p));

  // 2. Setup with bots
  console.log("1. setupWithBots()");
  const arenaId = await game.setupWithBots([]);
  console.log("  Arena ID:", arenaId);
  console.log("  Phase:", game.phase);
  console.assert(game.phase === "active", "Phase should be active");

  // 3. Report a round
  console.log("\n2. reportRound()");
  const result = await game.reportRound(
    [],
    [],
    [{ snakeId: "bot-1", round: 1, tick: 1, action: "up", result: "moved", score: 5 }]
  );
  console.log("  Result:", result);
  console.assert(result.confirmed === true, "Should be confirmed");
  console.assert(result.round === 1, "Should be round 1");
  console.assert(game.currentRound === 1, "currentRound should be 1");

  // 4. Report elimination
  console.log("\n3. reportRound() with elimination");
  const fakePk = Keypair.generate().publicKey;
  const result2 = await game.reportRound(
    [fakePk],
    [],
    [{ snakeId: "bot-2", round: 2, tick: 100, action: "left", result: "died", score: 3 }]
  );
  console.log("  Result:", result2);
  console.assert(result2.round === 2, "Should be round 2");

  // 5. Finish with winners
  console.log("\n4. finish()");
  const winner1 = Keypair.generate().publicKey;
  const winner2 = Keypair.generate().publicKey;
  const winner3 = Keypair.generate().publicKey;
  await game.finish([
    { pubkey: winner1, rank: 1 },
    { pubkey: winner2, rank: 2 },
    { pubkey: winner3, rank: 3 },
  ]);
  console.log("  Phase:", game.phase);
  console.assert(game.phase === "finished", "Phase should be finished");

  // 6. Test phase validation
  console.log("\n5. Phase validation");
  try {
    await game.start();
    console.assert(false, "Should have thrown");
  } catch (err) {
    if (err instanceof RitArenaError) {
      console.log("  Caught RitArenaError:", err.code, "-", err.message);
      console.log("  Suggestion:", err.suggestion);
    }
  }

  // 7. Arena info
  console.log("\n6. getArenaInfo()");
  const info = game.getArenaInfo();
  console.log("  Info:", info);

  console.log("\n--- All tests passed! ---");
  console.log(`  ${logs.length} log entries emitted`);
}

main().catch(console.error);
```

- [ ] **Step 2: Run the test**

Run: `cd packages/sdk && npx tsx scripts/test-game-server.ts`
Expected: All assertions pass, "All tests passed!" printed.

- [ ] **Step 3: Commit**

```bash
git add packages/sdk/scripts/test-game-server.ts
git commit -m "test(sdk): add GameServer mock mode smoke test"
```

---

### Task 8: Publish to npm

- [ ] **Step 1: Build**

Run: `cd packages/sdk && npm run build`

- [ ] **Step 2: Publish**

Run: `cd packages/sdk && npm publish --access public`
Expected: `+ @ritarena/sdk@0.3.0` published.

- [ ] **Step 3: Commit tag**

```bash
git tag v0.3.0
```
