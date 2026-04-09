# Arena Protocol — 5-Week Build Plan

**Hackathon**: Colosseum 2026 Frontier (Apr 6 - May 11)
**Category**: Gaming Infrastructure (no tracks — open judging)
**Team**: Tenny (Anchor/Rust) + Junior Dev (Fullstack TS) + Up to 3 Senior Fullstack
**Primary Demo**: Visual AI Battle Arena (grid-based) | **Secondary**: Trading template (proof of game-type-agnostic)

---

## Monorepo Structure

```
arena-protocol/
├── programs/arena/         # Anchor program (Tenny owns)
├── packages/
│   ├── sdk/                # @arena-protocol/sdk (TypeScript)
│   └── ui/                 # @arena-protocol/ui (React components + GameCanvas)
├── apps/
│   ├── web/                # Demo app (Next.js)
│   ├── game-server/        # Visual game server (Node.js + WebSocket)
│   └── agent-runtime/      # Simple agent runner (Node.js)
├── scripts/
│   └── demo-agents/        # Pre-built battle agent strategies
└── docs/                   # SDK + UI Kit documentation
```

---

## Week 1: Core Program + Project Scaffold (Apr 6-12)

### Tenny (Anchor/Rust)
- [ ] Initialize Anchor project with game-type-agnostic account structure
- [ ] Arena account: create_arena with game_type enum (Trading | Prediction | Custom)
- [ ] Arena account: scoring_method enum (RealizedPnL | Accuracy | Speed | Custom)
- [ ] Agent entry account: register_agent with entry fee deposit to PDA vault
- [ ] Delegate keypair validation (can submit actions, cannot withdraw)
- [ ] Creator fee + protocol fee fields on arena account
- [ ] Creator Profile PDA (lifetime stats)
- [ ] Custom game type: oracle address field, submit_score instruction (oracle-only)
- [ ] Max action size enforcement
- [ ] Unit tests: all constraints (adversarial attempts)

### Junior Dev (Fullstack)
- [ ] Initialize monorepo (turborepo/nx): programs / packages / apps
- [ ] SDK scaffold: types matching on-chain accounts, connection helpers
- [ ] Next.js demo app scaffold with Tailwind + wallet adapter
- [ ] Game server scaffold (Node.js + WebSocket): basic room management
- [ ] Set up Helius RPC

### Deliverable: Program on devnet with arena creation + agent registration + custom oracle scoring. Monorepo structure ready.

---

## Week 2: Game Logic + Game Server + SDK (Apr 13-19)

### Tenny (Anchor/Rust)
- [ ] Elimination logic: crank_elimination (permissionless)
  - Battle Royale: bottom N% by score eliminated
  - Sprint: no elimination, rank at deadline
  - Duel: compare two agents at deadline
- [ ] Arena lifecycle: Registration → Active → Eliminating → Finished
- [ ] Prize distribution: claim_prize + claim_creator_fee
- [ ] Clone arena instruction
- [ ] Refund logic for cancelled arenas
- [ ] Oracle score submission: only designated oracle can update agent scores
- [ ] Trading actions (secondary): validate constraints → allow Jupiter Flash-Fill in same tx
- [ ] PnL tracking for trading template

### Junior Dev (Fullstack)
- [ ] Game server: grid-based battle game logic (move, attack, health, death)
- [ ] Game server: round-based processing (receive agent actions → resolve → update state → broadcast)
- [ ] Game server: score oracle — submit scores on-chain after each round/interval
- [ ] Game server: WebSocket broadcasting game state to spectator clients
- [ ] Complete SDK: createArena, registerAgent, submitAction, crankElimination, claimPrize, claimCreatorFee, getLeaderboard, getAgentDetails
- [ ] Strategy compiler API route (Claude API → battle agent config JSON)

### Deliverable: Full game logic on devnet. Game server running grid battles. SDK complete. Oracle submits scores on-chain.

---

## Week 3: UI Kit + Demo App + Visual Game (Apr 20-26)

### Tenny (Anchor/Rust)
- [ ] Integration testing: full arena lifecycle (create → register 10 agents → game rounds → oracle scores → eliminate → prizes)
- [ ] Build agent runtime: Node.js script, reads battle strategy config, connects to game server, submits actions each round
- [ ] Deploy 8+ demo battle agents (aggressive, defensive, flanker, random, camper, hunter, healer, berserker)
- [ ] End-to-end test: 10 agents in visual arena → elimination rounds → prize distribution

### Senior Dev A — UI Kit Core
- [ ] `<GameCanvas>`: HTML5 Canvas rendering of grid game state (agents, health bars, attacks, terrain)
- [ ] `<ArenaHeader>`: title, status, prize pool, countdown, viewer count
- [ ] `<ArenaLeaderboard>`: ranked agents, score bars, danger zone, alive/eliminated
- [ ] `<EventFeed>`: live actions, eliminations, tips, milestones
- [ ] `<EliminationCard>`: death card with stats on elimination
- [ ] `<AgentDetail>`: action history, score progression, on-chain tx links
- [ ] `<ArenaCard>`: summary card for listing pages
- [ ] All components accept `arenaId` prop, fetch data internally via SDK + WebSocket

### Senior Dev B — Demo App Pages
- [ ] Arena browser: list active/upcoming/completed with `<ArenaCard>`
- [ ] Arena detail: compose `<GameCanvas>` + `<ArenaHeader>` + `<ArenaLeaderboard>` + `<EventFeed>`
- [ ] Agent detail page using `<AgentDetail>`
- [ ] "Create Agent" flow: NL input → preview decision tree → select arena → enter

