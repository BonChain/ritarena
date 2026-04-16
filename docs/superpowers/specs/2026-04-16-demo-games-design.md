# RitArena Demo Games — Design Spec

**Date:** 2026-04-16
**Deadline:** May 11, 2026 (Colosseum Frontier Hackathon)
**Demo format:** 3-min pitch video + 3-min technical demo video
**Goal:** Prove "any game can run on this platform" with 3 distinct games on the same 14-instruction Anchor program + SDK

---

## Why 3 Games

One game = "cool project." Two games = "maybe a platform." Three games = "this is a platform."

Each game is a different format, different player count, different interaction model — all sharing the same on-chain primitives (escrow, elimination, commit-reveal, prizes, creator fees).

| Game | Type | Players | Proves |
|---|---|---|---|
| Snake Royale | Real-time battle royale | 8 agents | Elimination, escrow, prizes, spectator hype |
| Territory Auction | Turn-based, multi-agent | 8 agents + viewer god mode | Commit-reveal, viewer interaction, chaos |
| RPS Mind Reader | 1v1, human vs AI | 1 human + 1 agent | Human vs AI, data flywheel, bluffing |

---

## Shared Platform Layer

All three games use the same infrastructure:

### On-Chain (Anchor Program — already deployed)
- `create_arena` — creator defines game params, creates escrow vault
- `enter_arena` — agent pays entry fee into escrow
- `start_arena` — oracle starts the match
- `submit_elimination` — oracle reports round: merkle root, scores, eliminated agents
- `finalize_arena` — oracle assigns prize ranks 1-10
- `claim_prize` — winner withdraws from escrow
- `claim_creator_fee` — creator collects their cut
- Protocol fee: 1%, Creator fee: 0-20%, Rest: prize pool

### SDK (already built)
- `GameServer` class handles lifecycle: `createAndWait()` → `start()` → `reportRound()` → `finish()`
- `RitArena` client for agent interactions: `enterArena()`, `claimPrize()`, `watchEntry()`
- Merkle utilities for action logging and verification

### Shared UI Elements (build once, use in all 3 games)
- **Agent identity bar** — name, color, avatar for each agent. Persistent across games.
- **Prize pool display** — total pool, fee breakdown, visible at all times
- **Commentary overlay** — auto-generated hype text: lead changes, eliminations, close calls
- **Leaderboard** — live ranking with score, alive status, prize eligibility
- **Match result screen** — winner, prize amount, link to Solana Explorer txn (1-click proof)
- **Elimination animation** — "REKT" or shatter effect when an agent is eliminated

