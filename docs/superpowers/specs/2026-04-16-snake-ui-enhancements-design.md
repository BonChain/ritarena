# Snake Game UI Enhancements — Design Spec

## Goal

Upgrade the snake game demo from "it works" to "it teaches" — make every RitArena SDK interaction visible, understandable, and explorable. User should be able to: pick mode, see preflight checks, watch the game, read color-coded SDK logs with explorer links, understand game state, control speed, and restart.

## Features

### 1. Mode Selector + Start Button (must)

**Current:** Server auto-starts in mock mode from CLI flag.

**New:** Server starts in "lobby" state. UI shows mode selector + Start button.

- Header gets: `<select>` with Mock/Devnet options + "Start Game" button
- On page load: canvas shows "Select mode and press Start" placeholder text
- Client sends `{ type: "start", mode: "mock" | "devnet" }` via WS
- Server creates adapter, arena, bots, starts game
- During game: selector + start button disabled
- Mock mode: start immediately, no checks

### 2. Restart Button (must)

- "Play Again" button appears on winner overlay
- Header also gets a "Restart" button (disabled during active game)
- Client sends `{ type: "restart" }` via WS
- Server: resets engine, creates new adapter + arena + bots, starts fresh game (uses same mode)
- Server broadcasts `{ type: "reset" }` before new game starts
- Client: clears canvas, scoreboard, logs, hides winner overlay

### 3. Devnet Preflight Check (must)

When mode=devnet, after Start pressed, before arena creation:

**Server checks:**
1. Oracle wallet exists at `~/.config/solana/id.json`
2. Oracle has SOL (>= 0.01)
3. Protocol is initialized on chain
4. For each of 8 bot keypairs:
   - Has SOL (>= 0.05)
   - Has USDC (>= entry fee + registration fee = 10 USDC)

**WS messages:**
- `{ type: "preflight", status: "checking", checks: [...] }` — initial state, all "pending"
- `{ type: "preflight", status: "checking", checks: [...] }` — updates as each check completes
- `{ type: "preflight", status: "ready" }` — all passed, game starts automatically
- `{ type: "preflight", status: "failed", checks: [...] }` — show failures + "Run `npm run setup:devnet`" instruction + Retry button

**Check object:** `{ name: string, status: "pending" | "ok" | "fail", detail: string }`

**UI:** Replaces canvas area with a checklist panel during preflight. Green checkmarks for pass, red X for fail.

Mock mode skips preflight entirely.

### 4. Explorer Links in Log (must)

**Server-side change:** Log events get metadata.

Current: `{ type: "log", message: "..." }`

New: `{ type: "log", message: "...", tx?: string, explorerUrl?: string }`

- `MockAdapter`: sends `tx` (mock tx id), no `explorerUrl`
- `DevnetAdapter`: sends `tx` + `explorerUrl` = `https://explorer.solana.com/tx/{tx}?cluster=devnet`

**Client-side:** If `explorerUrl` present, append a clickable `<a>` element (target="_blank") after the log text. If only `tx`, show it as highlighted text (no link).

### 5. Color-Coded Log Entries (should)

**Server-side change:** Log events get a `kind` field.

`{ type: "log", message: "...", kind: "create" | "register" | "enter" | "start" | "eliminate" | "finalize" | "info" }`

**Client-side color mapping:**

| Kind | Color | Tag |
|------|-------|-----|
| create | #a78bfa (purple) | [CREATE] |
| register | #60a5fa (blue) | [REGISTER] |
| enter | #34d399 (teal) | [ENTER] |
| start | #14F195 (green) | [START] |
| eliminate | #f87171 (red) | [ELIM] |
| finalize | #fbbf24 (gold) | [FINAL] |
| info | #888 (gray) | [INFO] |

Log entry DOM: `<span class="log-tag">[TAG]</span> <span class="log-msg">message</span> <a>Explorer</a>`

New log entries get a brief CSS flash animation (background pulse) to draw attention.

### 6. Game State Indicator (should)

A state chip in the header that shows current arena lifecycle stage:

- `LOBBY` — before game starts (default)
- `SETUP` — creating arena, registering bots
- `PREFLIGHT` — devnet checks running
- `ACTIVE` — game running, shows current round: `ROUND 1`, `ROUND 2`...
- `FINISHED` — game over, winner shown

Server sends `{ type: "phase", phase: string }` at each transition.

CSS: chip with colored border matching phase (gray=lobby, blue=setup, yellow=preflight, green=active, gold=finished).

### 7. Speed Control (should)

Buttons in header: `1x` `2x` `5x`

- Does NOT change server tick rate (still 100ms)
- Changes `ROUND_DURATION_MS` dynamically on server
- Client sends `{ type: "speed", multiplier: 1 | 2 | 5 }` via WS
- Server adjusts remaining round timer: `roundTimer = roundTimer / newMultiplier * oldMultiplier`
- Visual: active speed button highlighted, others dimmed
- Default: 1x

### 8. Canvas Bot Labels (should)

Show abbreviated bot name near the head of each alive snake:

- Label format: first letter of strategy + number, e.g., "G1", "C2", "A1", "R2"
- Rendered as white text with dark shadow (for contrast)
- Position: 2px above the head cell
- Font: 10px monospace
- Only shown for alive snakes

### 9. Arena Info Panel (should)

New section in sidebar below scoreboard:

**Arena Info** heading, shows:
- Arena ID: `0`
- State: `Active` (mirrors game state indicator)
- Entry Fee: `5 USDC`
- Prize Pool: `40 USDC` (8 bots x 5 USDC)
- Prize Split: `100% to winner`
- Mode: `Mock` / `Devnet`
- On-chain address: `(mock)` or clickable Solana Explorer link to arena PDA (devnet)

Server sends arena config as part of game state or as separate `{ type: "arena-info", ... }` message on game start.

## Files Changed

| File | Changes |
|------|---------|
| `src/server.ts` | Refactor to lobby/game states, add WS message handlers (start/restart/speed), preflight check, phase broadcasts, arena info broadcast |
| `src/game/renderer.js` | Mode selector, start/restart/speed buttons, preflight panel, color-coded logs, explorer links, bot labels, arena info panel, game state chip, flash animation |
| `public/index.html` | New UI elements: mode selector, start button, restart button, speed buttons, game state chip, preflight panel, arena info section |
| `src/ritarena_sdk/adapter.ts` | Extend `ArenaAdapterEvents.onLog` to include `kind`, `tx`, `explorerUrl`. Add `preflight()` method. |
| `src/ritarena_sdk/mock-adapter.ts` | Send log metadata (kind, tx). Implement `preflight()` returning all-ok. |
| `src/ritarena_sdk/devnet-adapter.ts` | Send log metadata (kind, tx, explorerUrl). Implement `preflight()` with real checks. |
| `src/game/constants.ts` | Export `BOT_LABEL` mapping function |

## WS Message Types Summary

| Direction | Type | Fields |
|-----------|------|--------|
| S->C | `state` | `{ state: GameState }` |
| S->C | `log` | `{ message, kind, tx?, explorerUrl? }` |
| S->C | `phase` | `{ phase: string }` |
| S->C | `preflight` | `{ status, checks: Check[] }` |
| S->C | `reset` | `{}` |
| S->C | `arena-info` | `{ arenaId, entryFee, prizePool, prizeSplit, mode, address? }` |
| C->S | `start` | `{ mode: "mock" \| "devnet" }` |
| C->S | `restart` | `{}` |
| C->S | `speed` | `{ multiplier: 1 \| 2 \| 5 }` |
