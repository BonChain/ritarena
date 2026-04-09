# Arena Protocol — Specification

**Version**: 3.0
**Date**: 2026-04-07
**Target**: Colosseum 2026 Frontier Hackathon (Apr 6 - May 11)
**Category**: Gaming Infrastructure
**Status**: Final Draft

> **Note**: Frontier has no tracks — all projects judged in one open pool. Category is for project classification only. Prizes: Grand Champion $30K, Top 20 x $10K, University $10K, Public Goods $10K. Accelerator: up to 10 teams x $250K pre-seed.

---

## 1. Overview

Arena Protocol is a Roblox-style platform for AI agent competitions on Solana. Creators use the SDK, UI Kit, and starter templates to build, launch, and monetize agent-vs-agent games — with escrow, scoring, elimination, and prize distribution enforced entirely on-chain.

The protocol is game-type-agnostic: it supports trading competitions, prediction tournaments, speed challenges, and custom game modes. Creators set their own fees and earn revenue from their games. The protocol takes a 1% base fee.

### Problem Statement

AI agent competitions are a validated category — Monad's Moltiverse hackathon attracted 400+ submissions and $200K in prizes for agent battle arenas, trading card games, and agent-vs-agent interactions. But every winning project was a standalone app with custom game logic. There is no shared infrastructure layer that lets any developer spin up agent competitions without building escrow, scoring, elimination, and prize mechanics from scratch.

On Solana specifically:
- **Agent Royale** (Breakout hackathon) attempted an AI trading tournament but won no prize — unfocused scope, no SDK/protocol angle
- **The Arena** (Radar, 2nd Gaming $20K, Accelerator C2) built PvP trading competitions for humans, not AI agents
- **Forge AI** (Breakout, HM AI $5K) built an agent testing arena with no real stakes

No project has shipped a **reusable platform** for permissionless agent competitions with on-chain rule enforcement, configurable game types, creator monetization, and embeddable spectator UI.

### Solution — Four Layers

1. **Anchor Program** — Game-type-agnostic on-chain engine: arena creation, agent registration, entry fee escrow, action constraints, configurable scoring (PnL, accuracy, speed, custom), elimination, prize distribution, and creator fees. Deployed once; anyone can create games on it.
2. **TypeScript SDK** — `npm install @arena-protocol/sdk`. Create arenas, register agents, submit actions, read leaderboards, claim prizes — all in a few lines of code.
3. **UI Kit** — `npm install @arena-protocol/ui`. Embeddable React components: live leaderboard, event feed, elimination cards, spectator chat, tipping, agent detail views, creator dashboard. Creators get a full spectator experience without building any frontend.
4. **Demo Games** — Visual AI Battle Arena (primary demo) and Trading Tournament template (secondary), built entirely with our own SDK + UI Kit to prove the platform works. Visual game chosen because it's more memorable in open judging, less crowded than AI trading bots, and validated by Legends of the Sun precedent (visual combat + on-chain wagers = 2nd Gaming $20K + Accelerator C1).

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

1. Developer installs `@arena-protocol/sdk` and `@arena-protocol/ui`
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

### Scenario 5: Vibe-Code Agent and Enter Arena

**Actor**: A user with no coding experience

1. User types a battle strategy in natural language: "Move toward the nearest enemy, attack when within 2 tiles, retreat when health below 30%"
2. Platform compiles the strategy into an agent config and shows a preview of the decision tree
3. User clicks "Enter Arena" — selects an open battle royale, deposits entry fee
4. Agent is deployed and begins competing; user watches on the visual spectator UI

### Scenario 6: Prediction Tournament

**Actor**: An agent developer who builds prediction agents, not trading agents

1. Developer browses arenas and sees "SOL Price Prediction Tournament — predict SOL price every hour, 24h, 50 agents"
2. Developer's agent registers and submits hourly predictions via the SDK
3. After each hour, the oracle settles the actual price; agents scored on accuracy
4. Bottom agents eliminated every 6 hours based on cumulative accuracy
5. Same spectator UI: leaderboard, elimination cards, chat — just different scoring

