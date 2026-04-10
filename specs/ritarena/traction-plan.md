# RitArena — Traction Plan

**Goal**: Build enough traction evidence to win Colosseum Frontier by May 11, 2026
**Today**: April 9, 2026 (4.5 weeks left)
**Rule**: Every hour not coding should be building traction. Spec is done.

---

## Accounts to Set Up (Day 1 — April 9)

### 1. Founder Twitter: @tanawat_dev (or your preferred handle)

**Purpose**: Personal brand as the builder. Judges follow founders, not products.

**Bio template**:

```
Building @RitArena — AI agent battle arenas on Solana
Anchor/Rust dev | ex-Mushin, ex-Pactda (Sui overflow 3rd place winner)
Building in public for @colosseum Frontier 🏟️
```

**Pinned tweet**: Thread about what you're building and why.

### 2. Product Twitter: @RitArena

**Purpose**: Product updates, arena results, community engagement.

**Bio template**:

```
AI agents battle on a grid. Real USDC stakes. Every move provable on-chain.
Off-chain speed. On-chain trust.
npm install @ritarena/sdk
🏟️ Building at @colosseum Frontier
```

**Profile**: Use landing page screenshot or game canvas mockup as header.

### 3. Discord: RitArena

**Purpose**: Community hub for agent developers who want to compete.

**Channels**:

```
#announcements     — arena launches, updates
#general           — discussion
#enter-your-agent  — how to register and compete
#arena-results     — post-arena stats and replays
#builder-chat      — for creators building on the SDK
#feedback          — what should we build next
```

**Don't over-build Discord.** 6 channels max. Focus on getting 20-50 people in, not building a perfect server.

### 4. GitHub: ritarena (organization)

**Purpose**: Open-source credibility. Judges check GitHub.

**Repos**:

- `ritarena` — monorepo (Anchor program + SDK + UI Kit + demo app)
- `grid-wars` — open-source demo game logic (the rules_hash reference implementation)

### 5. YouTube: RitArena

**Purpose**: Weekly 1-min build videos + final demo video.

Don't overthink production quality. Screen recordings with voiceover are fine.

---

## Content Calendar (4.5 Weeks)

### Week 1: April 9-12 — "We're Building This"

| Day    | Founder Twitter                                                                                                                             | Product Twitter                                                                                                                                                                         | Other                                                                                  |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Wed 9  | Set up account. First tweet: "I'm building an AI agent battle arena on Solana for @colosseum Frontier. Thread 🧵"                           | Set up @RitArena. First tweet: "RitArena is live. AI agents battle on a grid for real USDC. Every move provable on-chain via Merkle trees. We're building this at @colosseum Frontier." | Set up Discord. Post in Colosseum Discord #showcase                                    |
| Thu 10 | Tweet: screenshot of Anchor program compiling. "Day 1: Agent registry on devnet. 5 USDC to register. Your agent gets an on-chain identity." | Retweet founder                                                                                                                                                                         | Post in ElizaOS Discord #builders: "Building an arena for your Eliza agents to battle" |
| Fri 11 | Tweet: architecture diagram (on-chain vs off-chain). "Why we chose off-chain game logic + Merkle proofs instead of fully on-chain."         | Tweet the architecture diagram with more detail                                                                                                                                         | Post in Superteam Discord                                                              |
| Sat 12 | Tweet: "Week 1 done. Agent registry + arena creation + entry fee escrow on devnet. 1-min video 👇"                                          | Post the 1-min video                                                                                                                                                                    | YouTube: upload Week 1 video                                                           |

**Week 1 thread (Founder — pin this)**:

```
I'm building @RitArena for @colosseum Frontier.

Here's what it is and why:

1/ AI agents are everywhere on Solana. 15M+ transactions.
   But there's no way to PROVE your agent is better than mine.

2/ RitArena is an arena where AI agents battle on a grid
   for real USDC stakes. Think Auto Chess meets crypto.

3/ The twist: game logic runs off-chain (fast, cheap),
   but every move is recorded in a Merkle tree.
   The root goes on-chain. Any action is provable.

4/ Commit-reveal rounds mean the server can't peek
   at your agent's strategy before resolving.

5/ Creators launch arenas and earn fees (0-20%).
   Protocol takes 1%. It's Roblox for AI agents.

6/ Creator stake bonds: put USDC behind your arena's fairness.
   Bond returned if you play fair. Forfeited if you don't.

7/ Agent Profile registry: 5 USDC to register.
   Your agent builds on-chain reputation over time.
   Wins, losses, earnings — all verifiable.

8/ We're building this in 5 weeks for @colosseum Frontier.
   Follow along. I'll post progress every day.

9/ If you build AI agents on Solana and want to battle,
   DM me. We're looking for early testers.

🏟️ @RitArena
```

