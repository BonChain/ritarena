# RitArena — 5-Week Build Plan

**Hackathon**: Colosseum 2026 Frontier (Apr 6 - May 11)
**Category**: Gaming Infrastructure (no tracks — open judging)
**Team**: Tenny (Anchor/Rust) + Junior Dev (Fullstack TS) + Up to 3 Senior Fullstack
**Focus**: Visual AI Battle Arena — agents fighting on a grid with real stakes on Solana

---

## Scope Lock

This plan follows the tiered scope from spec.md. **Only Tier 1 and Tier 2 are built.** Trading, prediction, NL compiler, human vs AI, action logging, and game engine plugins are pitch-only — mentioned in slides but not implemented.

**The one thing that matters**: a live visual arena with AI agents battling on-screen, verifiable on-chain, with a spectator experience that makes judges stop and watch.

---

## Monorepo Structure

```
ritarena/
├── programs/arena/         # Anchor program (Tenny owns)
├── packages/
│   ├── sdk/                # @ritarena/sdk (TypeScript)
│   └── ui/                 # @ritarena/ui (React components + GameCanvas)
├── apps/
│   ├── web/                # Demo app (Next.js)
│   ├── game-server/        # Visual game server (Node.js + WebSocket)
│   └── agent-runtime/      # Simple agent runner (Node.js)
├── scripts/
│   └── demo-agents/        # Pre-built battle agent strategies
└── docs/                   # SDK documentation
```

---

## Week 1: Core Program + Project Scaffold (Apr 6-12)

### Tenny (Anchor/Rust)
- [ ] Initialize Anchor project
- [ ] Agent Profile PDA: register_profile instruction (pays 5 USDC to treasury, stores name + stats)
- [ ] Arena account PDA: create_arena with config (entry fee, max agents, duration, elimination interval/percent, prize split, creator fee, oracle address, action_schema, rules_hash, min_entry_requirements)
- [ ] Arena entry PDA: enter_arena links Agent Profile + deposits entry fee to arena vault PDA
- [ ] Creator stake bond vault PDA: optional USDC deposit at arena creation
- [ ] Arena vault PDA: holds all entry fees + sponsor deposits (USDC)
- [ ] Oracle-only instructions: submit_elimination (update scores + alive status + Merkle root); round counter enforcement (reject out-of-order)
- [ ] Arena timeout: if no oracle submission in 2x elimination interval → Abandoned state → entry fees refundable, bond forfeited
- [ ] Creator fee (0-20%) + protocol fee (1%) deduction logic
- [ ] Arena lifecycle: Registration → Active → Eliminating → Finished | Abandoned
- [ ] Refund instruction for cancelled arenas (min agents not met) and abandoned arenas (timeout)
- [ ] Unit tests: all constraints (unauthorized oracle, double registration, double profile, withdrawal attempts, timeout, bond forfeiture)

### Junior Dev (Fullstack)
- [ ] Initialize monorepo (turborepo/nx): programs / packages / apps
- [ ] SDK scaffold: types matching on-chain accounts, connection helpers
- [ ] Next.js demo app scaffold with Tailwind + wallet adapter
- [ ] Game server scaffold (Node.js + WebSocket): basic room management + commit-reveal round structure
- [ ] Set up Helius RPC

### Deliverable: Program on devnet with Agent Profile registry, arena creation (with stake bond + action schema + rules_hash), arena entry, oracle scoring, timeout. Monorepo ready.

---

## Week 2: Game Logic + Game Server + SDK (Apr 13-19)

### Tenny (Anchor/Rust)
- [ ] Prize distribution: claim_prize + claim_creator_fee + return_stake_bond (after arena Finished)
- [ ] Final settlement: finalize_arena stores final Merkle root, updates Agent Profile stats, locks prize distribution
- [ ] Agent Profile update: arenas_entered++, arenas_completed++, wins/top3/eliminations, total_earnings

