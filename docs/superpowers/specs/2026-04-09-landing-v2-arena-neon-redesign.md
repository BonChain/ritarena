# Landing-v2 Redesign — Arena Neon Theme

**Date:** 2026-04-09
**Status:** Draft
**Scope:** Re-theme and restructure landing-v2 from single-page orange theme to 5-page Arena Neon (Solana-native) design.

## Summary

Transform the current single-page RitArena landing (orange `#FF6B2C` + purple `#8B5CF6` theme, Space Grotesk font) into a 5-page site using the Arena Neon theme (Solana green `#14F195` + purple `#9945FF` on near-black `#0a0a0f`). Add three new sections: Data Flywheel, Spectator Experience, and Human vs AI. Remove the fake stats bar. Merge "Pick Your Role" into the hero subtitle.

## Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Brand name | RitArena (keep) | Consumer-facing brand, Arena Protocol is the internal/hackathon name |
| Theme | Arena Neon (custom) | Unanimous focus group pick — Solana brand recognition, gaming energy |
| Page structure | 5 pages | Each concept gets dedicated focus, feels like a real product |
| Hero layout | Canvas hero, side-by-side | Headline left, animated battle canvas right — proven layout |
| Navbar | Simple text links + green CTA | Logo + Home / Arena / Creators / Developers / About + "Get Early Access" button |
| Removed | Stats Bar (fake numbers) | Fake metrics hurt credibility with hackathon judges |
| Removed | "Pick Your Role" section | Redundant — each role now has its own page. Merged into hero subtitle. |
| New sections | Data Flywheel, Spectator Experience, Human vs AI | Selected from 6 options in brainstorm |

## Theme Spec

Reference: `.claude/skills/theme-factory/themes/arena-neon.md`

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#14F195` | Primary accent, CTAs, active states, rankings |
| `--color-secondary` | `#9945FF` | Secondary accent, tags, hover states |
| `--color-bg` | `#0a0a0f` | Page background |
| `--color-surface` | `#0d0d18` | Card/surface background |
| `--color-text` | `#f0f0f0` | Primary text |
| `--color-muted` | `#888888` | Secondary text |
| `--color-dim` | `#55556a` | Tertiary/meta text |
| `--color-danger` | `#ff5555` | Live indicators, eliminations |
| `--gradient-primary` | `linear-gradient(135deg, #14F195, #9945FF)` | Hero elements, VS icon, progress bars, stat values ONLY |

### Typography (Google Fonts)

| Role | Font | Weights | CSS Variable | Loading |
|------|------|---------|-------------|---------|
| Display / Headers | Orbitron | 900, 700, 600 | `--font-display` | `next/font/google` |
| Body Text | Exo 2 | 300, 400, 600, 700 | `--font-body` | `next/font/google` |
| UI Labels / Names | Chakra Petch | 700, 600 | `--font-ui` | `<link>` preconnect |
| Monospace / Data | Share Tech Mono | 400 | `--font-data` | `<link>` preconnect |
| Scores / Numbers | Space Mono | 700 | `--font-score` | `<link>` preconnect |

**Dropped:** Rajdhani — too similar to Chakra Petch to justify a 6th font. Chakra Petch covers both UI labels and section labels.

**Migration:** All existing `font-[family-name:var(--font-mono)]` references (6+ usages in ArenaMockup, page.tsx, CodeBlock, agent SDK block) must be replaced with `font-[family-name:var(--font-data)]` or `font-[family-name:var(--font-score)]` depending on context. The old `--font-space` and `--font-mono` variables are removed.

### Gradient Rule

Use gradient **only** on: hero title, CTA buttons, VS icon, battle timer, progress bar fills, large stat values. Never on data-dense components, small text, or backgrounds.

## Page Structure

### 1. `/` (Home)

**Sections:**

1. **Navbar** — Fixed top. Logo "Rit`Arena`" (Arena in gradient). Links: Home, Arena, Creators, Developers, About. Green CTA button "Get Early Access".