---

### Week 2: April 13-19 — "It Works"

| Day    | Founder Twitter                                                                                                    | Product Twitter                                               | Other                                                                          |
| ------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Mon 13 | "Game server is running. Agents submit moves via commit-reveal. Server can't peek. 🔒"                             | Tweet showing commit-reveal round in action (terminal output) |                                                                                |
| Wed 15 | "First Merkle root on devnet! Every action from Round 1-50 hashed into one 32-byte proof on-chain." + Solscan link | Share Solscan link                                            | Post in Colosseum Discord: "Merkle root from our first test arena is on-chain" |
| Fri 17 | "Ran our first internal arena. 10 agents. 50 rounds. 3 eliminations. All provable." + screenshot of game state     | Post arena results with stats                                 | Post results in ElizaOS + SendAI communities                                   |
| Sat 19 | "Week 2 done. Full game loop working. 1-min video 👇"                                                              | Post video                                                    | YouTube: Week 2 video. Post in Olas Discord                                    |

**Key content this week**: Show it working. Terminal screenshots, Solscan links, game state visuals. Raw and real > polished and fake.

---

### Week 3: April 20-26 — "Come Play"

This is the critical week. You need EXTERNAL agents entering.

| Day    | Founder Twitter                                                                                                                               | Product Twitter                                                   | Other                                                                       |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Mon 20 | "The spectator UI is live. Watch AI agents fight in real-time. 🏟️" + screenshot                                                               | Tweet game canvas screenshot                                      |                                                                             |
| Tue 21 | "Calling all AI agent builders on Solana. Arena #1 opens Wednesday. Free entry. 100 USDC sponsored prize pool. Your agent vs ours. Thread 👇" | Retweet + add "Register your agent: [link]"                       | DM 10 agent devs personally. Post in ALL Discords (see outreach list below) |
| Wed 22 | "Arena #1 is LIVE. 🔴 [X] agents registered. Watch here: [link]"                                                                              | Live-tweet the arena. Post updates every hour during eliminations | Post in Colosseum, ElizaOS, SendAI, Arc, Superteam, Gaming on Solana        |
| Thu 23 | "Arena #1 results. [X] agents competed. [Winner] took [X] USDC. Every move verifiable on-chain. Here's the Merkle proof 👇" + Solscan         | Post full results with stats table                                | Post results in all communities                                             |
| Fri 25 | Tag specific agents/teams: "GG @[agent_dev]. Your agent survived 37 rounds. Here's the action log."                                           | Post "Arena #2 coming Monday. Bigger stakes."                     |                                                                             |
| Sat 26 | "Week 3 done. First public arena. [X] external agents. 1-min video 👇"                                                                        | Post video                                                        | YouTube: Week 3 video                                                       |

**Outreach messages for Arena #1 (send to Discords + DMs)**:

```
Hey! I'm building RitArena — an AI agent battle arena on Solana
for the Colosseum Frontier hackathon.

We're running our first public arena this Wednesday:
- Grid-based battle royale
- Free entry (sponsored 100 USDC prize pool)
- Your agent competes against others for real prizes
- Every move is recorded in a Merkle tree, provable on-chain
- Commit-reveal so the server can't peek at strategies

If you have an AI agent (ElizaOS, Olas, Agent Kit, custom — anything),
you can enter. We provide a simple SDK to connect.

Interested? I'll send you the docs.

Arena link: [URL]
Docs: [URL]
```

---

### Week 4: April 27 - May 3 — "Traction Proof"

| Day    | Founder Twitter                                                                                              | Product Twitter          | Other                         |
| ------ | ------------------------------------------------------------------------------------------------------------ | ------------------------ | ----------------------------- |
| Mon 27 | "Arena #2 is live. [X] agents. Higher stakes."                                                               | Live-tweet arena         | Post everywhere               |
| Wed 29 | Results thread with comparison: "Arena #1: [X] agents. Arena #2: [X] agents. [X]% came back."                | Stats graphic            |                               |
| Thu 30 | "Creator dashboard: earned $[X] in fees from 2 arenas. Any developer can do this with our SDK." + screenshot | Post SDK code example    |                               |
| Fri 1  | "Arena #3 — the BIG one. [X] USDC prize pool. Open registration."                                            | Registration countdown   | Final push in all communities |
| Sat 3  | "Week 4. 3 arenas run. [X] agents total. [X]% return rate. The data speaks."                                 | Traction summary graphic | YouTube: Week 4 video         |

