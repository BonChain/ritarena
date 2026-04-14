# @ritarena/sdk — TypeScript SDK Design

**Date:** 2026-04-14
**Status:** Approved
**Package:** `@ritarena/sdk`
**Location:** `packages/sdk/`

## Goal

TypeScript SDK that wraps the RitArena Anchor program. Developers create arenas, register agents, enter competitions, and claim prizes without constructing raw transactions.

## Architecture

```
@ritarena/sdk
├── src/
│   ├── index.ts              # Main exports
│   ├── client.ts             # RitArena class (write operations, needs wallet)
│   ├── reader.ts             # RitArenaReader class (read-only, no wallet)
│   ├── pda.ts                # All PDA derivation helpers
│   ├── types.ts              # TypeScript types (from IDL + custom)
│   ├── constants.ts          # Program ID, seeds, fee constants
│   ├── merkle.ts             # Merkle proof verification
│   └── devnet.ts             # Devnet helper (airdrop SOL, mint test USDC)
├── tests/
│   └── sdk.test.ts           # Integration tests using local validator or LiteSVM
├── package.json
├── tsconfig.json
└── README.md
```

## Dependencies

- `@coral-xyz/anchor` — IDL-based program client, account deserialization
- `@solana/web3.js` — Connection, Keypair, PublicKey
- `@solana/spl-token` — USDC token operations (ATA lookup, balance checks)

No other dependencies. No custom framework.

## API Surface

### Constructor

```typescript
// With wallet (for transactions)
const sdk = new RitArena(connection, wallet);

// Read-only (no wallet needed)
const reader = RitArena.readOnly(connection);

// Devnet quick-start (airdrops SOL, mints test USDC)
const sdk = await RitArena.devnet(keypairPath?);
```

`wallet` is an `AnchorWallet` interface (has `publicKey` and `signTransaction`) — works with browser wallet adapters and Keypair-based signers.

### Write Operations (require wallet)

```typescript
// Profile
await sdk.registerProfile(name: string): Promise<string>  // returns tx sig

// Arena creation
await sdk.createArena(config: CreateArenaConfig): Promise<{ arenaId: number, tx: string }>

// Arena entry
await sdk.enterArena(arenaId: number): Promise<string>

// Oracle (game server)
await sdk.startArena(arenaId: number): Promise<string>
await sdk.submitElimination(arenaId: number, params: SubmitEliminationParams): Promise<string>
await sdk.finalizeArena(arenaId: number, params: FinalizeArenaParams): Promise<string>

// Claims
await sdk.claimPrize(arenaId: number): Promise<string>
await sdk.claimCreatorFee(arenaId: number): Promise<string>
await sdk.returnStakeBond(arenaId: number): Promise<string>

// Refunds
await sdk.refundEntry(arenaId: number): Promise<string>

// Permissionless
await sdk.abandonArena(arenaId: number): Promise<string>
await sdk.cancelArena(arenaId: number): Promise<string>
await sdk.collectProtocolFee(arenaId: number): Promise<string>
```

### Read Operations (no wallet needed)

```typescript
// Accounts
await sdk.getArena(arenaId: number): Promise<Arena | null>
await sdk.getProfile(owner: PublicKey): Promise<AgentProfile | null>
await sdk.getEntry(arenaId: number, profileOwner: PublicKey): Promise<ArenaEntry | null>
await sdk.getProtocol(): Promise<ProtocolConfig | null>

// Derived data
await sdk.getLeaderboard(arenaId: number): Promise<LeaderboardEntry[]>
await sdk.getArenaEntries(arenaId: number): Promise<ArenaEntry[]>

// Merkle verification
sdk.verifyMerkleProof(root: Uint8Array, leaf: Uint8Array, proof: Uint8Array[]): boolean
```

### Types