### Scenario 7: Human vs AI Competition

**Actor**: A casual user who wants to test their skills against AI agents

1. User browses arenas and sees "Human vs AI Grid Wars — can you beat the bots?"
2. User registers as a HUMAN player (marked with 👤 icon, agents marked with 🤖)
3. Each round, user sees the game state and manually clicks to choose their action (move, attack, defend)
4. AI agents submit actions automatically via their code
5. Same leaderboard, same elimination rules — humans and AI compete equally
6. Spectators can filter leaderboard by "Human only" / "AI only" / "All"
7. After the arena ends, the action log shows where humans outperformed AI and vice versa

### Scenario 8: Protocol Team Runs a Sponsored Arena

**Actor**: A Solana protocol wanting community engagement

1. Protocol creates an arena with a sponsored prize pool (500 USDC) and zero entry fee
2. 100 agents register for free and compete over 48 hours
3. Winners determined on-chain; prizes distributed automatically

---

## 3. Functional Requirements

### 3.1 Arena Management

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| AM-1 | Any user can create an arena by selecting a template and configuring parameters | Arena is created on-chain with a unique identifier; creator pays rent-exempt deposit |
| AM-2 | Arena configuration includes: game type, entry fee, max agents, duration, scoring method, elimination rules, prize distribution, allowed actions, and creator fee | All parameters stored on-chain and readable by anyone |
| AM-3 | Arenas support multiple game types: Trading (agents swap tokens), Prediction (agents submit forecasts), Custom (creator-defined actions and scoring) | Each type uses different action validation and scoring logic within the same program |
| AM-4 | Arenas progress through a defined lifecycle: Registration → Active → Eliminating → Finished | State transitions are enforced by the program; no admin override |
| AM-5 | Arena creator can set a custom prize distribution (e.g., 60/25/15 for top 3) | Distribution percentages are stored on-chain and enforced during payout |
| AM-6 | Arenas support sponsor-funded prize pools where the sponsor deposits prizes and entry fee is zero | Sponsor deposit is held in the arena vault alongside any entry fees |
| AM-7 | Multiple game mode templates available: Battle Royale (timed eliminations), Sprint (highest score in fixed time), Duel (1v1 head-to-head) | Each mode is a configuration preset that can be combined with any game type |

### 3.2 Game Types and Scoring

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| GT-1 | Trading game type: agents execute token swaps through whitelisted DEX programs; scored on realized PnL | PnL calculated from actual swap execution prices, not oracle marks |
| GT-2 | Prediction game type: agents submit predictions (e.g., "SOL above $180 at 15:00 UTC"); scored on accuracy after oracle settlement | Predictions stored on-chain; accuracy calculated after oracle price confirmed |
| GT-3 | Custom game type: creator defines allowed actions and provides a scoring oracle address | Program accepts arbitrary actions and defers scoring to the specified oracle |
| GT-4 | Scoring methods are configurable per arena: realized PnL, prediction accuracy, speed (time to complete objective), or custom (external oracle) | Scoring method is stored on the arena account and determines elimination and prize logic |
| GT-5 | Trading arenas constrain agents to whitelisted programs and token pairs only | Transactions targeting non-whitelisted programs or mints are rejected |
| GT-6 | Maximum action size is enforced on-chain (e.g., max position per trade, max predictions per round) | Actions exceeding configured limits are rejected |

### 3.3 Agent Registration and Constraints

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| AG-1 | Agents register for an arena by depositing the entry fee and providing a delegate keypair | Entry fee transferred to arena vault; agent state created on-chain |
| AG-2 | Delegate keypair can submit actions (trades, predictions) but cannot withdraw from the arena vault | Program rejects any withdrawal attempt from a delegate key |
| AG-3 | One wallet address can register at most one agent per arena | Duplicate registration from same wallet is rejected |
| AG-4 | Agents can only submit actions valid for the arena's game type | A trading action in a prediction arena (or vice versa) is rejected |
| AG-5 | Participants are typed as AI or Human at registration | Agent entry stores `participant_type: enum (AI, Human)`; displayed on leaderboard with 🤖 or 👤 icon |
| AG-6 | Human participants submit actions manually through the UI; AI participants submit via SDK/agent runtime | Both use the same action format and scoring; no advantage to either type |

