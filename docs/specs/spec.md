# RitArena — Specification

**Version**: 5.0
**Date**: 2026-04-09
**Target**: Colosseum 2026 Frontier Hackathon (Apr 6 - May 11)
**Category**: Gaming Infrastructure
**Status**: Final Draft

> **Note**: Frontier has no tracks — all projects judged in one open pool. Category is for project classification only. Prizes: Grand Champion $30K, Top 20 x $10K, University $10K, Public Goods $10K. Accelerator: up to 10 teams x $250K pre-seed.

---

## 1. Overview

RitArena is a platform for visual AI agent competitions on Solana. Creators use the SDK and UI Kit to build, launch, and monetize agent-vs-agent battle arenas — with entry fee escrow and prize distribution enforced on-chain, and game logic processed off-chain with Merkle tree verification.

### Architecture: Off-Chain Decisions, On-Chain Settlement

Agent decisions and game logic run **entirely off-chain** on the game server. This keeps the game fast and cheap. Integrity is guaranteed by a **Merkle tree** built from every agent action during the arena:

```
On-chain (Solana):
  - Arena creation + config
  - Agent registration + entry fee escrow (PDA vault)
  - Merkle root submission (per elimination round)
  - Final scores + elimination results
  - Prize distribution + creator fee claims

Off-chain (Game Server):
  - All agent decisions (move, attack, defend)
  - Round processing (resolve actions → update game state)
  - Score calculation
  - Merkle tree construction from all actions
  - WebSocket broadcast to spectators
```

**Verification flow**: The game server records every action as a Merkle leaf `hash(arena_id, round, agent_id, action, outcome, score_delta)`. After each elimination round, the server submits the Merkle root to the on-chain program. Anyone can later verify any individual action by requesting the Merkle proof from the game server and checking it against the on-chain root.

**Why this design**:
- **Cost**: ~$0.003 per arena (Merkle roots only) vs. $0.50+ if every action were on-chain
- **Speed**: Game rounds resolve in milliseconds, not 400ms+ per Solana transaction
- **Scalability**: 50 agents × 100 rounds = 5,000 actions — all off-chain, one 32-byte root on-chain
- **Verifiability**: Any action is provable against the on-chain Merkle root — trust the math, not the server

Creators set their own fees and earn revenue from their games. The protocol takes a 1% base fee.

### Problem Statement

AI agent competitions are a validated category — Monad's Moltiverse hackathon attracted 400+ submissions and $200K in prizes for agent battle arenas, trading card games, and agent-vs-agent interactions. But every winning project was a standalone app with custom game logic. There is no shared infrastructure layer that lets any developer spin up agent competitions without building escrow, scoring, elimination, and prize mechanics from scratch.

On Solana specifically:
- **Agent Royale** (Breakout hackathon) attempted an AI trading tournament but won no prize — unfocused scope, no SDK/protocol angle
- **The Arena** (Radar, 2nd Gaming $20K, Accelerator C2) built PvP trading competitions for humans, not AI agents
- **Forge AI** (Breakout, HM AI $5K) built an agent testing arena with no real stakes

No project has shipped a **reusable platform** for permissionless agent competitions with on-chain rule enforcement, configurable game types, creator monetization, and embeddable spectator UI.

### Solution — Four Layers

1. **Anchor Program** — On-chain settlement layer: arena creation, agent registration, entry fee escrow (PDA vault), Merkle root storage, elimination results, prize distribution, and creator fees. Lightweight — stores config, money, and proofs. Deployed once; anyone can create games on it.
2. **Game Server** — Off-chain game engine: processes all agent decisions, runs round logic, builds Merkle tree of every action, submits roots + final scores to the on-chain program, broadcasts game state to spectators via WebSocket.
3. **TypeScript SDK** — `npm install @ritarena/sdk`. Create arenas, register agents, read leaderboards, claim prizes, verify Merkle proofs — all in a few lines of code.
4. **UI Kit + Demo App** — `npm install @ritarena/ui`. Embeddable React components: live game canvas, leaderboard, event feed, elimination cards, spectator chat, tipping. The demo app (Visual AI Battle Arena) is built entirely with our own SDK + UI Kit to prove the platform works.

### Target Users

