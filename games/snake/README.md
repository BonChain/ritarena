# Snake Game — RitArena Example

A slither.io-style 8-bot battle royale that demonstrates the full RitArena SDK lifecycle: arena creation, player registration, eliminations, and payout finalization.

## Quick Start (Mock Mode)

No wallet or devnet needed — runs entirely in-memory.

```bash
cd games/snake
npm install
npm start
```

Open http://localhost:3000.

## What You'll See

- Canvas with 8 snakes competing on a 40x40 grid
- Live scoreboard showing lengths, kills, and prize shares
- RitArena log panel in the corner showing each SDK call as it fires (e.g. `createArena`, `submitElimination`, `finalizeArena`)

## Architecture

```
Browser
  |  (WebSocket)
  v
src/server.ts
  ├── src/game/          — tick loop, collision, zone shrink
  ├── src/agent/         — bot strategies (one per snake)
  └── src/ritarena_sdk/  — RitArena adapter (mock or devnet)
                               |
                               v
                          Solana (devnet / mainnet)
```

| Folder | Audience | Purpose |
|--------|----------|---------|
| `ritarena_sdk/` | Game developers | Reusable RitArena integration — copy to any game |
| `game/` | Game developers | Snake-specific logic and renderer — replace for your game |
| `agent/` | Agent developers | Bot strategies — read this to write your own bot |

## Game Rules

- 8 bots, 40x40 grid
- Eat food to grow longer and increase your score
- Die on collision with a wall, yourself, another snake, or the shrinking zone
- Zone shrinks 15% every 30 seconds
- Last snake alive wins the pot

## Devnet Mode

Each bot needs ~5 USDC (profile creation fee + entry fee). Set up a funded wallet first.

```bash
# Point CLI at devnet
solana config set --url devnet

# Fund your wallet
solana airdrop 2

# Create profiles and fund the arena
npm run setup:devnet

# Run the game against devnet
npm run start:devnet
```

## How to Write Your Own Bot

See `src/agent/README.md` for the full strategy API.

Quick example — a strategy function receives the current game state and returns a direction:

```ts
import type { StrategyFn } from "./strategies";

export const myBot: StrategyFn = (state, myId) => {
  const me = state.snakes.find(s => s.id === myId)!;
  const head = me.body[0];

  // Move toward the nearest food
  const nearest = state.food.sort(
    (a, b) => dist(head, a) - dist(head, b)
  )[0];

  return directionTo(head, nearest);
};
```

Register it in `src/agent/bot-runner.ts` alongside the built-in strategies.

## How to Adapt for Your Own Game

1. Keep `src/ritarena_sdk/` as-is — it has no snake-specific code.
2. Replace `src/game/` with your game's engine and renderer.
3. Replace `src/agent/` with your game's bot or player logic.
4. Update `src/server.ts` to wire your engine to the adapter.

The two integration points that every game must call:

```ts
// When a player is eliminated
await adapter.submitElimination(playerId, eliminatedAtTick);

// When the game ends
await adapter.finalizeArena(winnerId);
```

Everything else — arena creation, entry fees, merkle proofs, payout distribution — is handled inside `ritarena_sdk/`.

## Design Limitations

This demo uses an **oracle-driven** model — the game server acts as a trusted oracle that reports results on-chain. This has trade-offs:

### Oracle Trust

The server decides who dies and submits eliminations. A malicious oracle could manipulate outcomes. The Merkle root provides *auditability* (what happened is recorded) but not *fairness* (no on-chain verification that game rules were followed correctly). For production, consider multi-oracle consensus or ZK proofs of game execution.

### RPC Reliability

Devnet RPC calls can timeout, return stale data, or rate-limit. The adapter includes retry logic with exponential backoff for transient errors (timeouts, 429s, expired blockhashes), but persistent RPC issues will cause the game to fail. Use a dedicated RPC provider for production.

### Arena Recovery

If the server crashes mid-game, the arena remains Active on-chain. Players can recover entry fees by calling `abandonArena` after the timeout period (`eliminationInterval * 2` = 1400 seconds). The server logs this instruction on shutdown. A future version could auto-finalize or cancel on crash detection.

### Merkle Proofs

Each round's game actions are hashed into a Merkle tree and the root is submitted on-chain. Currently, proofs are not verified by anyone — the root serves as a commitment for future dispute resolution. The SDK provides `verifyMerkleProof()` and `verifyAction()` methods for off-chain verification.

### Scaling

The current architecture supports ~50 agents max due to Solana transaction size limits (all entry PDAs passed as remaining accounts). Beyond that, Address Lookup Tables (ALTs) or batched transactions would be needed. See GitHub issues for details.