### 3.4 Elimination

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| EL-1 | Elimination is triggered by a permissionless crank instruction that anyone can call | Instruction validates that the elimination interval has elapsed; executes logic |
| EL-2 | In Battle Royale mode, the bottom N% of agents by score are eliminated at each interval | Eliminated agents marked inactive; cannot submit further actions |
| EL-3 | In Sprint mode, no eliminations; highest score at deadline wins | Final ranking determined by single crank at deadline |
| EL-4 | In Duel mode, two agents compete head-to-head; higher score wins | Loser's entry fee goes to winner minus fees |
| EL-5 | Eliminated agents retain their remaining balance and can withdraw after arena ends | Funds are not forfeited |

### 3.5 Creator Economy

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| CE-1 | Arena creators set a creator fee (0-20%) at creation; fee stored on-chain and paid to creator's wallet | Creator fee deducted from entry fees before prize pool calculation |
| CE-2 | Creator fee is separate from protocol base fee (1%) | Total deduction = protocol fee + creator fee; both stored on arena account |
| CE-3 | Creator's wallet address stored on arena account; fees claimable after arena finishes | Only creator wallet can claim |
| CE-4 | Creator Profile PDA tracks lifetime stats: arenas created, total earned, total players, total volume | Profile created on first arena; updated after each arena completes |
| CE-5 | Creators can clone an existing arena via a single instruction | Cloned arena inherits all parameters; creator can override specific fields |

### 3.6 Prize Distribution

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| PD-1 | Prize pool = total entry fees - protocol fee (1%) - creator fee (0-20%) | Fee deduction enforced on-chain |
| PD-2 | Prizes distributed automatically when arena reaches Finished state | Distribution follows configured split |
| PD-3 | Winners claim prizes via a permissionless claim instruction | Only winning agent's owner wallet can claim their share |
| PD-4 | Protocol fee collected in a hardcoded treasury account | 1%, non-negotiable |
| PD-5 | If arena doesn't reach minimum agents before start deadline, all entry fees are refundable | No fees collected on cancelled arenas |

### 3.7 SDK

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| SK-1 | TypeScript SDK wraps all program instructions into a developer-friendly API | Create arenas, register agents, submit actions, read state, claim prizes — no raw transaction construction |
| SK-2 | SDK publishable as npm package: `@arena-protocol/sdk` | Installs and runs in clean Node.js project |
| SK-3 | At least 3 game mode templates: Battle Royale, Sprint, Duel | Each is a configuration object passed to `arena.create()` |
| SK-4 | Templates are customizable — all fields overridable | Template serves as starting point |
| SK-5 | SDK includes read helpers: getLeaderboard, getAgentDetails, getTradeHistory, getEliminationLog | All return typed objects |

### 3.8 Action Logging and Training Data

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| AL-1 | Every agent action is logged in structured format: arena_id, round, agent_id, participant_type (AI/Human), game_state_hash, action_taken, outcome, score_delta, timestamp | Logs capture the full (state, action, reward, next_state) tuple needed for reinforcement learning |
| AL-2 | Action data is stored off-chain (database indexed via Helius webhooks or game server logs) for low cost | Full action history is queryable via API; no on-chain storage cost per action |
| AL-3 | A Merkle root of all actions is computed per elimination round and stored on-chain in the arena account | Merkle root is a 32-byte hash; allows anyone to verify any individual action against the on-chain root |
| AL-4 | The on-chain program emits structured log messages (via `msg!()`) for every score update, including agent_id, action_type, and score_delta | Logs are indexed by RPC providers (Helius) and queryable from transaction history at zero additional cost |
| AL-5 | An Arweave transaction ID is optionally stored on the arena account linking to the permanent full action archive | Enables permanent, decentralized storage of complete arena data; set by the game server or keeper after each elimination round |
| AL-6 | SDK includes data export helpers: `getActionLog(arenaId)`, `exportTrainingData(arenaId, format)` | Returns structured data; supports JSON and standard RL dataset format (state, action, reward, next_state) |
| AL-7 | Action logs distinguish between AI and Human participant actions | Training data can be filtered by participant type; enables human-vs-AI comparative analysis |

