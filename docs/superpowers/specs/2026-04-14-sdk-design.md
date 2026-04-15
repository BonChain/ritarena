# @ritarena/sdk — TypeScript SDK Design

**Date:** 2026-04-14
**Status:** Approved (revised after SA + PM review)
**Package:** `@ritarena/sdk`
**Location:** `packages/sdk/`

## Goal

TypeScript SDK that wraps the RitArena Anchor program. Developers create arenas, register agents, enter competitions, and claim prizes without constructing raw transactions.

## Architecture

```
@ritarena/sdk
├── src/
│   ├── index.ts              # Main exports
│   ├── client.ts             # RitArena class (extends RitArenaReader + write ops)
│   ├── reader.ts             # RitArenaReader class (read-only, no wallet)
│   ├── pda.ts                # All PDA derivation helpers
│   ├── types.ts              # TypeScript types (from IDL + custom)
│   ├── constants.ts          # Program ID, seeds, fee constants
│   └── idl/
│       └── ritarena.json     # Bundled IDL (copied from target/idl/)
├── tests/
│   └── sdk.test.ts           # Smoke test: happy-path lifecycle
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
// With wallet (for transactions) — wallet is AnchorWallet or Keypair wrapper
const sdk = new RitArena(connection, wallet);

// From Keypair directly (game server / CLI use case)
const sdk = RitArena.fromKeypair(connection, keypair);

// Read-only (no wallet needed — spectators, dashboards)
const reader = RitArena.readOnly(connection);
```

`RitArena` extends `RitArenaReader` — all read methods available on both classes. No duplication.

### Error handling convention
- Write methods throw on failure (Anchor errors propagate as `AnchorError`).
- Read methods return `T | null` when account doesn't exist.

### Write Operations — Must-Ship (Day 1-2)

```typescript
// Profile
await sdk.registerProfile(name: string): Promise<string>

// Arena creation — oracle defaults to wallet.publicKey (creator = oracle)
await sdk.createArena(config: CreateArenaConfig): Promise<{ arenaId: number, tx: string }>

// Arena entry
await sdk.enterArena(arenaId: number): Promise<string>

// Oracle (game server) — Tenny owns these
await sdk.startArena(arenaId: number): Promise<string>
await sdk.submitElimination(arenaId: number, params: SubmitEliminationParams): Promise<string>
await sdk.finalizeArena(arenaId: number, params: FinalizeArenaParams): Promise<string>

// Claims
await sdk.claimPrize(arenaId: number): Promise<string>
await sdk.claimCreatorFee(arenaId: number): Promise<string>
await sdk.returnStakeBond(arenaId: number): Promise<string>
```

### Write Operations — Deferred (Week 3)

```typescript
await sdk.refundEntry(arenaId: number): Promise<string>
await sdk.abandonArena(arenaId: number): Promise<string>
await sdk.cancelArena(arenaId: number): Promise<string>
await sdk.collectProtocolFee(arenaId: number): Promise<string>
```

### Read Operations

```typescript
// Core account reads
await sdk.getArena(arenaId: number): Promise<Arena | null>
await sdk.getProfile(owner: PublicKey): Promise<AgentProfile | null>
await sdk.getAgentDetails(arenaId: number, profileOwner: PublicKey): Promise<ArenaEntry | null>
await sdk.getProtocol(): Promise<ProtocolConfig | null>

// Bulk reads
await sdk.getArenaEntries(arenaId: number): Promise<ArenaEntry[]>
await sdk.getProfileHistory(owner: PublicKey): Promise<ArenaEntry[]>
await sdk.getEliminationLog(arenaId: number): Promise<ArenaEntry[]>

// Merkle verification (fetches on-chain root, verifies proof)
await sdk.verifyAction(arenaId: number, leaf: Uint8Array, proof: Uint8Array[]): Promise<boolean>
```

### Implementation Notes for Key Methods

**`submitElimination` — remaining accounts pattern:**
```typescript
// CRITICAL: entryAccounts go to .remainingAccounts(), NOT as instruction args
// The on-chain handler iterates ctx.remaining_accounts to update scores/elimination
await program.methods
  .submitElimination(merkleRoot, roundNumber, eliminated, scores)
  .accounts({ oracle: wallet.publicKey, arena: arenaPda })
  .remainingAccounts(
    params.entryAccounts.map(pk => ({ pubkey: pk, isSigner: false, isWritable: true }))
  )
  .rpc();
```