2. **Hero** — Two-column grid.
   - Left: Headline "AI agents fight. / You `watch`. / Creators `earn`." (watch and earn in `#14F195`). Subtitle: "Create arenas. Deploy agents. Watch and tip. Built on Solana." Waitlist form with green submit button.
   - Right: Animated battle canvas (re-themed — Solana green/purple agent dots, green attack lines, green health bars on near-black). Kill feed overlay with `#14F195` text.
   - Background: Near-black with two glow orbs — green (`rgba(20,241,149,0.05)`) top-left, purple (`rgba(153,69,255,0.05)`) bottom-right.

3. **How It Works** — 3 cards (Agents enter, They compete, Winners take the prize). Step number badges use `rgba(20,241,149,0.15)` background with `#14F195` text. Glass cards with `rgba(20,241,149,0.08)` border on hover.

4. **Human vs AI Callout** (NEW) — Full-width section. Headline: "Think you can beat the algorithm?" Subtext explaining 1v1 human vs AI mode — sybil-resistant by design, same rules, same leaderboard. Visual: animated VS card (human emoji vs robot emoji) using the battle card component from theme showcase. Two CTAs: "Play as Human" → `#waitlist` (green solid), "Deploy an Agent" → `/developers` (purple outline).

5. **Bottom CTA** — Centered. "The reason agents compete." Waitlist form repeat.

6. **Footer** — Logo, nav links, social links, "Built on Solana".

### 2. `/arena`

**Purpose:** Show what the spectator/player experience looks like.

**Sections:**

1. **Navbar** (shared)

2. **Live Arena Mockup** — Enhanced version of current `ArenaMockup` component. Re-themed with Arena Neon colors. Leaderboard rows use `rgba(20,241,149,0.04)` bg, `#14F195` for ranks and scores. Danger zone uses `#ff5555`. Gold/silver/bronze rank colors kept for top 3.

3. **Spectator Experience** (NEW) — Split layout. Left: chat mockup with avatars (green→purple gradient bg), chat bubbles (`rgba(20,241,149,0.06)` bg), usernames in `#14F195`. Right: tipping widget — agent avatar, tip amount buttons (0.1 / 0.5 / 1.0 / 5.0 SOL), green CTA "Send Tip". Headline: "Watch. Chat. Tip." Subtext: "Spectators aren't passive — tip your favorite agents, chat with other watchers, and react to eliminations in real-time."

4. **Features Grid** — 6 feature cards re-themed. Icon + title + description. Glass cards with green border glow on hover.

5. **Footer** (shared)

### 3. `/creators`

**Purpose:** Sell creators on building arenas and earning fees.

**Sections:**

1. **Navbar** (shared)

2. **Create Arena in 10 Lines** — Current SDK code section, re-themed. Code block: keywords in `#9945FF`, strings in `#14F195`, numbers in `#14F195`, comments in `#55556a`. Window chrome dots: red/yellow/green kept. Filename tab text in `#55556a`. Left side: headline + "Without RitArena: 2,000+ lines. With RitArena: 10 lines, 5 minutes." comparison.

3. **Creators Earn** — Fee breakdown (0-20% creator fee, 1% protocol, $50/arena example). Large stat values in gradient text. Flow diagram: "50 agents join → 1,000 USDC entry → $50 to creator → $940 to winners → $10 to protocol". Creator fee in `#14F195`, winner payout in `#14F195`.

4. **Data Flywheel** (NEW) — Headline: "The competition is the product. The data is the moat."
   - **Layout:** Horizontal 4-step flow using CSS flexbox with connecting arrows. Each step is a glass card with an icon, title, and one-line description. Steps: (1) "Arena Runs" → (2) "Actions Logged" (state, action, reward, next_state in RL format) → (3) "Verified On-Chain" (Merkle roots, $0.003/arena) → (4) "Training Data API" (revenue stream).
   - **Mobile:** Stack vertically with downward arrows.
   - Below the flow: 3 stat glass cards in a row: "Every arena = training dataset", "Human vs AI = premium comparative data", "$0.003 per arena verification cost".

5. **Footer** (shared)

### 4. `/developers`

**Purpose:** Show agent developers how to connect their agents.

**Sections:**

1. **Navbar** (shared)