### Spectator Design Principles
These apply to all 3 games (derived from Jelle's Marble League, Battlesnake, .io games research):
1. **Pick your horse** — viewer bonds with an agent by name/color in 1 second
2. **No dead time** — something happens every second
3. **Commentary carries emotion** — the text overlay is the narrator
4. **Visible strategy** — viewer can see WHY a smart agent beats a dumb one
5. **Money is visible** — prize pool, fees, payouts always on screen

---

## Game 1: Snake Royale

### Reference Feel
Battlesnake tournament stream meets Jelle's Marble League. Real-time action, named contestants, elimination drama.

### Rules
- 8 named agents on a 40x40 grid
- Eat food to grow and score points
- Die on: wall collision, self collision, other snake collision, shrinking zone
- Zone shrinks aggressively every 20 seconds (keeps matches short)
- Last snake alive wins the pool
- Match duration: ~90 seconds

### Agent Interface
- Agent receives game state each tick via WebSocket: grid, all snake positions, food locations, zone boundaries
- Agent responds with direction: `up | down | left | right`
- Tick rate: 200ms (5 ticks/sec)
- If agent doesn't respond within tick window, snake continues in current direction

### Bot Strategies (visually distinguishable)
- **Aggressive** — hunts other snakes, hugs center
- **Defensive** — stays near edges, avoids conflict
- **Greedy** — always goes for nearest food
- **Survivor** — prioritizes staying alive over scoring
- Each strategy should be visibly different to a spectator watching the grid

### Viewer God Powers
- **Drop wall** — place a 3-tile wall segment anywhere on the grid
- **Spawn food** — drop extra food in a specific location (bait trap)
- **Speed boost** — one snake moves 2x speed for 3 seconds
- God powers on cooldown (1 per 15 seconds) to prevent spam

### On-Chain Flow
1. `create_arena` with `action_schema: "snake_battle_royale"`, entry fee, prize split [60/30/10]
2. 8 agents `enter_arena`, USDC escrowed
3. `start_arena` → game server runs tick loop
4. When a snake dies → `submit_elimination` with merkle root of all actions that round, scores, eliminated entry PDA
5. Last snake alive → `finalize_arena` with rankings
6. Winners `claim_prize`, creator `claim_creator_fee`

### UI Layout
```
+-----------------------------------------------+
| SNAKE ROYALE          POOL: 40 USDC    01:12  |
+-----------------------------------------------+
|                                    | LEADERBOARD|
|                                    | 1. ALPHA  8|
|          40x40 GAME GRID           | 2. DEGEN  6|
|          (canvas)                  | 3. WHALE  5|
|                                    | 4. CHAD   3|
|                                    | -- REKT -- |
|                                    | 5. PAPER  X|
+-----------------------------------------------+
| [Drop Wall]  [Spawn Food]  [Speed Boost]      |
+-----------------------------------------------+
| >> ALPHA EATS 3 FOOD IN A ROW! ON FIRE!       |
+-----------------------------------------------+
```

### What Exists vs What to Build
- **Exists:** Snake game engine (`examples/snake-game/`), bot strategies, GameServer integration, collision detection, zone shrink
- **Build:** Browser canvas UI, commentary system, god powers, agent identity/naming, leaderboard overlay, polish

---

## Game 2: Territory Auction

### Reference Feel
Auction house meets turf war. Strategic bidding with a visual map result. Viewer plays god.

### Rules
- 8x8 grid = 64 tiles
- Each round, 1 tile goes up for auction (order: corners first, then edges, then center — strategic value increases)
- All agents submit a bid from their budget (commit-reveal: bids hidden until reveal)
- Highest bid wins the tile. All bidders pay nothing except winner (first-price sealed-bid auction)
- **Scoring:** tiles you own = 1 point each. Adjacent tiles (horizontal/vertical) in a cluster = bonus: cluster of N = N squared points. So 3 connected tiles = 9 points, not 3.
- **Elimination:** Every 8 rounds (after 8 tiles auctioned), lowest-scoring agent is eliminated
- **Budget:** Each agent starts with 100 coins. No refills. Spend wisely.
- **Match:** ~20 rounds of auctions, ~4 eliminations, 1 winner
- Round duration: 10 seconds (bid phase) + 3 seconds (reveal) + 2 seconds (result) = 15 seconds per round
- Total match: ~5 minutes

### Agent Interface
- Agent receives via WebSocket each round:
  - Current tile up for auction (grid position)
  - Own budget remaining
  - Full grid state (who owns what)
  - All agents' scores and alive status
  - Round number, elimination schedule
- Agent responds with: `{ bid: number }` (0 to remaining budget)
- Can update bid multiple times during the 10-second window. Last value before deadline counts.
- Timeout = bid of 0

### Commit-Reveal (maps directly to on-chain primitive)
1. **Commit phase (10 sec):** Agents submit bid. Server hashes each bid as merkle leaf. Nobody sees others' bids.
2. **Reveal phase (3 sec):** All bids revealed simultaneously. Highest bid wins tile.
3. **Result (2 sec):** Grid updates, scores recalculated, commentary fires.

### Viewer God Powers
- **Bomb tile** — destroy a claimed tile. Owner loses territory and cluster bonus recalculates. 1 per 3 rounds.
- **Curse tile** — next tile up for auction appears normal but is actually worth 0 (or negative — drains 5 points). Agents don't know. Viewer sees a skull icon. Revealed after auction.
- **Inflation** — all agents' budgets doubled for 1 round. Creates a bidding war.
- **Freeze agent** — lock 1 agent out of bidding for 1 round. 1 per 5 rounds.

### Bot Strategies (visually distinguishable)
- **Empire builder** — bids high on tiles adjacent to existing cluster. Ignores scattered tiles.
- **Budget hawk** — underbids everyone, wins cheap tiles nobody fights over. Slow and steady.
- **Sniper** — saves budget, then bids everything on a critical tile to break an opponent's cluster.
- **Chaotic** — unpredictable bids. Hard to read but sometimes wastes budget.

### On-Chain Flow
Same lifecycle as Snake Royale — `create_arena` → `enter_arena` → `start_arena` → `submit_elimination` (every 8 rounds with merkle root of all bids) → `finalize_arena` → claims.

`action_schema: "territory_auction"`

### UI Layout
```
+-----------------------------------------------+
| TERRITORY AUCTION     POOL: 80 USDC   R12/20  |
+-----------------------------------------------+
| 8x8 GRID          | AUCTION        | AGENTS   |
| (colored tiles)    | Tile: (3,4)    | ALPHA 78c |
| [ ][ ][R][ ]      | Time: 7s       | DEGEN 45c |
| [ ][B][B][ ]      |                | WHALE 62c |
| [R][R][ ][G]      | [Your bid: 15] | CHAD  23c |
| [ ][ ][G][G]      |                | -- REKT --|
|                    | LAST ROUND:    | PAPER  X  |
|                    | DEGEN bid 22   |           |
|                    | WHALE bid 18   |           |
+-----------------------------------------------+
| [Bomb Tile]  [Curse]  [Inflate]  [Freeze]     |
+-----------------------------------------------+
| >> DEGEN OVERPAID! 22 FOR A CORNER? BUDGET AT  |
|    45 WITH 8 ROUNDS LEFT. RISKY.              |
+-----------------------------------------------+
```

### What to Build (all new)
- Game server: auction logic, bid collection, scoring (cluster calculation), elimination schedule
- Browser UI: grid visualization, bid input, reveal animation, god power buttons
- Commentary system: bid analysis, budget warnings, cluster growth announcements
- Bot strategies: 4 distinct approaches

---

## Game 3: RPS Mind Reader

### Reference Feel
Poker heads-up meets game show. Psychological tension, bluffing, pattern learning visible on screen.

### Rules
- 1v1: Human vs AI agent
- Classic Rock Paper Scissors: rock beats scissors, scissors beats paper, paper beats rock
- **15 rounds** per match
- Each round has 2 phases:
  - **Open phase (7 sec):** Both players pick and can switch freely. Both can SEE each other's current pick in real-time.
  - **Blind phase (3 sec):** Picks hidden. Both can still switch but can't see the other's choice.
- **Reveal:** Both picks shown simultaneously. Winner gets 1 point. Tie = 0 points each.
- Best of 15 rounds. Most points wins.
- No elimination — just score tracking. Winner takes the pool.
- Total match: 15 rounds x 15 seconds = ~3.5 minutes

### The Open/Blind Mechanic (core innovation)
The 7-second open phase creates **bluffing**:
- Show rock to bait opponent into paper → switch to scissors in blind phase
- Or double-bluff: show rock, opponent expects you to switch, you DON'T switch, they throw scissors expecting your paper

The 3-second blind phase creates **commitment tension**:
- "Did they switch? Should I switch? They saw me showing paper, they probably switched to scissors, so I should switch to rock... but what if they DIDN'T switch?"

This means the game has skill depth despite simple rules. Pattern recognition (AI strength) vs bluffing and adaptation (human strength).

### Agent Interface
- Agent connects via WebSocket
- Round start event: `{ round: 5, score: { agent: 2, opponent: 3 }, phase: "open" }`
- During open phase (7 sec): agent receives opponent's current pick every 500ms: `{ opponent_showing: "rock" }`
- Agent can send picks anytime: `{ pick: "rock" | "paper" | "scissors" }`
- Multiple sends allowed — last value before phase end counts
- Rate limit: max 1 message per 500ms (max 14 switches in open, max 6 in blind)
- Blind phase start event: `{ phase: "blind" }` — opponent picks no longer sent
- After blind phase: server collects final picks, reveals both

### AI Pattern Learning (visible to spectator)
The UI shows the AI's "brain":
- **Pattern confidence:** "AI thinks you'll throw ROCK (62%)" — updates each round
- **Prediction history:** shows what AI predicted vs what happened
- **Adaptation:** when human breaks pattern, confidence drops visibly
- This is the data flywheel proof: the AI is literally learning in real-time from match data

### Anti-Exploit Measures
| Attack | Fix |
|---|---|
| WebSocket spam (rapid switches) | Rate limit: 1 msg per 500ms |
| Late submission after deadline | Server clock is truth. Messages after deadline ignored. |
| Read reveal before submitting | Server collects BOTH picks simultaneously, then reveals. No pick accepted after collection. |
| Multiple connections | 1 WebSocket per player per match. Second connection rejected. |
| Bot-assisted human | Fine — blurs human/AI line, which is the product story |
| True RNG human (no pattern) | Caps at 50/50, but gives up bluffing ability in open phase |

### On-Chain Flow
Same lifecycle — `create_arena` with `action_schema: "rps_mind_reader"`, 2 entries, no elimination rounds (just final score), `finalize_arena` with winner rank 1 and loser unranked.

Prize split: [100] (winner takes all in 1v1).

### UI Layout
```
+-----------------------------------------------+
| RPS MIND READER     POOL: 10 USDC    R8/15    |
+-----------------------------------------------+
|   HUMAN                    AI AGENT            |
|   Score: 4                 Score: 3            |
|                                                |
|   [ROCK]                   [PAPER]             |
|   (showing)                (showing)           |
|                                                |
|   ====== OPEN PHASE: 4s remaining ======       |
|                                                |
+-----------------------------------------------+
| AI BRAIN:                                      |
| Prediction: ROCK (62%)  PAPER (25%)  SCIS (13%)|
| Last 5: correct, wrong, correct, wrong, wrong  |
| Your pattern: after losing, you switch 78%     |
+-----------------------------------------------+
|                                                |
|  [ ROCK ]    [ PAPER ]    [ SCISSORS ]         |
|                                                |
+-----------------------------------------------+
| >> YOU'VE THROWN ROCK 3 TIMES IN A ROW.        |
|    THE AI IS CATCHING ON...                    |
+-----------------------------------------------+
```

During blind phase, the opponent's pick area shows:
```
|   AI AGENT             |
|   [  ???  ]            |
|   (locked — 2s left)   |
```

### What to Build (all new)
- Game server: round management, open/blind phase timing, pick collection, scoring
- Browser UI: pick buttons, opponent display, phase timer, reveal animation
- AI brain visualization: confidence bars, pattern chart, prediction history
- Bot: pattern recognition algorithm (track opponent history, predict next pick, bluff in open phase)
- Commentary: "3 ROCKS IN A ROW!", "AI PREDICTED CORRECTLY!", "HUMAN BREAKS THE PATTERN!"

---

## Demo Video Storyboard

### Technical Demo (3 minutes)

**0:00-0:15 — Platform intro**
- Show the SDK: `npm install @ritarena/sdk`
- Show create arena code: 10 lines
- "One platform. Any game. Let me show you three."

**0:15-1:00 — Snake Royale (45 sec)**
- Game starts, 8 snakes moving
- Commentary overlay firing: "ALPHA TAKES EARLY LEAD"
- Viewer drops a wall, traps a snake: "DEGEN WALKED RIGHT INTO IT"
- Zone shrinks, 3 snakes left
- Final kill, winner announced: "ALPHA WINS 24 USDC"
- Click txn link → Solana Explorer shows the payout

**1:00-1:50 — Territory Auction (50 sec)**
- Grid starts empty, first tile auction
- Bid reveal: "WHALE BID 20! EVERYONE ELSE UNDER 10"
- Viewer bombs a tile: cluster breaks, scores shift
- Elimination: "PAPER IS REKT — LOWEST SCORE"
- Final rounds, empire builder wins
- Click txn link → Explorer

**1:50-2:45 — RPS Mind Reader (55 sec)**
- Human vs AI, round 1: both showing picks, open phase
- AI brain panel: "AI HAS NO DATA YET — GUESSING"
- Fast cut to round 8: AI confidence rising "ROCK 68%"
- Human bluffs in open phase, switches in blind phase
- AI brain drops: "PATTERN BROKEN"
- Final round, dramatic reveal
- Click txn link → Explorer

**2:45-3:00 — Platform proof**
- Split screen: 3 games, same Anchor program, same SDK
- "Creators build the game. Agents compete. Winners get paid. All on-chain."
- Waitlist CTA

---

## Build Priority

### Week 1 (Apr 17-23): Snake Royale + Shared UI
Snake has the most existing code. Build the shared UI components (agent identity, leaderboard, commentary, match result screen) while polishing snake. This unblocks the other two games.

1. Browser canvas UI for snake game
2. Shared components: agent bar, leaderboard, commentary overlay, result screen
3. God powers (wall drop, food spawn, speed boost)
4. Bot personality names and visible strategy differences
5. End-to-end devnet test: create → enter → play → payout → verify on Explorer

### Week 2 (Apr 24-30): Territory Auction
All new game logic, but reuses shared UI components.

1. Auction game server: bid collection, scoring (cluster calculation), elimination
2. Grid UI: tile visualization, bid input, reveal animation
3. God powers (bomb, curse, inflate, freeze)
4. 4 bot strategies
5. End-to-end devnet test

### Week 3 (May 1-7): RPS Mind Reader + Demo Video
Simplest game logic, most UI polish needed for the "AI brain" visualization.

1. RPS game server: open/blind phases, pick collection, scoring
2. Human play UI: pick buttons, phase timer, opponent display
3. AI brain visualization: confidence bars, pattern chart
4. Pattern recognition bot
5. End-to-end devnet test
6. Record demo video for all 3 games

### Buffer (May 8-11): Polish + Submit
- Edit demo video
- Fix bugs
- Submit to Colosseum

---

## Technical Notes

### Game Server Architecture (same for all 3 games)
```
Browser (canvas/UI)
  |
  WebSocket
  |
Game Server (Node.js)
  ├── game/       — game-specific logic (snake engine, auction engine, rps engine)
  ├── spectator/  — commentary generation, god power processing
  └── ritarena/   — SDK adapter (shared, handles all on-chain calls)
```

### Action Schema per Game
- Snake: `{ agentId, round, tick, direction, result, score }`
- Auction: `{ agentId, round, tilePosition, bid, won, score }`
- RPS: `{ agentId, round, openPicks[], finalPick, result, score }`

All actions are hashed into merkle leaves per round and root submitted on-chain.

### Devnet Configuration
- Program ID: `5fYaY6696pCJfPQvxC3GwHEDS91hXs1JZNpEK4ZmhCfH`
- Entry fees: 5 USDC (snake, auction), 5 USDC (RPS)
- Prize splits: [60, 30, 10] (8-player games), [100] (1v1 RPS)
- Creator fee: 5% (demo default)
- Registration: 5 USDC per agent profile (one-time)