### Junior Dev
- [ ] `<SpectatorChat>`: websocket chat + emoji reactions
- [ ] `<TipButton>`: SOL/USDC transfer to agent owner
- [ ] `<CreatorDashboard>`: arenas list, earnings, stats, claim button
- [ ] `<CreateArenaForm>`: template selector + config form for creators

### Deliverable: UI Kit components working with visual game canvas. Demo app shows live visual battle. Agents fighting on-screen.

---

## Week 4: Live Arenas + Polish (Apr 27 - May 3)

### Tenny
- [ ] Launch test Visual Battle Royale on devnet: 20+ agents, 12h
- [ ] Launch Sprint + Duel test arenas (visual game)
- [ ] Set up Trading template arena (secondary demo — proof of game-type-agnostic)
- [ ] Monitor: elimination timing, scoring accuracy, game server stability, edge cases
- [ ] Security review: all attack vectors (oracle trust, score manipulation)
- [ ] Write SDK + UI Kit documentation with code examples

### Team (All)
- [ ] Visual polish: smooth agent movement, attack animations, elimination effects, danger zone pulsing
- [ ] Spectator polish: countdown tension, camera follow, kill feed
- [ ] Creator flow polish: create arena → see it live → track earnings
- [ ] "Creator built this with our SDK" code snippet shown in arena detail
- [ ] Landing page: what is Arena Protocol, the 4 layers, quick start code, visual game screenshot
- [ ] Mobile responsive
- [ ] Error handling + loading states
- [ ] Battle agent strategy template gallery

### Deliverable: Multiple completed visual arenas. Polished spectator UX with game canvas. Documentation ready.

---

## Week 5: Submission (May 4-11)

### Tenny
- [ ] Run PUBLIC visual arena — invite Solana CT to participate
- [ ] Final program audit on devnet
- [ ] Technical architecture writeup

### Team
- [ ] Record demo video (3 min):
  - "Watch these AI agents battle" — show live visual arena with agents fighting on grid
  - Show SDK: create arena in 10 lines
  - Show UI Kit: embed game canvas + spectator view in a few lines
  - Show live eliminations: death cards, leaderboard updates, chat reactions
  - Show creator dashboard: earnings, stats
  - "Now watch the SAME protocol run a trading tournament" — show trading template
  - "Any game. Same infrastructure. npm install @arena-protocol/sdk"
- [ ] Record pitch video (2 min)
- [ ] Publish packages: `@arena-protocol/sdk` + `@arena-protocol/ui`
- [ ] Submit to Colosseum
- [ ] Final testing

### Deliverable: Submission-ready. Published packages. Live visual arena data. Videos.

---

## Risk Mitigations

| Week | Biggest Risk | Fallback |
|------|-------------|----------|
| 1 | Delegate keypair pattern doesn't work | PDA-owned vault with instruction-level validation |
| 2 | Game server complexity (real-time + oracle scoring) | Simplify to turn-based with 5-second rounds; batch score submissions |
| 2 | Oracle trust model questioned | Document trust assumptions; plan decentralized verification post-hackathon |
| 3 | GameCanvas rendering performance | Reduce grid size; lower frame rate; use simple sprites not animations |
| 3 | UI Kit components too slow for real-time | Poll every 30s; pre-calculate rankings server-side |
| 4 | Test arena reveals elimination bugs | Run shorter arenas (2h) to iterate faster |
| 4 | Game server crashes mid-arena | Auto-restart with state recovery; keep game state in Redis/memory |
| 5 | Not enough external participants | Run arena with demo agents; show completed results |

---

## Team Allocation

| Person | Weeks 1-2 | Weeks 3-5 |
|--------|-----------|-----------|
| **Tenny** | Anchor program (sole owner) | Integration testing, agent runtime, security review |
| **Junior Dev** | SDK + backtest engine | Chat, tipping, creator dashboard components |
| **Senior Dev A** | — | UI Kit core components (leaderboard, feed, cards) |
| **Senior Dev B** | — | Demo app pages (arena browser, detail, agent creation) |
| **Senior Dev C** | — | Landing page, polish, demo video, submission |

---

## Demo Script for Judges (5 minutes)

```
0:00 — "Arena Protocol is the Roblox of AI agent competitions"
       Show the 4-layer architecture diagram

0:30 — "Watch this."
       Show LIVE visual arena: 20 AI agents battling on a grid
       Agents moving, attacking, health bars dropping
       "These agents are competing for real stakes — 200 USDC prize pool"

1:30 — "Elimination in 3... 2... 1..."
       Bottom 5 agents eliminated. Death cards appear. Chat goes wild.
       "All verified on-chain. Every score, every elimination."

2:00 — "Any developer can create a game like this with our SDK"
       Show: npm install, create arena in 10 lines, show it on-chain

2:30 — "And embed the full spectator experience with our UI Kit"
       Show: import <GameCanvas>, <ArenaLeaderboard>, <SpectatorChat>

3:00 — "Creators earn fees from their games"
       Show Creator Dashboard: 3 arenas, $94 earned, 200 players

3:30 — "And the protocol is game-type-agnostic"
       Show Trading Tournament running on the SAME protocol
       "Visual battle, trading competition — same SDK, same infrastructure"

4:00 — "Anyone can create an agent with natural language"
       Type battle strategy → preview → enter arena → watch compete

4:30 — "The protocol takes 1%. Creators set their own fee.
       All on-chain. All verifiable. All permissionless.
       npm install @arena-protocol/sdk"

5:00 — END
```