2. **Connect Your Agent** — Current agent SDK code section, re-themed. Code block with same syntax colors as creator page. Right side: explanation + checklist (Trading bots, AI models, Game AI, Play manually as human). Checkmarks in `#14F195`.

3. **Agent Registration Preview** — Mockup of the registration form from theme showcase. Input fields with `rgba(20,241,149,0.04)` bg, `#14F195` focus border. Entry fee display in green. "Register & Deposit" green CTA. Shows how simple it is to enter an arena.

4. **Footer** (shared)

### 5. `/about`

**Purpose:** Team credibility.

**Sections:**

1. **Navbar** (shared)

2. **Built By** — Team cards re-themed. Name in `#f0f0f0`, role in `#14F195`. Glass cards with description.

3. **Footer** (shared)

## Component Changes

### Shared Components (all pages)

| Component | Changes |
|-----------|---------|
| `Navbar` | Add page links (Home, Arena, Creators, Developers, About). CTA button: `background: #14F195; color: #050508`. Active page link highlighted in `#14F195`. Use `usePathname()` from `next/navigation` for active state. Remove `<Navbar />` from `page.tsx` — it now renders only in `layout.tsx`. |
| `Footer` | Extract from inline JSX in current `page.tsx` (lines 578-605) into new `Footer.tsx` component. Re-theme: logo gradient green→purple, links in `#55556a`, hover `#f0f0f0`. Import `SOCIAL_LINKS` and new `NAV_LINKS` from constants. Render in `layout.tsx` only. |
| `AnimatedSection` | Remove `once: true` from `viewport` config so animations replay on page navigation (fixes stale animations when navigating back). |

### Page-Specific Components

| Component | Page | Changes |
|-----------|------|---------|
| `ArenaCanvas` | Home | Agent colors: cycle through `#14F195`, `#9945FF`, `#00CED1`, `#ff5555`, etc. Attack lines in agent's color. Health bars: green/yellow/red kept. Kill feed text in `#14F195`. Live badge bg same, dot color `#14F195`. Grid lines kept subtle. |
| `WaitlistForm` | Home | Input: bg `rgba(20,241,149,0.04)`, border `rgba(20,241,149,0.12)`, focus border `#14F195`. Button: bg `#14F195`, text `#050508`. Success state: green border/text kept (already green). |
| `ArenaMockup` | Arena | Color constants: green → `#14F195`, red → `#ff5555`, gold → `#FFC53D` kept. Bar fills: positive `#14F195`, negative `#ff5555`. Type badges use surface bg. |
| `CodeBlock` | Creators | Keywords: `#9945FF`. Strings: `#14F195`. Numbers: `#14F195`. Comments: `#55556a`. |
| `HeroBackground` | Home | Glow orbs: green `rgba(20,241,149,0.05)` and purple `rgba(153,69,255,0.05)`. **Important:** Remove the inline glow orbs from `page.tsx` (lines 20-27) and use `<HeroBackground />` component instead — currently the page inlines them and the component is unused. |
| `LiveTicker` | Removed | Stats bar with fake numbers cut entirely. |

### New Components

| Component | Page | Description |
|-----------|------|-------------|
| `HumanVsAI` | Home | Full-width section with animated VS card (human vs robot). Two CTA buttons. |
| `SpectatorExperience` | Arena | Split layout — chat mockup left, tipping widget right. |
| `DataFlywheel` | Creators | Diagram/flow showing arena → RL data → Merkle verification → Training Data API. |
| `AgentRegistration` | Developers | Static visual mockup (non-functional) — fields: Agent Name (text input), Strategy Endpoint (URL input), Arena Type (dropdown: Battle 1v1 / Battle Royale / Speed Trial / Custom), Entry Fee display (shows "5.0 SOL"). Green "Register & Deposit" CTA (disabled state, no click handler). Shows the UX, not wired to any backend. |
| `SpectatorExperience` | Arena | Mock data needed in `constants.ts`: 3 chat messages (username + text), tip amounts [0.1, 0.5, 1.0, 5.0], target agent name. "Send Tip" button shows disabled tooltip "Connect wallet to tip" on hover. |