### Junior Dev (Fullstack)
- [ ] Game server: commit-reveal round engine (commit phase → deadline → reveal phase → deadline → resolve)
- [ ] Game server: grid-based battle game logic (move, attack, health, death)
- [ ] Game server: verify commit hashes on reveal (`SHA256(action + nonce) == commit_hash`)
- [ ] Game server: default action for missed commits/reveals; auto-eliminate after 5 misses
- [ ] Game server: Merkle tree construction — leaf includes commit_hash + revealed_action
- [ ] Game server: oracle role — submit Merkle root + scores + elimination results to on-chain program
- [ ] Game server: WebSocket broadcasting game state to spectator clients
- [ ] Game server: Merkle proof API endpoint (GET /proof/:arenaId/:actionIndex)
- [ ] Game server: persist action log to database
- [ ] SDK: registerProfile, createArena, enterArena, claimPrize, claimCreatorFee, claimBond, getArena, getLeaderboard, getAgentDetails, getAgentProfile, verifyAction

### Deliverable: Full game logic on devnet. Commit-reveal rounds working. Merkle trees with commit_hash in leaves. SDK complete. Agent profiles tracking stats.

---

## Week 3: UI + Demo App + Visual Game (Apr 20-26)

### Tenny (Anchor/Rust)
- [ ] Integration testing: full lifecycle (register profile → create arena with bond → enter → commit-reveal rounds → elimination → prizes → bond returned → profiles updated)
- [ ] Timeout test: stop game server mid-arena → verify Abandoned state → refund entry fees → verify bond forfeited
- [ ] Merkle proof verification test: pick random action, verify commit_hash match + proof against on-chain root
- [ ] Build agent runtime: Node.js script, reads battle strategy config, connects to game server, does commit-reveal each round
- [ ] Deploy 5+ demo battle agents (aggressive, defensive, flanker, camper, hunter)
- [ ] End-to-end test: 10 agents in visual arena → commit-reveal rounds → elimination → Merkle roots on-chain → prize distribution

### Senior Dev A — UI Kit Core
- [ ] `<GameCanvas>`: HTML5 Canvas rendering of grid game state (agents, health bars, attacks)
- [ ] `<ArenaLeaderboard>`: ranked agents, score bars, danger zone, alive/eliminated
- [ ] `<EventFeed>`: live actions, eliminations, milestones
- [ ] `<EliminationCard>`: death card with stats on elimination
- [ ] All components accept `arenaId` prop, fetch data internally via SDK + WebSocket

### Senior Dev B — Demo App Pages
- [ ] Arena browser: list arenas with trust tier badges (green/yellow/red), stake bond amount, creator history
- [ ] Arena detail: compose `<GameCanvas>` + leaderboard + event feed
- [ ] Wallet connect + Agent Profile registration flow (5 USDC)
- [ ] "Verify Action" page: pick any action → show commit_hash match → show Merkle proof → verify against on-chain root (3-step verification)

### Junior Dev
- [ ] `<SpectatorChat>`: websocket chat + emoji reactions (Tier 2)
- [ ] `<TipButton>`: SOL transfer to agent owner (Tier 2)
- [ ] `<CreatorDashboard>`: arenas list, earnings, claim button (Tier 2)

### Deliverable: Demo app shows live visual battle. Agents fighting on-screen. Spectator experience working.

---

## Week 4: Live Arenas + Polish (Apr 27 - May 3)

### Tenny
- [ ] Launch test Visual Battle Royale on devnet: 10-20 agents, 6-12h
- [ ] Monitor: elimination timing, scoring accuracy, game server stability
- [ ] Security review: oracle trust, score manipulation, vault draining attempts
- [ ] Write SDK documentation with code examples

### Team (All)
- [ ] Visual polish: smooth agent movement, attack animations, elimination effects, danger zone pulsing
- [ ] Spectator polish: countdown tension, kill feed
- [ ] Creator flow polish: create arena → see it live → track earnings
- [ ] Landing page updates if needed
- [ ] Error handling + loading states

### Deliverable: Multiple completed visual arenas. Polished spectator UX. Documentation ready.

---

## Week 5: Submission (May 4-11)

### Tenny
- [ ] Run PUBLIC visual arena — invite Solana CT to participate
- [ ] Final program audit on devnet
- [ ] Technical architecture writeup

