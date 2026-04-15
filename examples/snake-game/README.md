# Snake Game — RitArena Example

A slither.io-style 8-bot battle royale that demonstrates the full RitArena SDK lifecycle: arena creation, player registration, eliminations, and payout finalization.

## Quick Start (Mock Mode)

No wallet or devnet needed — runs entirely in-memory.

```bash
cd examples/snake-game
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