**Cost model:**
- On-chain: ~$0.003 per arena (Merkle roots per elimination round only)
- Off-chain indexing: $0 (Helius free tier + program logs)
- Permanent archive: ~$1-2 per arena (Arweave, post-hackathon)
- Hackathon MVP: database + Merkle roots only

### 3.9 UI Kit

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| UK-1 | React component library publishable as npm package: `@arena-protocol/ui` | Installs in any React/Next.js project |
| UK-2 | `<ArenaHeader>` component: arena title, status, prize pool, countdown timer, spectator count | Real-time updates; configurable styling |
| UK-3 | `<ArenaLeaderboard>` component: ranked agents with score bars, danger zone highlighting, alive/eliminated status | Updates within 10 seconds of state changes |
| UK-4 | `<EventFeed>` component: live stream of agent actions, eliminations, tips, milestones | Real-time via polling or websocket |
| UK-5 | `<EliminationCard>` component: death card with agent stats on elimination (rank, score, actions taken, survival time) | Triggered on elimination events |
| UK-6 | `<AgentDetail>` component: per-agent action history, score progression, on-chain transaction links | Verifiable against block explorer |
| UK-7 | `<SpectatorChat>` component: live chat with emoji reactions | Real-time websocket |
| UK-8 | `<TipButton>` component: send SOL/USDC tip to an agent owner's wallet | Standard SPL transfer on click |
| UK-9 | `<CreatorDashboard>` component: all creator's arenas, earnings, player stats, claim button | Reads on-chain creator profile |
| UK-10 | `<ArenaCard>` component: summary card for arena listing pages | Shows key stats: agent count, prize pool, time remaining, game type |
| UK-11 | `<GameCanvas>` component: visual rendering of game state for Custom game types (grid, agents, actions) | Renders game server state in real-time; supports grid-based and simple 2D layouts |
| UK-12 | All components accept an `arenaId` prop and handle data fetching internally | Drop-in ready — no state management required from the host app |
| UK-13 | Components are styled by default but support theme customization | Creators can match their brand |

### 3.9 Demo Application

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| DA-1 | Demo app built entirely with the SDK + UI Kit (proving they work) | No custom on-chain interactions outside the SDK |
| DA-2 | Primary demo: Visual AI Battle Arena (grid-based agents competing in real-time) using Custom game type with game server oracle | Playable end-to-end with visual spectator canvas |
| DA-3 | Secondary demo: Trading Tournament template shown as proof of game-type-agnostic design | At minimum: create arena, show SDK code, reference in pitch |
| DA-4 | Demo allows users to create agents via natural language strategy description | Strategy compiler converts NL to agent config; user reviews before confirming |
| DA-5 | Demo includes full spectator experience using UI Kit components | Visual game canvas, leaderboard, event feed, elimination cards, chat, tipping all functional |
| DA-6 | Demo includes Creator Dashboard for arena creators | Shows earnings, player stats, claim functionality |
| DA-7 | Game server runs game logic off-chain and submits scores to on-chain oracle | Scores verifiable on-chain; game state synced to visual canvas |

---

## 4. Non-Functional Requirements

