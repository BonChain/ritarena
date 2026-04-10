# Homepage Persona Redesign

**Date:** 2026-04-10
**Status:** Approved
**Context:** Roast feedback from 3 personas (judge, developer, user) identified an identity crisis — the homepage tries to serve 4 audiences at once. Winners like The Arena, Supersize, and MCPay all pick one clear message and route users fast.

## Problem

The current homepage mixes developer SDK marketing, spectator entertainment, creator economy pitch, and judge-facing infrastructure claims into a single scroll. All 3 roast personas flagged this:
- Judge: "Four personas, zero depth"
- Developer: "The CTA says Start Building but the page shows a game"
- User: "Start Building? I just want to play"

## Design

Restructure the homepage as a **mini pitch deck** that states the problem, shows the solution, and routes each persona to their dedicated sub-page.

### Page Structure

| # | Section | Component | Purpose |
|---|---------|-----------|---------|
| 1 | Hero | Existing hero + ArenaCanvas | What it is in 10 words |
| 2 | The Problem | New section | Why this needs to exist — market gap |
| 3 | The Solution | CodeBlock + feature bullets | SDK proof + what you get |
| 4 | Portal Cards | New 3-card grid | Route personas to sub-pages |
| 5 | Traction Strip | New stats bar | Real/planned numbers |
| 6 | Bottom CTA | Existing CTA | npm install + waitlist |

### Section Details

#### 1. Hero (no changes)
Keep the current hero exactly as shipped:
- "AI bots and humans fight each other for prize money."
- "Build an arena. Deploy a bot — or play yourself. Winner takes the pool."
- "Think Roblox, but for AI competitions. Built on Solana."
- ArenaCanvas on the right
- WaitlistForm with "Start Building" CTA

#### 2. The Problem (new)
- Headline: "The problem"
- Body: "800 teams built AI agents this year. Zero had a platform to compete on."
- Supporting: "Every team rebuilt the same thing from scratch — escrow, scoring, elimination, prize distribution. That's 4 weeks of infrastructure before the first bot fights."
- Stat line: "400 teams at Monad Moltiverse · 400 at Colosseum Agent Hackathon · 15M+ agent transactions on Solana"

#### 3. The Solution (replaces old "How it Works")
- Headline: "10 lines. 5 minutes."
- Left: CodeBlock component (existing create-arena.ts example)
- Right: Bullet list of what RitArena handles:
  - On-chain escrow — funds locked, no rugs
  - Commit-reveal rounds — no front-running
  - Automatic elimination & prize distribution
  - Creator earns 0-20% fee

#### 4. Portal Cards (replaces old 3-step + routes to sub-pages)
- Headline: "Who is RitArena for?"
- 3 glass-card tiles in a grid:

**Creators:**
- "Build arenas. Get instant players — our agents and viewers find your game. Earn 0-20% of every entry fee."
- CTA: "Create Arena →" → links to `/creators`

**Developers:**
- "Deploy your agent. Win prize money. Get performance data to improve your AI."
- CTA: "Deploy Agent →" → links to `/developers`

**Players:**
- "Compete or watch. Beat the bots — or bet on them. Fun. Money. No code needed."
- CTA: "Enter Arena →" → links to `/arena`

#### 5. Traction Strip (new)
- Horizontal stats bar with real/planned numbers
- Initial content: "3 arenas planned · $500 in prizes · First arena: Apr 20 · Open source"
- Future: swap with real metrics as arenas run
- No fake/mock numbers

#### 6. Bottom CTA (no changes)
- "The arena is waiting."
- npm install @ritarena/sdk badge
- WaitlistForm with "Start Building"

### Sections Removed from Homepage
- **"How it Works" 3-step cards** — replaced by Solution section (more specific)
- **Human vs AI section** — moves to `/arena` sub-page where it belongs
- **DataFlywheel section** — was not on homepage but stays on `/creators` or `/about`

### Sections Kept
- ArenaCanvas in hero (live demo is strong)
- NavTicker kill feed (engaging, differentiating)
- All sub-pages (`/arena`, `/creators`, `/developers`, `/about`) unchanged
- Navbar, Footer unchanged

### Files to Modify
- `landing-v2/src/app/page.tsx` — full rewrite of page content
- No new components needed — reuse existing `CodeBlock`, `AnimatedSection`, `WaitlistForm`, `ArenaCanvas`

### Files NOT Modified
- All sub-page files (`arena/page.tsx`, `creators/page.tsx`, `developers/page.tsx`, `about/page.tsx`)
- All component files (no API changes needed)
- `globals.css`, `layout.tsx`, `constants.ts`

## Research Backing

**Winner positioning patterns (Colosseum Copilot data):**
- Winners use 3-6 word taglines with zero jargon
- MCPay (1st Stablecoins, C4 Accelerator): two clear audience CTAs — "Browse Servers" / "Monetize Servers"
- Supersize (1st Gaming, C2 Accelerator): "On-chain Real Money Gaming" → "Play Now"
- The Arena (2nd Gaming, C2 Accelerator): "A PvP social trading game"

**a16z crypto messaging advice:**
- "Use language your target audience already knows"
- "Focus on tangible outcomes, not technical specifications"
- Mission + benefits + elevator pitch as distinct layers

**Advisor framework (from user's roast input):**
- "Can someone outside crypto understand it in 10 words?"
- "Find the web2 equivalent" (Roblox anchor)
- "Colosseum is a VC — they want product mindset end-to-end"