- **Game creators** who want to build and monetize agent competition products without writing escrow/scoring infrastructure or spectator UI from scratch
- **Agent developers** who want to test and prove their agents against others in competitive settings
- **Spectators** who want to watch, tip, and engage with live agent competitions
- **Protocol teams** who want to run agent competitions as community engagement events

### Market Validation

- Monad Moltiverse: 400+ submissions, $200K prizes — battle arenas and agent games were top winners
- Monad ecosystem: 742 projects deployed, 413 agentic, 2,550+ participants across 2026 hackathons
- Solana: 15M+ cumulative agent transactions, 65% of all x402 agent-to-agent payments, $3.8B daily DEX volume
- Solana Foundation joined x402 Foundation alongside Amazon, Google, Visa, Mastercard — betting long-term on agent economy
- "Watching agents compete" proven entertaining — Moltbook ("Reddit for agents") went viral
- Colosseum ran a dedicated $100K Agent Hackathon in Feb 2026

---

## 2. User Scenarios

### Scenario 1: Agent Developer Enters a Visual Battle Arena

**Actor**: A developer with an AI agent

1. Developer browses the arena listing and sees "Grid Wars #7 — 30 slots, 10 USDC entry, 12h duration"
2. Developer reviews arena rules: grid-based battle, agents submit moves each round, scored by survival + kills, elimination every 2 hours (bottom 25%)
3. Developer registers their agent by depositing 10 USDC entry fee and providing a delegate keypair
4. Arena starts — developer's agent receives game state each round and submits actions via the SDK
5. Game server processes moves, updates the visual arena, and submits scores to the on-chain oracle
6. Every 2 hours, the bottom 25% of agents by score are eliminated — spectators watch live
7. After 12 hours, the last 3 agents standing split the prize pool
8. Developer claims their prize via the dashboard

### Scenario 2: Game Creator Launches and Monetizes an Arena

**Actor**: A developer building an agent competition product for profit

1. Developer installs `@ritarena/sdk` and `@ritarena/ui`
2. Developer selects the "Battle Royale" template with Custom game type — provides their game server as scoring oracle
3. Developer configures: entry fee (5 USDC), max agents (20), creator fee (5%), elimination interval (1 hour)
4. Developer calls `arena.create()` with their wallet as the creator — arena is live on-chain
5. Developer embeds `<ArenaLeaderboard>`, `<EventFeed>`, `<GameCanvas>`, and `<SpectatorChat>` UI components into their site — full spectator experience in a few lines of code
6. 20 agents register (100 USDC total). Creator earns 5 USDC automatically.
7. Game server runs rounds, submits scores on-chain; bottom agents eliminated each hour
8. Developer relaunches for the next round; iterates on game design to attract more players

### Scenario 3: Creator Tracks Earnings Across Multiple Games

**Actor**: An experienced creator with several active arenas

1. Creator opens the Creator Dashboard — sees all arenas with earnings, player counts, status
2. Creator notices "SOL Thunderdome" has 34% repeat player rate — their most popular game
3. Creator clones Thunderdome with a twist (shorter rounds, higher fee) to test engagement
4. Creator claims accumulated fees (94.80 USDC) to their wallet in one transaction
5. Creator views lifetime stats: 12 arenas created, 847 total players, $312 earned

### Scenario 4: Spectator Watches a Live Visual Arena

**Actor**: A crypto enthusiast browsing the platform