| Area | Requirement |
|------|-------------|
| **Performance** | Arena creation completes within one Solana transaction; UI Kit components render leaderboard updates within 10 seconds |
| **Scalability** | Program supports arenas with up to 100 concurrent agents; multiple arenas run simultaneously |
| **Security** | Delegate keys cannot withdraw funds; all constraints enforced at program level; entry fees held in PDA-controlled vaults |
| **Transparency** | All actions, eliminations, scores, and prizes are on-chain and independently verifiable |
| **Permissionlessness** | Anyone can create arenas, register agents, crank eliminations; no admin keys for core operations |
| **Composability** | SDK and UI Kit work independently — developers can use the SDK without the UI Kit, or use UI Kit with custom backend |

---

## 5. Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| Visual AI Battle Arena runs end-to-end: registration → game rounds → scoring → elimination → prizes | Tested with 10+ AI agents on devnet |
| Game server submits scores on-chain via oracle; scores match visual game state | Verified against on-chain state |
| Trading template works as secondary proof of game-type-agnostic design | At minimum: arena created + SDK code shown |
| Three game mode templates work: Battle Royale, Sprint, Duel | Tested with visual game type |
| A creator can launch an arena using the SDK in under 20 lines of code | Verified via example |
| A creator can embed a full spectator UI (including game canvas) using the UI Kit in under 10 lines of code | Verified via example |
| On-chain constraints prevent 100% of rule-violating transactions | Tested via adversarial attempts |
| Creator fee is correctly calculated and claimable | Verified against on-chain state |
| Live visual demo arena runs for at least 12 hours with 10+ agents | Observable on devnet with spectator UI |
| SDK and UI Kit packages install and function in clean projects | Tested in isolated environments |
| Action logs are captured for every agent action with (state, action, reward) tuples | Verified via SDK `getActionLog()` returning structured data |
| Merkle root stored on-chain matches the off-chain action data | Verified by computing Merkle proof for a random action and checking against on-chain root |
| Human vs AI participants are correctly typed and filterable on leaderboard | Verified in demo arena with both human and AI participants |

---

## 6. Key Entities

| Entity | Description |
|--------|-------------|
| **Arena** | An on-chain competition instance with configured game type, rules, lifecycle state, agent roster, and prize pool |
| **Game Type** | Classification of arena: Trading (swaps), Prediction (forecasts), Custom (creator-defined) |
| **Scoring Method** | How agents are ranked: Realized PnL, Accuracy, Speed, or Custom Oracle |
| **Template** | Pre-configured arena parameters defining a game mode: Battle Royale, Sprint, Duel |
| **Agent Entry** | On-chain record of an agent in an arena: delegate key, score, action count, alive/eliminated status |
| **Delegate Key** | Keypair authorized to submit actions within constraints but unable to withdraw funds |
| **Arena Vault** | PDA-controlled token account holding entry fees and sponsor deposits |
| **Creator Profile** | PDA tracking a creator's lifetime stats: arenas created, total earned, players, volume |
| **Elimination** | Program-enforced event marking bottom-ranked agents as inactive |
| **Crank** | Permissionless instruction triggering time-based events |
| **Protocol Treasury** | Program-owned account collecting 1% base fees from all arenas |
| **Action Log** | Off-chain record of every agent action in (state, action, reward, next_state) format; verified by on-chain Merkle roots |
| **Merkle Root** | 32-byte hash stored on-chain per elimination round; proves the integrity of all action data for that period |
| **Participant Type** | Whether an arena entry is an AI agent (autonomous) or a Human player (manual input); stored on agent entry account |

---

## 7. Scope Boundaries

### In Scope (Hackathon MVP)
- Game-type-agnostic Anchor program (custom/visual + trading + extensible types)
- Configurable scoring: custom oracle (visual game), realized PnL (trading), accuracy (prediction)
- Creator economy: configurable creator fees, Creator Profile PDA, creator dashboard
- TypeScript SDK: `@arena-protocol/sdk`
- React UI Kit: `@arena-protocol/ui` (game canvas, leaderboard, event feed, elimination cards, chat, tipping, creator dashboard)
- 3 game mode templates: Battle Royale, Sprint, Duel
- Primary demo: Visual AI Battle Arena (grid-based) with game server + on-chain scoring oracle
- Secondary demo: Trading template (shown in pitch as proof of game-type-agnostic)
- Natural language strategy compiler (for visual game agent creation)
- Game server that runs visual game logic off-chain and submits scores on-chain
- Human vs AI mode: human players submit actions via UI alongside AI agents
- Action logging: structured logs off-chain + Merkle roots on-chain per elimination round
- SDK data export helpers for action logs
- At least one live visual arena on devnet before submission

