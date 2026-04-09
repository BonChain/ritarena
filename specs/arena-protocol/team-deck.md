# Arena Protocol — Team Briefing Deck v2

Each section = 1 slide. Copy into Google Slides / Canva / Figma.
Updated based on advisor feedback: user-first, show don't claim, clear from slide 1.

---

## Slide 1: Title

```
ARENA PROTOCOL

Let developers create AI agent competitions on Solana
— without building escrow, scoring, or elimination from scratch.

Colosseum 2026 Frontier Hackathon
Apr 6 – May 11
```

---

## Slide 2: Meet Alex (The User's Problem)

```
Alex built an AI trading agent. It's really good.

He wants to:
  ✅ Prove it works against other agents
  ✅ Compete for prizes  
  ✅ Build a reputation

His options today:
  ❌ Post screenshots on Twitter → nobody trusts them
  ❌ Build his own competition platform → 4+ weeks of work
  ❌ Enter an existing competition → there isn't one

Alex is stuck. And he's not alone.
800 developers built agents this year.
None of them had a place to compete.
```

---

## Slide 3: Why "4 Weeks of Work"?

```
If Alex wants to run an agent competition himself,
he needs to build ALL of this from scratch:

  ☐ Escrow program        — hold entry fees safely in a vault
  ☐ Delegate keypairs      — agents can trade but can't steal
  ☐ Scoring system         — track every agent's performance
  ☐ Elimination logic      — who gets removed and when  
  ☐ Prize distribution     — split the pot fairly to winners
  ☐ Creator fee collection — Alex earns from his game
  ☐ Leaderboard UI         — show rankings in real-time
  ☐ Trade/action feed      — show what agents are doing
  ☐ Security constraints   — prevent cheating, draining, manipulation

= 2,000+ lines of Anchor code
= 4 weeks minimum for an experienced Solana developer
= Alex just wanted to compete, not build a platform
```

---

## Slide 4: With Arena Protocol

```
Alex uses our SDK instead:

  const arena = await ArenaProtocol.createArena({
    template: "battle-royale",
    entryFee: 20_000_000,     // 20 USDC
    maxAgents: 50,
    eliminationPercent: 20,   // bottom 20% eliminated
    creatorFeeBps: 500,       // Alex earns 5%
  });

That's it. Arena is live on-chain.

  ✅ Escrow         → handled by our program
  ✅ Delegate keys   → handled
  ✅ Scoring         → handled
  ✅ Elimination     → handled  
  ✅ Prizes          → handled
  ✅ Creator fees    → Alex earns 5% to his wallet

Then he adds the spectator view:

  <ArenaLeaderboard arenaId={arena.id} />
  <EventFeed arenaId={arena.id} />

Two components. Full live spectator experience.

5 MINUTES instead of 4 WEEKS.
```

---

## Slide 5: What It Looks Like (Spectator View)

```
┌─────────────────────────────────────────────────┐
│  🔴 LIVE   GRID WARS #7    ⏱ 2h until elim     │
│  Prize: 940 USDC  |  Alive: 31/50  |  👁 847    │
│                                                   │
│  ┌─────────────────────┐  🥇 AlphaBot    +42 🔥 │
│  │                     │  🥈 Hunter_v3   +31    │
│  │   [Visual Canvas]   │  🥉 Flanker     +28    │
│  │   Agents moving,    │  ...                    │
│  │   fighting, dying   │  ── DANGER ZONE ──      │
│  │   on a grid         │  #29 Camper     -12 ⚠️  │
│  │                     │  #30 Random     -18 💀  │
│  └─────────────────────┘                         │
│                                                   │
│  ⚡ AlphaBot attacked Hunter_v3 for 12 damage    │
│  💀 ELIMINATED: SleepyBot at rank #32            │
│  💬 "AlphaBot is GOATED" 🔥                      │
└─────────────────────────────────────────────────┘

All of this = UI Kit components.
Creator embeds them. We render them.
```

---

## Slide 6: How the Money Works

```
Entry Fee (set by Alex, e.g., 20 USDC per agent)

50 agents join = 1,000 USDC total

  ├── Protocol fee: 1%   → 10 USDC   → Arena Protocol treasury
  ├── Creator fee: 5%    → 50 USDC   → Alex's wallet
  └── Prize pool: 94%    → 940 USDC  → Top 3 agents

Alex earns $50 just from creating this arena.
He can relaunch it every day.
He didn't write a single line of escrow code.
```

---

## Slide 7: Not Just Trading — Game Type Agnostic

```
The same program supports different game types:

  VISUAL BATTLE (primary demo)
  → Agents fight on a grid
  → Scored by survival + kills
  → Game server submits scores as oracle

  TRADING (secondary demo)
  → Agents swap tokens on Jupiter
  → Scored by realized PnL

  PREDICTION
  → Agents submit forecasts
  → Scored by accuracy after oracle settles

  CUSTOM
  → Creator defines actions + scoring oracle
  → Any game you can imagine

Same escrow. Same elimination. Same prizes.
Different games. That's the platform play.
```

---

## Slide 8: Why This Exists (The Market)

```
THE DEMAND IS PROVEN:

  400 teams entered Moltiverse (Monad) — agent battle arenas won
  400 teams entered Colosseum Agent Hackathon
  = 800 teams building agents that had nowhere to compete

THE PROBLEM IS PROVEN:

  Every team rebuilt escrow + scoring + elimination from scratch
  = 800 teams solving the same infra problem 800 different ways

WE'RE NOT GUESSING:

  The Arena → 2nd Gaming ($20K) + Accelerator C2 (human PvP trading)
  Legends of the Sun → 2nd Gaming ($20K) + Accelerator C1 (visual combat)
  Agent Royale → tried AI tournaments, failed (unfocused, no SDK)

  The market exists. The tooling doesn't. Until now.
```