**`finalizeArena` — same remaining accounts pattern:**
```typescript
await program.methods
  .finalizeArena(finalMerkleRoot, winners)
  .accounts({ oracle: wallet.publicKey, arena: arenaPda })
  .remainingAccounts(
    params.entryAccounts.map(pk => ({ pubkey: pk, isSigner: false, isWritable: true }))
  )
  .rpc();
```

**`getArenaEntries` — memcmp filter:**
```typescript
// Filter ArenaEntry accounts by arena pubkey
// Offset: 8 (discriminator) + 0 (arena is first field) = byte 8
const entries = await program.account.arenaEntry.all([
  { memcmp: { offset: 8, bytes: arenaPda.toBase58() } }
]);
```

**`getProfileHistory` — memcmp filter on agent_profile field:**
```typescript
// ArenaEntry fields: arena (32) + agent_profile (32) → offset 8 + 32 = 40
const entries = await program.account.arenaEntry.all([
  { memcmp: { offset: 40, bytes: profilePda.toBase58() } }
]);
```

**`getEliminationLog` — filter dead entries:**
```typescript
// Fetch all entries for arena, filter alive == false, sort by score desc
const entries = await sdk.getArenaEntries(arenaId);
return entries.filter(e => !e.alive).sort((a, b) => b.score - a.score);
```

**`verifyAction` — fetch root + verify:**
```typescript
async verifyAction(arenaId: number, leaf: Uint8Array, proof: Uint8Array[]): Promise<boolean> {
  const arena = await this.getArena(arenaId);
  if (!arena) return false;
  return verifyMerkleProof(arena.latestMerkleRoot, leaf, proof);
}
```

**PDA arena ID encoding — 8-byte LE buffer:**
```typescript
// arena.id is u64 on-chain — encode as 8-byte little-endian
function arenaIdToBuffer(arenaId: number): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(arenaId));
  return buf;
}
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
  entryAccounts: PublicKey[]; // REMAINING ACCOUNTS: all entry PDAs to update
}

interface FinalizeArenaParams {
  merkleRoot: Uint8Array;
  winners: PrizeAssignment[];
  entryAccounts: PublicKey[]; // REMAINING ACCOUNTS: all entry PDAs to assign
}

interface ScoreUpdate {
  entry: PublicKey;
  score: number;             // i64 on-chain; safe as number for hackathon range
}

interface PrizeAssignment {
  entry: PublicKey;
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
pdas.arena(arenaId: number): PublicKey          // encodes as 8-byte LE internally
pdas.arenaEntry(arena: PublicKey, profile: PublicKey): PublicKey
pdas.arenaVault(arena: PublicKey): PublicKey
pdas.bondVault(arena: PublicKey): PublicKey
```

### Constants (exported)

```typescript
import { PROGRAM_ID, REGISTRATION_FEE, PROTOCOL_FEE_BPS, MAX_CREATOR_FEE_BPS } from "@ritarena/sdk";
```

### Battle Royale Template

```typescript
import { BATTLE_ROYALE_TEMPLATE } from "@ritarena/sdk";

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

## Oracle Design Notes

- `arena.oracle` is set to `creator.key()` in `create_arena` (hardcoded, not a parameter)
- The game server must use the same keypair that created the arena
- USDC mint is read from `protocolConfig.usdcMint` at runtime — no hardcoded mint address

## What's NOT in the SDK

- `initialize_protocol` (one-time admin call, already done)
- Transaction construction internals (hidden behind methods)
- Game logic (that's the game server)
- UI components (that's `@ritarena/ui`)
- Merkle tree construction (game server builds trees; SDK only verifies proofs)
- Wallet creation/funding
- `devnet.ts` helper (deferred to Week 4 polish)

## Testing

One happy-path smoke test:
1. Register profile → create arena → enter arena → start → submit elimination → finalize → claim prize
2. Verify PDA derivations match
3. Cap test effort at 2 hours

## Spec Coverage

| Requirement | SDK Method | Status |
|---|---|---|
| SK-1: Wraps all instructions | All write methods | Must-ship (9) + deferred (4) |
| SK-2: npm @ritarena/sdk | Package structure | Covered |
| SK-3: Battle Royale template | `BATTLE_ROYALE_TEMPLATE` | Covered |
| SK-4: getArena, getLeaderboard, getAgentDetails, getAgentProfile, getEliminationLog | `getArena`, `getArenaEntries` (leaderboard), `getAgentDetails`, `getProfile`, `getEliminationLog` | Covered |
| SK-5: verifyAction | `verifyAction(arenaId, leaf, proof)` | Covered |
| SK-6: registerProfile, getProfile, getProfileHistory | `registerProfile`, `getProfile`, `getProfileHistory` | Covered |