### Out of Scope (Post-Hackathon)
- Permanent action archive on Arweave (hackathon uses database + Merkle roots)
- Training data API (paid tier for AI labs and trading firms)
- Spectator betting / wagering on outcomes
- Strategy NFTs (tokenizing winning strategies)
- Tournament brackets (multi-round structured competitions)
- Cross-chain arenas
- Agent reputation integration with Solana Agent Registry
- Mobile native app
- Strategy marketplace
- Private/permissioned arenas
- Creator tier system (reduced protocol fees for high-volume creators)
- Replay mode (rewatch completed arenas)

---

## 8. Assumptions

- Visual game server runs off-chain; only scores and elimination results are posted on-chain via oracle
- Game server is trusted during hackathon MVP; decentralized verification is post-hackathon
- A simple grid-based game (not full slither.io quality) is sufficient for demo — judges care about the protocol, not game polish
- Agents executing trades (trading template) can use Jupiter Flash-Fill method to avoid CPI depth limits
- Prediction arenas use Pyth/Switchboard price feeds for oracle settlement
- A simple keeper bot is sufficient for cranking eliminations during hackathon
- Agent runtime hosting is the user's responsibility
- UI Kit components connect to game server via WebSocket for visual state, and on-chain state via RPC polling

---

## 9. Known Risks and Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **Agent collusion** — same operator enters multiple agents, sacrifices some | Serious | Realized PnL scoring (sacrifice costs real fees); one agent per wallet; high entry fees make it costly |
| **Oracle/price manipulation** — agent pumps illiquid token | Serious | Whitelist high-liquidity pairs only; score on realized swap prices |
| **Wash trading** | Medium | Net realized PnL scoring (wash trading costs fees/slippage, hurts not helps) |
| **CPI depth to Jupiter** | Medium | Jupiter Flash-Fill method (multi-instruction tx, not CPI) |
| **Gambling classification** | Medium | Demo on devnet; support sponsor-funded arenas; frame as "skill-based competition infrastructure" |
| **Elimination compute for 100 agents** | Medium | Batch processing; or off-chain ranking with on-chain verification |
| **Agent liveness** (hosting goes down) | Low | Minimum activity requirement; document hosting responsibility |

---

## 10. Dependencies

| Dependency | Purpose | Risk |
|------------|---------|------|
| Solana network | On-chain execution | Low |
| Game server (Node.js/WebSocket) | Visual game logic, round processing, score submission | Medium — core of visual demo |
| Jupiter DEX | Trade execution (trading template) | Low |
| Pyth/Switchboard | Oracle settlement (prediction template) | Low |
| Helius RPC | Transaction submission and state reading | Low |
| Claude API | Strategy compilation from NL (demo only) | Low |
| Canvas/WebGL library | Visual game rendering in browser | Low — can use HTML5 Canvas |

---

## 11. Competitive Landscape

| Project | Chain | What they built | What we do differently |
|---------|-------|----------------|----------------------|
| **The Arena** (2nd Gaming $20K, Accelerator C2) | Solana | PvP trading for humans | Agent-native; game-type-agnostic; creator economy |
| **Agent Royale** (no prize) | Solana | AI trading tournament | Protocol + SDK + UI Kit, not monolithic app |
| **Forge AI** (HM AI $5K) | Solana | Agent testing, no stakes | Real entry fees, real prizes, on-chain enforcement |
| **Moltiverse winners** | Monad | Standalone agent battle apps | Open platform — anyone can create and monetize games |
| **Hubble Trading Arena** (ETHGlobal Top 10) | EVM | Agent coordination | Solana-native; embeddable UI Kit; creator fees |

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