1. User opens the demo app and sees active arenas with live viewer counts
2. User clicks into "Grid Wars #7" — sees a live visual canvas of agents moving and battling on a grid
3. Sidebar shows real-time leaderboard with scores, kill counts, and health bars
4. Countdown timer shows "Elimination in 12 minutes" — tension builds
5. Elimination happens: 6 agents removed, death cards show each agent's stats and final rank
6. User tips their favorite agent (SOL transfer to agent owner's wallet)
7. User reads live chat reactions: "AlphaBot is GOATED", "RIP RandomRick"
8. User verifies any score update or elimination by clicking through to block explorer

### Scenario 5: Game Creator Builds a Trusted Arena

**Actor**: A developer who wants to run a profitable, trusted arena

1. Developer registers an Agent Profile (5 USDC registration fee)
2. Developer creates an arena via SDK: 20 USDC entry fee, 50 agents, 5% creator fee
3. Developer deposits a 200 USDC creator stake bond — shown to all potential entrants
4. Developer publishes their game logic source code on GitHub, sets `rules_hash` on-chain
5. Arena listing shows: green "Verified" badge — open-source, staked, commit-reveal enabled
6. 50 agents enter (attracted by trust signals). Creator earns 50 USDC in fees
7. Arena completes normally — creator stake bond returned + fees claimed
8. Creator's Agent Profile updated: arenas_completed +1, total_earnings +50 USDC

### Scenario 6: Spectator Verifies an Action

**Actor**: A skeptical spectator who wants to verify the game is fair

1. Spectator watches a live arena — notices an agent scored a suspicious +30 in one round
2. Spectator clicks "Verify Action" on the specific round
3. UI fetches the Merkle proof from the game server for that action
4. UI verifies: commit_hash matches the revealed action (agent didn't change their mind)
5. UI verifies: Merkle proof validates against the on-chain root (server didn't tamper)
6. Spectator sees "Verified" — the action is provably legitimate
7. Spectator can also check the open-source game logic to confirm score calculation

### Scenario 7: Protocol Team Runs a Sponsored Arena

**Actor**: A Solana protocol wanting community engagement

1. Protocol creates an arena with a sponsored prize pool (500 USDC) and zero entry fee
2. 100 agents register for free and compete over 48 hours
3. Winners determined on-chain; prizes distributed automatically

---

## 3. Functional Requirements

### 3.1 Arena Management (On-Chain)

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| AM-1 | Any user can create an arena by configuring parameters via SDK | Arena PDA created on-chain with unique identifier; creator pays rent-exempt deposit |
| AM-2 | Arena configuration includes: entry fee, max agents, duration, elimination interval, elimination percent, prize distribution split, creator fee, and game server oracle address | All parameters stored on-chain and readable by anyone |
| AM-3 | Arenas progress through a defined lifecycle: Registration → Active → Eliminating → Finished | State transitions enforced by the program; no admin override |
| AM-4 | Arena creator can set a custom prize distribution (e.g., 60/25/15 for top 3) | Distribution percentages stored on-chain and enforced during payout |
| AM-5 | Arenas support sponsor-funded prize pools where the sponsor deposits prizes and entry fee is zero | Sponsor deposit held in the arena vault alongside any entry fees |

### 3.2 Agent Registry (On-Chain — Global)

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| AR-1 | Any wallet can register an Agent Profile by paying a one-time registration fee (5 USDC) | Agent Profile PDA created on-chain; fee transferred to protocol treasury |
| AR-2 | Agent Profile stores: owner wallet, name, registered_at timestamp, arenas_entered, arenas_completed, wins, top3, eliminations, total_earnings | All fields readable on-chain |
| AR-3 | After each arena completes, participating agents' profiles are updated with results | Updated by the oracle as part of the finalize_arena instruction |
| AR-4 | Entering an arena requires a registered Agent Profile | Program rejects arena entry from wallets without a profile |
| AR-5 | One wallet can register at most one Agent Profile | Duplicate profile registration rejected |
| AR-6 | Arena creators can set minimum requirements for entry: min arenas_completed, min wins, min registration age | Requirements stored on arena account; checked during agent entry |

### 3.3 Arena Entry (On-Chain)

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| AE-1 | Agents enter an arena by depositing the entry fee and linking their Agent Profile | Entry fee transferred to arena vault (PDA); arena entry account created on-chain |
| AE-2 | One Agent Profile can enter at most one agent per arena | Duplicate entry from same profile rejected |
| AE-3 | Arena entry stores: agent profile pubkey, score (updated by oracle), alive/eliminated status | All fields readable on-chain |
| AE-4 | Agent must meet arena's minimum requirements (if any) to enter | Entry rejected if profile doesn't meet min arenas_completed, min wins, or min registration age |

### 3.4 Commit-Reveal Rounds (Off-Chain)

Each game round uses commit-reveal to prevent the game server from peeking at agent actions before resolution.

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| CR-1 | Commit phase: agents submit `SHA256(action + nonce)` to game server within deadline (default: 4 seconds) | Server stores commit hashes; cannot see actual actions |
| CR-2 | Reveal phase: after commit deadline, agents reveal `action + nonce` within deadline (default: 3 seconds) | Server verifies `SHA256(action + nonce) == commit_hash`; rejects mismatches |
| CR-3 | Agents who miss the commit deadline receive a default action (stand still) | Missed commits recorded in action log |
| CR-4 | Agents who commit but don't reveal receive a default action; commit_hash still recorded in Merkle leaf | Proves agent was alive but chose not to reveal |
| CR-5 | Agents that miss N consecutive commits are auto-eliminated (default N: 5) | Prevents AFK griefing; N configurable per arena |
| CR-6 | After all reveals, server resolves the round: process movements, resolve attacks, update scores | Resolution uses only revealed actions |

### 3.5 Game Server + Merkle Tree (Off-Chain)

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| GS-1 | Game server runs grid-based battle logic using commit-reveal rounds | Round processing completes in <1 second for 50 agents |
| GS-2 | Every agent action is recorded as a Merkle leaf: `hash(arena_id, round, agent_id, commit_hash, revealed_action, outcome, score_delta, timestamp)` | Leaf includes commit_hash for proving server didn't swap actions |
| GS-3 | After each elimination interval, game server computes the Merkle root and submits it to the on-chain program | Merkle root stored on arena account; only the designated oracle can submit |
| GS-4 | Game server submits final scores and elimination results to the on-chain program after each elimination interval | On-chain agent entries updated with latest scores and alive/eliminated status |
| GS-5 | Game server broadcasts game state to spectators via WebSocket in real-time | Spectator clients receive state updates within 100ms of round resolution |
| GS-6 | Game server exposes an API endpoint to serve Merkle proofs for any individual action | Given an action index, returns the leaf + proof path; verifiable against on-chain root |
| GS-7 | Game server persists full action log to database for the duration of the arena | All actions queryable by arena_id, round, agent_id |
| GS-8 | Arena creator must declare an action schema when creating the arena: list of valid actions and game state parameters | Schema stored on-chain as part of arena config; human-readable |
| GS-9 | Arena creator must submit a `rules_hash = SHA256(game_logic_source_code)` at arena creation | Stored on-chain; if source is later published, anyone can verify the hash matches |

### 3.6 Elimination + Settlement (On-Chain)

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| EL-1 | Oracle (game server) submits elimination results: agent IDs to eliminate + updated scores + Merkle root | Single transaction per elimination round |
| EL-2 | Battle Royale: bottom N% of agents by score are eliminated at each interval | Eliminated agents marked inactive on-chain |
| EL-3 | When arena reaches Finished state, final Merkle root is stored and prize distribution is enabled | No further score updates accepted |
| EL-4 | **Arena timeout**: if no Merkle root is submitted within 2x the elimination interval, arena enters "Abandoned" state | All entry fees become refundable; creator stake bond forfeited to protocol treasury |

### 3.7 Creator Stake Bond (On-Chain)

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| SB-1 | Arena creators can optionally deposit a USDC stake bond when creating an arena | Bond held in a separate PDA vault; amount stored on arena account and visible to all |
| SB-2 | If arena completes normally (reaches Finished state), bond is returned to creator | Creator claims bond + creator fees after arena ends |
| SB-3 | If arena is abandoned (timeout — server goes silent), bond is forfeited to protocol treasury | Compensates for failed arena; disincentivizes negligence |
| SB-4 | Bond amount is displayed on the arena listing alongside trust tier | Agents can see how much the creator has staked on fairness |

### 3.8 Arena Trust Tiers (Product-Level)

Trust tiers are derived from on-chain data — not assigned by RitArena. Displayed in the demo app UI.

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| TT-1 | **Verified** (green): arena has open-source game logic (rules_hash matches published code) + creator stake bond + commit-reveal enabled + creator has 3+ completed arenas with 0 disputes | All conditions checked from on-chain data |
| TT-2 | **Community** (yellow): arena has creator stake bond + commit-reveal enabled, but game logic is closed-source or creator has <3 completed arenas | Displayed with appropriate warning |
| TT-3 | **Unverified** (red): arena has no stake bond, or new creator with 0 history | Displayed with "HIGH RISK" warning |
| TT-4 | Trust tier is computed client-side from on-chain data; protocol does not enforce entry restrictions based on tier | Permissionless at protocol level; trust signals at product level |

### 3.9 Creator Economy (On-Chain)

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| CE-1 | Arena creators set a creator fee (0-20%) at creation; fee stored on-chain | Creator fee deducted from entry fees before prize pool calculation |
| CE-2 | Creator fee is separate from protocol base fee (1%) | Total deduction = protocol fee + creator fee; both stored on arena account |
| CE-3 | Creator's wallet address stored on arena account; fees claimable after arena finishes | Only creator wallet can claim |

### 3.10 Prize Distribution (On-Chain)

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| PD-1 | Prize pool = total entry fees - protocol fee (1%) - creator fee (0-20%) | Fee deduction enforced on-chain |
| PD-2 | Winners claim prizes via a permissionless claim instruction after arena is Finished | Only winning agent's owner wallet can claim their share |
| PD-3 | Protocol fee collected in a hardcoded treasury account | 1%, non-negotiable |
| PD-4 | If arena doesn't reach minimum agents before start deadline, all entry fees are refundable | No fees collected on cancelled arenas |
| PD-5 | If arena is abandoned (timeout), all entry fees are refundable and creator stake bond is forfeited | Protects agents if server disappears |

### 3.11 SDK

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| SK-1 | TypeScript SDK wraps all program instructions into a developer-friendly API | Register profile, create arenas, enter arenas, read state, claim prizes — no raw transaction construction |
| SK-2 | SDK publishable as npm package: `@ritarena/sdk` | Installs and runs in clean Node.js project |
| SK-3 | Battle Royale template as default configuration object | Passed to `arena.create()` with all fields overridable |
| SK-4 | SDK includes read helpers: getArena, getLeaderboard, getAgentDetails, getAgentProfile, getEliminationLog | All return typed objects |
| SK-5 | SDK includes Merkle proof verification: `verifyAction(arenaId, actionIndex, proof)` | Returns boolean; checks commit_hash + proof against on-chain Merkle root |
| SK-6 | SDK includes agent profile helpers: registerProfile, getProfile, getProfileHistory | Profile registration and read |

### 3.12 UI Kit (Tier 2)

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| UK-1 | `<GameCanvas>` component: HTML5 Canvas rendering of grid game state (agents, health bars, attacks) | Renders game server state in real-time via WebSocket |
| UK-2 | `<ArenaLeaderboard>` component: ranked agents with score bars, danger zone highlighting, alive/eliminated status | Updates within 10 seconds of state changes |
| UK-3 | `<EventFeed>` component: live stream of agent actions, eliminations, milestones | Real-time via WebSocket |
| UK-4 | `<EliminationCard>` component: death card with agent stats on elimination | Triggered on elimination events |
| UK-5 | All components accept an `arenaId` prop and handle data fetching internally | Drop-in ready |
| UK-6 | React component library publishable as npm package: `@ritarena/ui` | Installs in any React/Next.js project |
| UK-7 | `<SpectatorChat>` component: live chat with emoji reactions (Tier 2) | Real-time websocket |
| UK-8 | `<TipButton>` component: send SOL tip to an agent owner's wallet (Tier 2) | Standard SOL transfer on click |
| UK-9 | `<CreatorDashboard>` component: arena list, earnings, bond status, claim button (Tier 2) | Reads on-chain arena + creator data |
| UK-10 | `<ArenaCard>` component: shows trust tier badge (green/yellow/red), stake bond amount, creator history | Trust tier derived from on-chain data |

### 3.13 Demo Application

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| DA-1 | Demo app built with the SDK + UI Kit (proving they work) | No custom on-chain interactions outside the SDK |
| DA-2 | Visual AI Battle Arena: grid-based agents competing via commit-reveal rounds, off-chain processing, Merkle roots on-chain | Playable end-to-end with visual spectator canvas |
| DA-3 | Demo includes spectator experience: game canvas, leaderboard, event feed, elimination cards | All functional and updating in real-time |
| DA-4 | Demo includes arena browser with trust tier badges on each arena card | Green/yellow/red clearly visible; stake bond amount shown |
| DA-5 | Demo includes "Verify Action" feature: pick any action → show commit_hash match → verify Merkle proof against on-chain root | Three-step verification visible in UI |
| DA-6 | Demo game logic is open-source on GitHub; rules_hash on-chain matches the published code | Verifiable by anyone; sets the standard for creators |

---

## 4. Non-Functional Requirements

| Area | Requirement |
|------|-------------|
| **Performance** | Arena creation completes within one Solana transaction; game rounds resolve in <1 second off-chain; UI updates within 10 seconds |
| **Scalability** | Game server supports 50 concurrent agents per arena; on-chain footprint is O(N agents) accounts + O(K elimination rounds) Merkle roots |
| **Security** | Entry fees held in PDA-controlled vaults; only designated oracle can submit scores/Merkle roots; prize claims require owner wallet signature |
| **Verifiability** | Every agent action is provable via Merkle proof against on-chain root; elimination results and final scores are on-chain |
| **Permissionlessness** | Anyone can create arenas and register agents; prize claims are permissionless |
| **Composability** | SDK and UI Kit work independently — developers can use the SDK without the UI Kit, or use UI Kit with custom backend |

---

## 5. Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| Agent Profile registration works: pay 5 USDC → profile created on-chain | Tested on devnet |
| Visual AI Battle Arena runs end-to-end: register profile → enter arena → commit-reveal rounds → elimination → prizes | Tested with 10+ AI agents on devnet |
| Commit-reveal prevents front-running: server only sees hashes until reveal phase | Verified by inspecting commit/reveal timing in action log |
| Merkle roots on-chain; any action verifiable via proof + commit_hash match | Demonstrated in demo app "Verify Action" feature |
| Creator stake bond: returned on normal completion, forfeited on timeout | Tested both paths on devnet |
| Arena timeout: server goes silent → arena enters Abandoned → entry fees refundable | Tested by stopping game server mid-arena |
| Trust tier badges display correctly based on on-chain data | Verified in demo app arena listing |
| Creator fee is correctly calculated and claimable | Verified against on-chain state |
| Live visual demo arena runs for at least 6 hours with 10+ agents | Observable on devnet with spectator UI |
| Demo game logic is open-source; rules_hash on-chain matches published code | Independently verifiable |

---

## 6. Key Entities

| Entity | Description |
|--------|-------------|
| **Agent Profile** (on-chain) | Global PDA per agent: owner wallet, name, registration timestamp, lifetime stats (arenas, wins, earnings). Created once, updated after each arena. Costs 5 USDC to register. |
| **Arena** (on-chain) | PDA storing competition config, lifecycle state, agent count, prize pool, Merkle roots, oracle address, action schema, rules_hash, and creator stake bond amount |
| **Arena Entry** (on-chain) | PDA per agent per arena: links to Agent Profile, score, alive/eliminated status |
| **Arena Vault** (on-chain) | PDA-controlled USDC token account holding entry fees and sponsor deposits |
| **Creator Stake Bond Vault** (on-chain) | PDA-controlled USDC account holding creator's optional stake bond; returned on normal completion, forfeited on abandonment |
| **Protocol Treasury** (on-chain) | Program-owned account collecting 1% base fees, 5 USDC agent registration fees, and forfeited stake bonds |
| **Merkle Root** (on-chain) | 32-byte hash stored per elimination round; proves the integrity of all off-chain actions for that period |
| **Game Server** (off-chain) | Runs commit-reveal rounds, processes game logic, builds Merkle tree, submits roots + scores on-chain, broadcasts to spectators |
| **Merkle Leaf** (off-chain) | `hash(arena_id, round, agent_id, commit_hash, revealed_action, outcome, score_delta, timestamp)` — includes commit_hash to prove server didn't swap actions |
| **Merkle Proof** (off-chain) | Path from a leaf to the root; served by game server API; verifiable against on-chain root |
| **Action Schema** (on-chain) | Creator-declared list of valid actions and game parameters; stored on arena account |
| **Rules Hash** (on-chain) | `SHA256(game_logic_source_code)` — creator's commitment to specific game logic; stored on arena account |
| **Trust Tier** (product-level) | Computed client-side from on-chain data: Verified (green), Community (yellow), Unverified (red) |

---

## 7. Scope Boundaries

### Tier 1 — Must Ship (Core)
These items define RitArena. Without them, there is no submission.

- **Anchor program**: Agent Profile registry (5 USDC fee), arena creation (with action schema + rules_hash), arena entry (requires profile + meets min requirements), entry fee escrow (PDA vault), creator stake bond vault, oracle score + Merkle root submission, elimination (Battle Royale: bottom N%), arena timeout (auto-refund + bond forfeiture), prize distribution, creator fees (0-20%) + protocol fee (1%), refunds for cancelled/abandoned arenas
- **Game server**: commit-reveal rounds (commit phase → reveal phase → resolve), grid-based visual battle logic (move, attack, health, death), Merkle tree construction (leaves include commit_hash + revealed_action), Merkle root + scores submission to on-chain program, WebSocket broadcast to spectators, Merkle proof API endpoint, auto-eliminate AFK agents
- **TypeScript SDK** `@ritarena/sdk`: registerProfile, createArena, enterArena, getLeaderboard, claimPrize, verifyAction (Merkle proof + commit_hash verification)
- **Demo app** (Next.js): arena listing with trust tier badges (green/yellow/red), live spectator view with game canvas + leaderboard + event feed, wallet connect, "Verify Action" feature (3-step: commit_hash match → Merkle proof → on-chain root)
- **Demo game logic**: open-source on GitHub, rules_hash verifiable on-chain
- At least one live visual arena on devnet with 10+ AI agents before submission
- Landing page

### Tier 2 — Should Ship (Impressive)
Ship if Tier 1 is solid by Week 3. These make the demo memorable.

- React UI Kit `@ritarena/ui`: packaged components (`<GameCanvas>`, `<ArenaLeaderboard>`, `<EventFeed>`, `<EliminationCard>`) as npm-installable library
- Creator Dashboard: arenas list, earnings, claim button
- Elimination spectacle: death cards with stats, countdown tension, danger zone highlighting
- 5+ pre-built agent strategies (aggressive, defensive, flanker, camper, hunter) for seeding arenas
- SpectatorChat (websocket) + TipButton (SOL transfer)

### Tier 3 — Pitch Only (Mention, Don't Build)
Reference in pitch deck and spec as proof of platform thinking. Do NOT implement.

- Trading tournament game type (mention: "same protocol can run trading competitions — scored on PnL via Jupiter")
- Prediction tournament game type (mention: "prediction games scored on accuracy via Pyth oracle")
- Natural language strategy compiler (mention: "vibe-code your agent with plain English")
- Human vs AI mode
- Game engine integration (Unity/Godot plugin) — mention as roadmap, show research
- Action logging + Merkle roots + training data export
- Sprint and Duel game modes (mention as templates the protocol supports)

### Out of Scope (Post-Hackathon)
- Dispute resolution system (on-chain arbitration, slash creator bond based on community vote)
- Decentralized oracle committee (multiple independent game servers that must agree on scores)
- ZK proofs of game execution (prove game logic was applied correctly without revealing source)
- Training data API (paid tier for AI labs and trading firms)
- Permanent action archive on Arweave
- Spectator betting / wagering on outcomes
- Strategy NFTs (tokenizing winning strategies)
- Tournament brackets (multi-round structured competitions)
- Cross-chain arenas
- Mobile native app
- Strategy marketplace
- Private/permissioned arenas
- Creator tier system (reduced protocol fees for high-volume creators)
- Replay mode (rewatch completed arenas)
- Unity/Godot SDK plugins (build post-hackathon on top of existing Solana game engine SDKs)
- Clone arena instruction

---

## 8. Assumptions

- All agent decisions and game logic run off-chain on the game server; only Merkle roots, scores, and elimination results are posted on-chain
- Game server is the trusted oracle during hackathon MVP; decentralized verification is post-hackathon
- Merkle tree verification provides cryptographic proof that the game server did not tamper with action history
- A simple grid-based game (not full slither.io quality) is sufficient for demo — judges care about the protocol + verifiability, not game polish
- Agent runtime hosting is the user's responsibility
- UI Kit components connect to game server via WebSocket for visual state, and on-chain state via RPC polling

---

## 9. Known Risks and Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **Server cheating** — biased game logic, favorable outcomes for colluding agents | Serious | Commit-reveal prevents peeking; Merkle tree prevents tampering; open-source game logic + rules_hash proves the exact code running; creator stake bond makes cheating costly |
| **Oracle key compromise** — attacker submits fake scores | Serious | Rate-limit: oracle can only submit once per elimination interval; arena timeout if key is lost; post-hackathon: multisig oracle |
| **Sybil attack** — one operator creates many agents to dominate | Serious | Agent Profile costs 5 USDC per registration; one profile per wallet; arena creators can gate on min history/wins/age; fresh sybil profiles have zero reputation |
| **Server downtime mid-arena** — funds locked | Serious | Arena timeout: no Merkle root in 2x interval → Abandoned state → all entry fees refundable; creator stake bond forfeited; game state persisted to DB for restart |
| **Front-running agent actions** — server peeks before resolving | Medium | Commit-reveal: server only has hashes until reveal phase; commit_hash recorded in Merkle leaf for post-hoc verification |
| **Gambling classification** | Medium | Demo on devnet; support sponsor-funded arenas (zero entry fee); frame as "skill-based competition infrastructure" |
| **Agent griefing (AFK)** — register and do nothing | Medium | Auto-eliminate after N missed commits (default: 5); Agent Profile tracks completion rate; arenas can require min completion % |
| **Merkle root replay** — resubmit old root to revert scores | Low | On-chain round counter per arena; each submission must increment; reject out-of-order |

---

## 10. Dependencies

| Dependency | Purpose | Risk |
|------------|---------|------|
| Solana network | On-chain settlement (escrow, Merkle roots, prizes) | Low |
| Game server (Node.js/WebSocket) | Off-chain game logic, Merkle tree, score oracle | Medium — core of the system |
| Helius RPC | Transaction submission and state reading | Low |
| HTML5 Canvas | Visual game rendering in browser | Low |

---

## 11. Competitive Landscape

| Project | Chain | What they built | What we do differently |
|---------|-------|----------------|----------------------|
| **The Arena** (2nd Gaming $20K, Accelerator C2) | Solana | PvP trading for humans | Agent-native; visual battle game; Merkle-verified; creator economy |
| **Agent Royale** (no prize) | Solana | AI trading tournament | Visual game (not just trading); SDK + UI Kit; Merkle verification |
| **Forge AI** (HM AI $5K) | Solana | Agent testing, no stakes | Real entry fees, real prizes, on-chain settlement |
| **Moltiverse winners** | Monad | Standalone agent battle apps | Open platform — anyone can create and monetize games; Solana-native |
| **MagicBlock** | Solana | Fully on-chain game engine | We use off-chain game logic + Merkle proofs — cheaper, faster, still verifiable |

---

## 12. Revenue Model — Roblox-Style Creator Economy

### Fee Structure

```
Entry Fee (set by creator)
├── Protocol fee: 1% (non-negotiable) → Protocol Treasury
├── Creator fee: 0-20% (set by creator) → Creator's Wallet
└── Remainder → Prize Pool → Winners
```

### How Each Party Earns

| Party | How they earn | Example (50 agents x 20 USDC = 1,000 USDC) |
|-------|-------------|---------------------------------------------|
| **Protocol** | 1% base fee on all arenas | 10 USDC |
| **Creator** | Self-set fee (e.g., 5%) | 50 USDC |
| **Winners** | Prize pool split | 940 USDC |

### Post-Hackathon Revenue Expansion
- **Training Data API** — sell access to action log datasets in RL format; free tier (aggregated stats), paid tier (full logs), enterprise tier (real-time streaming, custom queries, human-vs-AI filtered data)
- Premium templates with advanced game modes
- Featured arena listings (creators pay for visibility)
- Creator tier system (lower protocol fee for high-volume creators)
- Sponsored arena toolkit for protocol marketing teams

### The Data Flywheel

```
More arenas → More actions logged → Better training data
     ↑                                        │
     │                                        ↓
More agents  ←  Better agents trained on the data
     ↑                                        │
     │                                        ↓
More creators ← More spectators (better agents = better shows)
```

The competition is the product users see.
The data is the moat no one can fork.
Human vs AI data is the premium layer.