---

## Slide 9: What We're Building (The 4 Layers)

```
┌─────────────────────────────────────────────┐
│  Layer 4: DEMO GAMES                         │
│  Visual Battle Arena + Trading Tournament    │
│  "We built these with our own tools"         │
├─────────────────────────────────────────────┤
│  Layer 3: UI KIT  @arena-protocol/ui         │
│  Drop-in React components for spectator UX   │
│  Leaderboard, feed, canvas, chat, tipping    │
├─────────────────────────────────────────────┤
│  Layer 2: SDK  @arena-protocol/sdk           │
│  Create arenas, register agents, read state  │
│  10 lines to launch a competition            │
├─────────────────────────────────────────────┤
│  Layer 1: ANCHOR PROGRAM  (on-chain engine)  │
│  Escrow, scoring, elimination, prizes, fees  │
│  Game-type agnostic. Deployed once.          │
└─────────────────────────────────────────────┘

Developers only touch Layer 2 + 3.
Layer 1 runs underneath. Layer 4 is the proof.
```

---

## Slide 10: Competitive Landscape

```
WHY OTHERS FAILED:

  The Arena (2nd Gaming $20K + Accelerator)
    → Built for HUMANS, not AI agents

  Agent Royale (Breakout, NO PRIZE)
    → One app, not a platform. Too many buzzwords.

  Forge AI (HM $5K)
    → Testing arena, no real stakes

  Moltiverse winners (Monad)
    → Standalone apps. Every team rebuilt infrastructure.

ARENA PROTOCOL:
  → Platform, not app (SDK + UI Kit)
  → AI agent native
  → Creator economy (earn from your games)
  → On-chain enforcement (not app-level trust)
  → Spectator experience included
```

---

## Slide 11: Tech Stack

```
arena-protocol/
├── programs/arena/         # Anchor/Rust — Tenny
├── packages/
│   ├── sdk/                # TypeScript SDK
│   └── ui/                 # React UI Kit + GameCanvas
├── apps/
│   ├── web/                # Next.js demo app
│   ├── game-server/        # Visual game server (WebSocket)
│   └── agent-runtime/      # Agent runner (Node.js)
└── docs/                   # SDK + UI Kit docs

KEY TECH:
  Program:   Rust + Anchor
  Frontend:  Next.js + React + Tailwind
  SDK:       TypeScript
  Game:      HTML5 Canvas + WebSocket
  Trading:   Jupiter Flash-Fill
  Oracles:   Pyth / Switchboard
  RPC:       Helius
  Hosting:   Vercel + Railway
```

---

## Slide 12: 5-Week Plan

```
WEEK 1: Core program (arena, agents, constraints, fees)
WEEK 2: Game logic + game server + SDK complete
WEEK 3: UI Kit + demo app + visual game ← senior devs join
WEEK 4: Run live arenas + polish spectator UX
WEEK 5: Public arena + demo video + submit

MINIMUM VIABLE SUBMISSION (if behind):
  ✅ Anchor program with visual battle royale
  ✅ SDK that creates arenas
  ✅ Demo app with live leaderboard + game canvas
  ✅ 1 completed arena with real data
```

---

## Slide 13: Team Allocation

```
TENNY (Smart Contract Lead) — All 5 weeks
  → Anchor program, agent runtime, security review

JUNIOR DEV (SDK + Backend) — All 5 weeks
  → SDK, game server, backtest engine, strategy compiler

SENIOR DEV A (UI Kit) — Weeks 3-5
  → GameCanvas, Leaderboard, EventFeed, EliminationCard

SENIOR DEV B (Demo App) — Weeks 3-5
  → Arena browser, detail pages, agent creation flow

SENIOR DEV C (Polish) — Weeks 3-5
  → Landing page, creator dashboard, videos, submission
```

---

## Slide 14: What Success Looks Like

```
BY MAY 11 WE HAVE:

  ✅ Published SDK: npm install @arena-protocol/sdk
  ✅ Published UI Kit: npm install @arena-protocol/ui
  ✅ Visual battle arena running with real agents
  ✅ Trading template proving game-type-agnostic
  ✅ Creator dashboard showing earned fees
  ✅ 3+ completed arenas with data

THE NUMBERS:
  → [X] arenas run
  → [X] agents competed
  → [X] spectators watched
  → [X] USDC in creator fees earned
  → "5 minutes vs 4 weeks" — backed by the checklist
```

---

## Slide 15: Key Risks

```
RISK                          MITIGATION
────                          ──────────
No users yet                  Run 3+ public arenas ourselves
                              Seed with demo agents

Gambling classification       Devnet demo + sponsor-funded arenas

Too much scope                Cut prediction type first
                              Ship visual battle + SDK minimum

Agent collusion               Score on realized metrics
                              One agent per wallet

"Bold claim" on dev time      Show the 8-item checklist
                              Side-by-side: without us vs with us
```

---

## Slide 16: The Pitch (What Judges Hear)

```
"Alex built an AI agent. He wants to compete.

 Today, building a competition takes 4 weeks:
 escrow, scoring, elimination, prizes, security.

 With Arena Protocol: 10 lines of SDK.
 5 minutes. Arena is live. Alex earns fees.

 We ran [X] arenas. [X] agents competed.
 [X]% came back for the next one.

 800 developers built agents this year
 and had nowhere to compete. Now they do.

 npm install @arena-protocol/sdk"
```

---

## Slide 17: Let's Build

```
TODAY:
  □ Set up monorepo
  □ Initialize Anchor project
  □ Open Twitter/X @ArenaProtocol

THIS WEEK:
  □ Tenny: Core program accounts + constraints
  □ Junior: SDK types + Next.js scaffold + game server

QUESTIONS?
```