## CSS Changes (`globals.css`)

```css
body {
  background: #0a0a0f;
  color: #f0f0f0;
  font-family: 'Exo 2', system-ui, sans-serif;
}

::selection {
  background: rgba(20, 241, 149, 0.3);
  color: white;
}

::-webkit-scrollbar-track { background: #0a0a0f; }
::-webkit-scrollbar-thumb { background: #222; }

.gradient-text {
  background: linear-gradient(135deg, #14F195, #9945FF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.glass-card {
  background: rgba(13, 13, 24, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(20, 241, 149, 0.08);
  border-radius: 16px;
}

.glass-card:hover {
  border-color: rgba(20, 241, 149, 0.15);
}
```

## Layout Changes (`layout.tsx`)

Replace `Space_Grotesk` and `JetBrains_Mono` with Arena Neon font stack:
- Orbitron (display)
- Chakra Petch (UI)
- Exo 2 (body)
- Share Tech Mono (data)
- Space Mono (scores)

Set CSS variables for each font family.

## File Structure

```
src/
  app/
    layout.tsx          — updated fonts, shared navbar/footer
    page.tsx            — Home (hero + how it works + human vs ai + bottom cta)
    globals.css         — Arena Neon theme
    arena/
      page.tsx          — Arena mockup + spectator experience + features
    creators/
      page.tsx          — SDK code + creator earnings + data flywheel
    developers/
      page.tsx          — Agent SDK + agent registration preview
    about/
      page.tsx          — Team section
  components/
    Navbar.tsx          — updated with page links
    Footer.tsx          — new shared footer component
    AnimatedSection.tsx — unchanged
    ArenaCanvas.tsx     — re-themed colors
    ArenaMockup.tsx     — re-themed colors
    WaitlistForm.tsx    — re-themed colors
    CodeBlock.tsx       — re-themed syntax colors
    HeroBackground.tsx  — re-themed glow orbs
    HumanVsAI.tsx       — NEW
    SpectatorExperience.tsx — NEW
    DataFlywheel.tsx    — NEW
    AgentRegistration.tsx — NEW
  lib/
    constants.ts        — updated colors, removed LIVE_STATS, new NAV_LINKS (page routes), MOCK_CHAT, MOCK_TIP_AGENT
```

## Color Migration Checklist

All hardcoded old colors must be replaced across every component file:

| Old Value | New Value | Files Affected |
|-----------|-----------|---------------|
| `#08080C` | `#0a0a0f` | `globals.css`, `page.tsx`, `HeroBackground.tsx`, `ArenaCanvas.tsx`, `ArenaMockup.tsx` |
| `#8888A0` | `#888888` | `page.tsx` (10+ refs), `Navbar.tsx`, `ArenaMockup.tsx`, `LiveTicker.tsx` |
| `#FF6B2C` | `#14F195` | `page.tsx`, `Navbar.tsx`, `WaitlistForm.tsx`, `ArenaCanvas.tsx` (COLORS array) |
| `#8B5CF6` | `#9945FF` | `page.tsx`, `CodeBlock.tsx`, agent SDK block, `ArenaCanvas.tsx` (COLORS array) |
| `rgba(255,107,44,*)` | `rgba(20,241,149,*)` | `page.tsx` (glow orbs, step badges), `HeroBackground.tsx` |
| `rgba(139,92,246,*)` | `rgba(153,69,255,*)` | `page.tsx` (glow orbs), `HeroBackground.tsx` |
| `color: "white"` on CTA buttons | `color: "#050508"` | `WaitlistForm.tsx` button, `Navbar.tsx` CTA |

## Known Gaps (Deferred)

- **Mobile hamburger menu** — nav links hidden on mobile with no replacement. Acceptable for hackathon desktop demos.
- **Page transition animation** — no loading state between page navigations. Could add simple opacity fade later.
- **WaitlistForm persistence** — localStorage only, submissions lost on clear. Backend integration deferred.

## Out of Scope

- Backend/API integration (waitlist stays localStorage)
- Real-time data from on-chain
- Mobile hamburger menu (can add later)
- OG image generation
- Analytics/tracking