---

### Week 5: May 4-11 — "Ship"

| Day    | Founder Twitter                                                                                | Product Twitter                  | Other                                               |
| ------ | ---------------------------------------------------------------------------------------------- | -------------------------------- | --------------------------------------------------- |
| Mon 4  | "Recording the demo video today. 3 arenas. [X] agents. [X] USDC in creator fees. Real data."   | Teaser clip                      |                                                     |
| Wed 6  | "Demo video is up. Watch AI agents battle for real stakes on Solana. Every move provable. 👇"  | Post full demo video (3 min)     | Post video everywhere. Tag @colosseum @solana       |
| Thu 7  | Post pitch video (2 min). Tag @mattytay @crabbylions @colosseum                                | Retweet                          | YouTube: both videos                                |
| Fri 8  | "Published on npm: @ritarena/sdk. 10 lines to create an arena. Try it."                        | npm install instructions         | Post in dev communities                             |
| Sun 10 | "Submitted to @colosseum Frontier. Here's what we built in 5 weeks. Thread 👇" with full stats | Final stats + link to submission | Post in all communities. Thank everyone who entered |

---

## Community Outreach Targets

### Priority 1 — Must Engage (This Week)

| Community             | Where                         | Action                                                             | Who posts |
| --------------------- | ----------------------------- | ------------------------------------------------------------------ | --------- |
| **Colosseum Discord** | Discord #showcase / #builders | Post project, engage in workshops, get feedback                    | Founder   |
| **Colosseum Forum**   | arena.colosseum.org           | Post: "Building agent battle infrastructure — looking for testers" | Founder   |
| **ElizaOS Discord**   | #builders or #showcase        | "Built an arena for Eliza agents to compete"                       | Founder   |
| **SendAI community**  | Discord/Twitter               | "Your Solana Agent Kit agent can battle in our arena"              | Founder   |

### Priority 2 — Engage by Week 2

| Community                    | Where                 | Action                                               |
| ---------------------------- | --------------------- | ---------------------------------------------------- |
| **Arc/Rig Discord**          | #builders             | "Rust agent framework? Perfect for our battle arena" |
| **Olas Discord**             | #general or #builders | "Autonomous agents can compete for real stakes"      |
| **Superteam Discord**        | #builders             | Share progress, ask for feedback                     |
| **Gaming on Solana Discord** | #projects             | "AI gaming meets on-chain verification"              |
| **MagicBlock Discord**       | #builders             | Discuss on-chain vs off-chain game architecture      |

### Priority 3 — Engage by Week 3 (Arena #1 launch)

| Community                        | Where             | Action                                                        |
| -------------------------------- | ----------------- | ------------------------------------------------------------- |
| **Solana Tech Discord**          | Relevant channels | Share arena announcement                                      |
| **Twitter/X agent dev accounts** | DMs + mentions    | Invite to Arena #1 personally                                 |
| **Superteam Earn**               | superteam.fun     | Post bounty: "Build an agent for RitArena arena — win prizes" |

---

## Twitter Accounts to Engage (Tag, Reply, Quote)

### Must Engage

| Handle          | Who                         | How to engage                               |
| --------------- | --------------------------- | ------------------------------------------- |
| @colosseum      | Hackathon host              | Tag in all progress tweets                  |
| @mattytay       | Colosseum co-founder, judge | Tag in key milestones                       |
| @crabbylions    | Colosseum co-founder, judge | Tag in key milestones                       |
| @shawmakesmagic | ElizaOS founder             | "Your Eliza agents can battle in our arena" |
| @sendaifun      | Solana Agent Kit            | "Built on Solana Agent Kit compatibility"   |
| @solana         | Ecosystem                   | Tag in major announcements                  |

### Should Engage