```typescript
interface CreateArenaConfig {
  entryFee: number;          // in USDC lamports (6 decimals)
  maxAgents: number;
  minAgents: number;
  duration: number;          // seconds
  eliminationInterval: number;
  eliminationPercent: number; // 1-99
  creatorFeeBps: number;     // 0-2000
  prizeSplit: number[];      // percentages summing to 100
  actionSchema: string;
  rulesHash: Uint8Array;     // 32 bytes
  stakeBondAmount?: number;  // optional, defaults to 0
  minArenasCompleted?: number;
  minWins?: number;
  minRegistrationAge?: number;
}

interface SubmitEliminationParams {
  merkleRoot: Uint8Array;    // 32 bytes
  roundNumber: number;
  eliminated: PublicKey[];   // entry PDAs to eliminate
  scores: ScoreUpdate[];
  entryAccounts: PublicKey[]; // all entry PDAs to update (remaining accounts)
}

interface FinalizeArenaParams {
  merkleRoot: Uint8Array;
  winners: PrizeAssignment[];
  entryAccounts: PublicKey[];
}

interface ScoreUpdate {
  entry: PublicKey;
  score: number;
}

interface PrizeAssignment {
  entry: PublicKey;
  rank: number;
}

interface LeaderboardEntry {
  owner: PublicKey;
  profileName: string;
  score: number;
  alive: boolean;
  rank: number;
}

// Re-export Anchor-generated types
type Arena = IdlAccounts<RitarenaIDL>["arena"];
type AgentProfile = IdlAccounts<RitarenaIDL>["agentProfile"];
type ArenaEntry = IdlAccounts<RitarenaIDL>["arenaEntry"];
type ProtocolConfig = IdlAccounts<RitarenaIDL>["protocolConfig"];
type ArenaState = IdlTypes<RitarenaIDL>["ArenaState"];
```

### PDA Helpers (exported)

```typescript
import { pdas } from "@ritarena/sdk";

pdas.protocol(): PublicKey
pdas.treasury(): PublicKey
pdas.agentProfile(owner: PublicKey): PublicKey
pdas.arena(arenaId: number): PublicKey
pdas.arenaEntry(arena: PublicKey, profile: PublicKey): PublicKey
pdas.arenaVault(arena: PublicKey): PublicKey
pdas.bondVault(arena: PublicKey): PublicKey
```

### Constants (exported)

```typescript
import { PROGRAM_ID, REGISTRATION_FEE, PROTOCOL_FEE_BPS, MAX_CREATOR_FEE_BPS } from "@ritarena/sdk";
```

### Devnet Helper

```typescript
// Quick start for devnet development
const sdk = await RitArena.devnet();
// This:
// 1. Creates or loads keypair from ~/.config/solana/id.json
// 2. Connects to devnet
// 3. Airdrops 2 SOL if balance < 1
// 4. Checks for test USDC mint (or uses the protocol's configured mint)
```

### Battle Royale Template

```typescript
import { BATTLE_ROYALE_TEMPLATE } from "@ritarena/sdk";

// Default config — override any field
await sdk.createArena({
  ...BATTLE_ROYALE_TEMPLATE,
  entryFee: 10_000_000,
  actionSchema: "up,down,left,right",
});
```

```typescript
const BATTLE_ROYALE_TEMPLATE: CreateArenaConfig = {
  entryFee: 5_000_000,
  maxAgents: 20,
  minAgents: 2,
  duration: 3600,
  eliminationInterval: 600,
  eliminationPercent: 25,
  creatorFeeBps: 500,
  prizeSplit: [60, 30, 10],
  actionSchema: "move,attack,defend",
  rulesHash: new Uint8Array(32),
  stakeBondAmount: 0,
  minArenasCompleted: 0,
  minWins: 0,
  minRegistrationAge: 0,
};
```

## Internal Implementation

Each write method:
1. Derives all required PDAs
2. Looks up wallet's USDC ATA (via `@solana/spl-token`)
3. Calls the Anchor program method via the IDL client
4. Returns transaction signature

Each read method:
1. Derives the PDA
2. Fetches + deserializes the account via Anchor's `program.account`
3. Returns typed object or null

`getLeaderboard` uses `getProgramAccounts` with a memcmp filter on ArenaEntry.arena field to find all entries for an arena, then sorts by score descending.

## What's NOT in the SDK

- Transaction construction internals (hidden behind methods)
- Game logic (that's the game server)
- UI components (that's `@ritarena/ui`)
- Merkle tree construction (that's the game server — SDK only verifies proofs)
- Wallet creation/funding (except devnet helper)

## Testing

Integration tests against a local validator (or LiteSVM via a thin Node.js bridge):
1. Register profile
2. Create arena with Battle Royale template
3. Enter arena
4. Read arena state, leaderboard
5. Verify PDA derivations match on-chain
