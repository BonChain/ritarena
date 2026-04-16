# Snake Game: Refactor to SDK GameServer

**Date:** 2026-04-16
**Status:** Approved
**Scope:** `examples/snake-game/`

## Problem

The snake game example uses a custom 4-file adapter layer (`src/ritarena_sdk/`) that duplicates logic already in the SDK's `GameServer` class (v0.3.0). This means:
- The canonical example doesn't prove the high-level SDK works
- Duplicate retry logic, merkle computation, PDA tracking
- Harder for new developers to learn from — they see a custom pattern, not the SDK API

## Solution

Replace the adapter layer with direct `GameServer` usage. One file rewrite, four files deleted.

## Files changed

| Action | File | Reason |
|---|---|---|
| **Rewrite** | `src/server.ts` | Replace adapter calls with GameServer |
| **Delete** | `src/ritarena_sdk/adapter.ts` | Interface no longer needed |
| **Delete** | `src/ritarena_sdk/mock-adapter.ts` | Replaced by `GameServer(null, null, {mock: true})` |
| **Delete** | `src/ritarena_sdk/devnet-adapter.ts` | Replaced by `GameServer(conn, kp, config)` |
| **Delete** | `src/ritarena_sdk/merkle.ts` | GameServer computes merkle internally |
| **Keep** | `src/ritarena_sdk/setup-devnet.ts` | Standalone funding script, no adapter dependency |
| **Keep** | `src/game/*`, `src/agent/*`, `public/*` | Unchanged |

## API mapping

| Before (adapter) | After (GameServer) |
|---|---|
| `new MockAdapter(events)` | `new GameServer(null, null, {...config, mock: true})` |
| `new DevnetAdapter(keypair, events)` | `new GameServer(connection, keypair, config)` |
| `adapter.createArena()` + `registerProfile()` + `enterArena()` + `startArena()` | `gameServer.setupWithBots(keypairs)` |
| `adapter.submitElimination(arenaId, roundResult)` | `gameServer.reportRound(eliminated, scores, actions)` |
| `adapter.finalizeArena(arenaId, winner, allBots)` + `claimPrize()` | `gameServer.finish([{pubkey, rank}])` |
| `BotIdentity {botId, keypair}` | `Map<string, PublicKey>` (botId to pubkey) |
| `onLog` callback | `gameServer.on("log", ...)` |
| Manual `onChainRound` tracking | `gameServer.currentRound` (internal) |
| Custom retry logic | Built into GameServer |

## Key decisions

1. **Use `setupWithBots()` not manual steps.** GameServer doesn't expose individual register/enter methods, and `setupWithBots` is the intended high-level API.

2. **Keep devnet preflight checks.** Extract ~40 lines as standalone `runPreflight()` function in server.ts. Checks oracle SOL, protocol init, per-bot SOL + USDC balances.

3. **Drop `claimPrize()` call.** GameServer calls `collectProtocolFee()` on finish, not `claimPrize()`. For the demo, prizes stay in vault. Can add one-line claiming post-finish if needed.

4. **Arena-info broadcasts after `setupWithBots()` returns** (not between create and start). Acceptable timing change — UI still gets the info before the game loop starts.

## Verification

1. `npm start` → mock mode game plays, logs show SDK calls, finishes with winner
2. `npx tsc --noEmit` passes
3. All WebSocket message types still broadcast (state, phase, log, arena-info, preflight, reset, speed)
4. Speed multiplier 1x/2x/5x works
5. Restart after game finishes works