| Handle            | Who                         | How to engage                                   |
| ----------------- | --------------------------- | ----------------------------------------------- |
| @0thTachi         | Arc/Rig founder             | "Rust agents welcome in our arena"              |
| @autonolas        | Olas protocol               | "Autonomous agents can compete"                 |
| @superteam        | Builder community           | Tag in progress updates                         |
| @GamingOnSolana\_ | Gaming community            | Tag in arena launches                           |
| @aeyakovenko      | Anatoly (Solana co-founder) | Only tag for major milestone (Arena #1 results) |

---

## Traction Metrics to Track

Track these daily. They become your submission evidence.

| Metric                          | Target by May 11 | Where it appears                |
| ------------------------------- | ---------------- | ------------------------------- |
| Arenas run                      | 3-5              | Pitch video, submission         |
| Total agents competed           | 30-50+           | Pitch video                     |
| External agents (not yours)     | 10-20+           | **Critical** — proves demand    |
| Return rate (entered 2+ arenas) | Any %            | Shows retention                 |
| Creator fees earned             | Any USDC         | Proves revenue model            |
| Twitter followers (@RitArena)   | 200+             | Social proof                    |
| Discord members                 | 50+              | Community proof                 |
| DMs saying "I'd use this"       | 5-10 screenshots | User validation                 |
| npm downloads (@ritarena/sdk)   | Any              | Developer adoption              |
| GitHub stars                    | 20+              | Open-source credibility         |
| Merkle roots on-chain           | 10+              | Technical proof (Solscan links) |

---

## DM Template for Agent Developers

Send this to 10-20 people personally:

```
Hey [name]! I saw you're building [their agent/project] — really cool.

I'm working on RitArena for the Colosseum Frontier hackathon —
it's an arena where AI agents battle on a grid for real USDC stakes.

We're running our first public arena [date] with a sponsored
prize pool (free entry). Would love to have your agent compete.

The SDK is simple — your agent connects to our game server via
WebSocket, receives game state each round, and submits actions
(move, attack, defend). We handle escrow, scoring, and prizes on-chain.

Every action is recorded in a Merkle tree — provable on Solana.
No trust required.

Would you be down to try it? I can send you the docs + an invite.
```

---

## What to Post in Each Community

### Colosseum Discord

```
🏟️ Building RitArena — AI agent battle arenas on Solana

AI agents compete on a grid for real USDC. Off-chain game logic,
on-chain Merkle tree verification. Commit-reveal so the server
can't peek at strategies.

Looking for agent developers to test our first public arena next week.
Free entry, sponsored prize pool.

Progress: [link to Twitter thread]
GitHub: [link]
```

### ElizaOS Discord

```
Built an arena for your Eliza agents to compete 🤖⚔️

RitArena lets AI agents battle on a grid for real USDC stakes.
Your Eliza agent can connect via WebSocket, receive game state,
and submit actions each round.

Running first public arena [date] — free entry, [X] USDC prizes.
Looking for brave agents to enter.

SDK docs: [link]
```

### SendAI Community

```
Your Solana Agent Kit agent can now compete in battle arenas 🏟️

RitArena = grid-based AI battles with real USDC stakes on Solana.
Connect your agent via our SDK, compete against others, win prizes.

Every move is provable on-chain (Merkle trees).
Commit-reveal rounds so the server can't front-run.

First public arena: [date]. Free entry. [X] USDC prize pool.
Docs: [link]
```

---

## Budget

| Item                                                  | Cost             | Priority     |
| ----------------------------------------------------- | ---------------- | ------------ |
| Arena #1 sponsored prize pool                         | 100 USDC         | Must have    |
| Arena #2 sponsored prize pool                         | 200 USDC         | Should have  |
| Arena #3 sponsored prize pool                         | 500 USDC         | Nice to have |
| Superteam Earn bounty ("Build an agent for RitArena") | 50-100 USDC      | Nice to have |
| **Total**                                             | **350-850 USDC** |              |

This is your marketing budget. $350-850 to generate real traction data for a $250K accelerator opportunity. Worth it.

---

## The Submission Traction Slide

By May 11, your submission should include:

```
TRACTION (Real Data)

  🏟️ 3 arenas run on devnet
  🤖 47 agents competed (23 external)
  🔁 31% return rate (entered 2+ arenas)
  💰 $94 in creator fees earned
  ✅ 14 Merkle roots on-chain (verified on Solscan)
  🐦 230 Twitter followers in 4 weeks
  💬 "Would your agent survive RitArena?" — 12 DMs saying yes
  📦 npm: @ritarena/sdk — 38 downloads
  ⭐ GitHub: 24 stars

  "We didn't just build infrastructure. We proved agents want to compete."
```

Even hitting HALF of these numbers puts you ahead of 90% of hackathon submissions that have zero traction.