### Team
- [ ] Record demo video (3 min):
  - "Watch these AI agents battle" — show live visual arena with agents fighting on grid
  - Show the Merkle verification: pick an action, verify proof against on-chain root
  - Show SDK: create arena in 10 lines
  - Show UI Kit: embed game canvas + spectator view
  - Show live eliminations: death cards, leaderboard updates
  - Show creator dashboard: earnings
  - "Off-chain speed. On-chain trust. npm install @ritarena/sdk"
- [ ] Record pitch video (2 min)
- [ ] Publish package: `@ritarena/sdk`
- [ ] Publish package: `@ritarena/ui` (if Tier 2 complete)
- [ ] Submit to Colosseum
- [ ] Final testing

### Deliverable: Submission-ready. Published packages. Live visual arena data. Videos.

---

## What Was Cut (Pitch Only)

These appear in the pitch deck and spec as "the protocol supports this" but are NOT built:

- Trading game type (Jupiter PnL scoring)
- Prediction game type (Pyth oracle accuracy scoring)
- Natural language strategy compiler
- Human vs AI mode
- Game engine plugins (Unity/Godot)
- Sprint and Duel game modes
- Dispute resolution system (on-chain arbitration)
- Decentralized oracle committee
- ZK proofs of game execution

---

## Risk Mitigations

| Week | Biggest Risk | Fallback |
|------|-------------|----------|
| 1 | Anchor program scope too large (profiles + bonds + timeout) | Implement core first (arena + entry + vault), add profile + bond in Week 2 |
| 2 | Commit-reveal adds complexity to game server | Simplify: longer round times (10s); reduce to 2-phase (commit + resolve, skip reveal nonce) |
| 2 | Game server + oracle integration fragile | Batch score submissions; simplify to one tx per elimination, not per round |
| 3 | GameCanvas rendering performance | Reduce grid size; lower frame rate; use simple sprites not animations |
| 3 | Trust tier logic complex | Start with binary: staked vs not staked. Add full green/yellow/red in Week 4 |
| 4 | Test arena reveals timeout/bond bugs | Run shorter arenas (1h) to iterate faster; test timeout by killing server intentionally |
| 4 | Game server crashes mid-arena | Arena timeout protects funds; auto-restart with state recovery from DB |
| 5 | Not enough external participants | Run arena with demo agents; show completed results + trust tier UI |

---

## Team Allocation

| Person | Weeks 1-2 | Weeks 3-5 |
|--------|-----------|-----------|
| **Tenny** | Anchor program (sole owner) | Integration testing, agent runtime, security review |
| **Junior Dev** | SDK + game server | Chat, tipping, creator dashboard (Tier 2) |
| **Senior Dev A** | — | UI Kit core (GameCanvas, leaderboard, feed, cards) |
| **Senior Dev B** | — | Demo app pages (arena browser, detail, registration) |
| **Senior Dev C** | — | Landing page, polish, demo video, submission |

---

## Demo Script for Judges (5 minutes)

```
0:00 — "RitArena is an AI agent battle arena on Solana"
       Show the architecture: off-chain game logic + Merkle tree → on-chain settlement

0:30 — "Watch this."
       Show LIVE visual arena: AI agents battling on a grid
       Agents moving, attacking, health bars dropping
       "These agents are competing for real stakes — 200 USDC prize pool"
       "Every decision happens off-chain. Every decision is provable on-chain."

1:30 — "Elimination in 3... 2... 1..."
       Bottom 5 agents eliminated. Death cards appear.
       "The game server hashes every action into a Merkle tree.
        The root goes on-chain. Anyone can verify any action."

2:00 — Show "Verify Action" feature
       Pick a random action → show Merkle proof → verify against on-chain root
       "Trust the math, not the server."

2:30 — "Any developer can create an arena with our SDK"
       Show: npm install, create arena in 10 lines

3:00 — "Creators earn fees. Protocol takes 1%."
       Show Creator Dashboard: earnings, stats

3:30 — "Off-chain speed. On-chain trust.
       npm install @ritarena/sdk"

4:00 — END (leave time buffer)
```
