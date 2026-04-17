# Snake Game — RitArena Example

A slither.io-style 8-bot battle royale that demonstrates the full RitArena SDK lifecycle: arena creation, player registration, eliminations, and payout finalization.

Built with React + [@ritarena/ui](https://www.npmjs.com/package/@ritarena/ui) on the frontend and [@ritarena/sdk](https://www.npmjs.com/package/@ritarena/sdk) on the game server.

---

## Quick Start (Mock Mode)

No wallet, no devnet, no real money. Runs entirely in-memory.

```bash
cd games/snake
npm install
cd web && npm install && cd ..
npm start
```

Open [http://localhost:3000](http://localhost:3000), pick **Mock** mode, click **Start**.

---

## Devnet Mode — Prerequisites

Devnet mode runs the game against real Solana transactions with test USDC. Before you can run it, you need **all four** of these set up.

### 1. Install Solana CLI

```bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
solana --version
```

Point it at devnet:

```bash
solana config set --url https://api.devnet.solana.com
```

### 2. Create and fund a wallet

If you don't already have one:

```bash
solana-keygen new --outfile ~/.config/solana/id.json
```

This wallet is your **oracle wallet** — it creates the arena and signs all game server transactions.

Fund it with devnet SOL (needs at least ~0.5 SOL for the full flow):

```bash
solana airdrop 2
```

If the CLI faucet is rate-limited, use the web faucet:
- Go to [faucet.solana.com](https://faucet.solana.com)
- Paste your address: `solana address`
- Select Devnet, request 2 SOL

**Check balance:**

```bash
solana balance
```

Need at least **0.5 SOL**.

### 3. Protocol initialized on devnet

The RitArena protocol must be initialized (this happens once per network). If it isn't, do:

```bash
cd /home/tenny/src/solana/2026_frontier/ritarena/sdk
npx tsx scripts/test-devnet.ts
```

This script:
- Initializes the protocol if it isn't already
- Creates a test USDC mint (if needed)
- Creates a fresh arena
- Prints the arena PDA and Explorer URL

**If the script says "Protocol already initialized"** — you're good.

### 4. Fund the 8 bot wallets with SOL + USDC

Each bot needs:
- **0.05 SOL** — for transaction fees
- **15 USDC** — 5 for profile registration + 5 for entry fee + 5 buffer

Run the setup script:

```bash
cd /home/tenny/src/solana/2026_frontier/ritarena/games/snake
npm run setup:devnet
```

This script:
- Derives 8 bot keypairs deterministically from your master wallet
- Transfers 0.05 SOL to each bot
- Mints 15 test USDC to each bot's ATA (your master wallet is the USDC mint authority)

Total cost to your master wallet: **~0.5 SOL + 120 test USDC** (test USDC is minted, not purchased).

---

## How to Run Devnet Mode

Once all 4 prerequisites are done:

```bash
cd /home/tenny/src/solana/2026_frontier/ritarena/games/snake
npm run start:devnet
```

Open [http://localhost:3000](http://localhost:3000), pick **Devnet** mode, click **Start**.

### What happens on start

1. **Preflight checks** — server verifies oracle balance, protocol init, and each bot's SOL balance. Status shows in the event feed.
2. **Arena creation** — `createArena` transaction fires. You'll see the arena ID + Explorer link in the header.
3. **Bot registration** — each bot registers a profile (if not already registered) and pays the entry fee into escrow.
4. **Game starts** — 8 snakes compete on the 40x40 grid. Zone shrinks every 30s.
5. **Eliminations** — each death fires a `submitElimination` transaction with scores + Merkle root.
6. **Finalize** — last snake standing triggers `finalizeArena` with the winner.
7. **Prize claim** — winner calls `claimPrize` and the protocol fee is auto-collected.
8. **Match result overlay** — shows winner, prize, and a link to the payout transaction on Solana Explorer.

A full match takes **~2-3 minutes** on devnet (RPC latency + confirmation waits).

### Troubleshooting

**"Preflight failed — Oracle SOL balance"**
Run `solana airdrop 2` or use the web faucet.

**"Preflight failed — Protocol initialized"**
Run `cd sdk && npx tsx scripts/test-devnet.ts` to initialize.

**"Preflight failed — Bot N SOL"**
Run `npm run setup:devnet` again to top up bot wallets.

**Nothing happens when you click Start**
Open the browser console. If you see `Unauthorized` errors, the server was started with `GAME_ADMIN_KEY` set — either unset it or pass the matching `adminKey` from the client (not currently exposed in the UI).

**Game hangs mid-match**
Devnet RPC can be flaky. The adapter retries automatically, but persistent issues will stall the game. Restart the server with `npm run start:devnet`. Stale arenas can be recovered via `abandonArena` after ~10 minutes.

---

## What You'll See

- **Canvas** — 8 named snakes (ALPHA, WHALE, CHAD, DIAMOND, DEGEN, SAVAGE, PAPER, RUGGED) competing on a grid
- **Leaderboard** — live ranking with bot colors and scores
- **Prize pool** — total pool + fee breakdown
- **Event feed** — hype commentary ("ONLY 3 LEFT. FINAL STRETCH.") + on-chain transaction logs
- **Match result** — winner overlay with 1-click Explorer verification

---

## Architecture

```
Browser
  └── games/snake/web/       — React + @ritarena/ui
      └── WebSocket to src/server.ts
                |
                v
            src/server.ts
              ├── src/game/          — tick loop, collision, zone shrink
              ├── src/agent/         — bot strategies (one per snake)
              └── src/ritarena_sdk/  — RitArena SDK adapter (mock or devnet)
                                          |
                                          v
                                     Solana (devnet / mainnet)
```

| Folder | Audience | Purpose |
|--------|----------|---------|
| `web/` | Frontend devs | React UI consuming @ritarena/ui |
| `src/ritarena_sdk/` | Game developers | Reusable RitArena integration — copy to any game |
| `src/game/` | Game developers | Snake-specific logic — replace for your game |
| `src/agent/` | Agent developers | Bot strategies — read this to write your own bot |

---

## Game Rules

- 8 bots, 40x40 grid
- Eat food to grow longer and increase your score
- Die on collision with a wall, yourself, another snake, or the shrinking zone
- Zone shrinks 15% every 30 seconds
- Last snake alive wins the pot
- Entry fee: 5 USDC per bot. Total prize pool: 40 USDC

---

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

---

## How to Adapt for Your Own Game

1. Keep `src/ritarena_sdk/` as-is — it has no snake-specific code.
2. Replace `src/game/` with your game's engine.
3. Replace `src/agent/` with your game's bot or player logic.
4. Replace `web/src/components/GameCanvas.tsx` with your own canvas renderer.
5. Update `src/server.ts` to wire your engine to the adapter.

The two integration points that every game must call:

```ts
// When a player is eliminated
await adapter.submitElimination(playerId, eliminatedAtTick);

// When the game ends
await adapter.finalizeArena(winnerId);
```

Everything else — arena creation, entry fees, merkle proofs, payout distribution — is handled inside `ritarena_sdk/`.

For spectator UI, drop in [@ritarena/ui](https://www.npmjs.com/package/@ritarena/ui) components. You don't need to build leaderboards or prize pool displays from scratch.

---

## Design Limitations

This demo uses an **oracle-driven** model — the game server acts as a trusted oracle that reports results on-chain.

### Oracle Trust

The server decides who dies and submits eliminations. A malicious oracle could manipulate outcomes. The Merkle root provides *auditability* (what happened is recorded) but not *fairness* (no on-chain verification that game rules were followed correctly). For production, consider multi-oracle consensus or ZK proofs of game execution.

### RPC Reliability

Devnet RPC calls can timeout, return stale data, or rate-limit. The adapter includes retry logic with exponential backoff for transient errors (timeouts, 429s, expired blockhashes), but persistent RPC issues will cause the game to fail. Use a dedicated RPC provider for production.

### Arena Recovery

If the server crashes mid-game, the arena remains Active on-chain. Players can recover entry fees by calling `abandonArena` after the timeout period (`eliminationInterval * 2` = ~10 minutes). The server logs this instruction on shutdown. A future version could auto-finalize or cancel on crash detection.

### Merkle Proofs

Each round's game actions are hashed into a Merkle tree and the root is submitted on-chain. Currently, proofs are not verified by anyone — the root serves as a commitment for future dispute resolution. The SDK provides `verifyMerkleProof()` and `verifyAction()` methods for off-chain verification.

### Scaling

The current architecture supports ~50 agents max due to Solana transaction size limits (all entry PDAs passed as remaining accounts). Beyond that, Address Lookup Tables (ALTs) or batched transactions would be needed.
