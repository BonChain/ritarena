# Landing-v2 Arena Neon Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-theme and restructure the RitArena landing page from a single-page orange theme to a 5-page Arena Neon (Solana green/purple) site with 3 new sections.

**Architecture:** Next.js App Router with shared layout (Navbar + Footer), 5 route pages, Tailwind CSS for utility classes, Framer Motion for animations. Theme colors defined as CSS custom properties in globals.css. Google Fonts loaded via next/font (Orbitron, Exo 2) and link preconnect (Chakra Petch, Share Tech Mono, Space Mono).

**Tech Stack:** Next.js 16.2.2, React 19.2.4, Tailwind CSS 4, Framer Motion 12, TypeScript

**Spec:** `docs/superpowers/specs/2026-04-09-landing-v2-arena-neon-redesign.md`

**Working directory:** `landing-v2/`

---

## Task 1: Theme Foundation — globals.css + layout.tsx

**Files:**
- Modify: `landing-v2/src/app/globals.css`
- Modify: `landing-v2/src/app/layout.tsx`

- [ ] **Step 1: Replace globals.css with Arena Neon theme**

Full replacement of file contents:

```css
@import "tailwindcss";

body {
  background: #0a0a0f;
  color: #f0f0f0;
  font-family: var(--font-body), system-ui, -apple-system, sans-serif;
  overflow-x: hidden;
}

::selection {
  background: rgba(20, 241, 149, 0.3);
  color: white;
}

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #0a0a0f; }
::-webkit-scrollbar-thumb { background: #222; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #444; }

.gradient-text {
  background: linear-gradient(135deg, #14F195, #9945FF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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

.grid-bg {
  background-image:
    linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 60px 60px;
}

.section-divider {
  border-top: 1px solid rgba(20, 241, 149, 0.06);
  border-bottom: 1px solid rgba(20, 241, 149, 0.06);
}
```

- [ ] **Step 2: Replace layout.tsx with Arena Neon fonts + shared Navbar/Footer**

Replace full file. Key changes:
- Import Orbitron + Exo_2 from `next/font/google` with CSS variables `--font-display` and `--font-body`
- Add `<link>` tags in `<head>` for Chakra Petch, Share Tech Mono, Space Mono via Google Fonts preconnect
- Define CSS variables `--font-ui`, `--font-data`, `--font-score` in a `<style>` tag in head
- Import and render `<Navbar />` and `<Footer />` in the body wrapping `{children}`
- Remove old Space_Grotesk and JetBrains_Mono imports

Note: The `<style>` tag in head uses static string content only (CSS variable definitions for externally-loaded fonts). This is safe — no user input is involved.

- [ ] **Step 3: Verify app state**

Run: `cd landing-v2 && npm run build`
Expected: Build may fail because Footer.tsx doesn't exist yet — that's expected, created in Task 2.

- [ ] **Step 4: Commit**

```bash
git add landing-v2/src/app/globals.css landing-v2/src/app/layout.tsx
git commit -m "feat: Arena Neon theme foundation — globals.css + layout.tsx fonts"
```

---

## Task 2: Shared Components — Navbar + Footer + Constants

**Files:**
- Modify: `landing-v2/src/components/Navbar.tsx`
- Create: `landing-v2/src/components/Footer.tsx`
- Modify: `landing-v2/src/lib/constants.ts`

- [ ] **Step 1: Update constants.ts**

Full replacement. Key changes:
- Replace `NAV_LINKS` from anchor hashes (`#how-it-works`, `#features`, `#builders`) to page routes (`/`, `/arena`, `/creators`, `/developers`, `/about`)
- Remove `LIVE_STATS` and `WAITLIST_BASE_COUNT`
- Add `MOCK_CHAT` — array of 3 objects: `{ username, avatar, text }`
- Add `MOCK_TIP_AGENT` — object: `{ name: "NeuralHunter", emoji: "🤖", rank: 1, arena: "Neural Warfare", totalTips: 89.4, tipCount: 347, amounts: [0.1, 0.5, 1.0, 5.0] }`
- Add `FLYWHEEL_STEPS` — array of 4 objects: `{ icon, title, desc }` for the data flywheel flow
- Keep `MOCK_ARENA`, `FEATURES`, `CODE_EXAMPLE`, `SOCIAL_LINKS` with no changes

- [ ] **Step 2: Rewrite Navbar.tsx**

Key changes:
- Import `usePathname` from `next/navigation` and `Link` from `next/link`
- Replace `<a>` tags with `<Link>` components for internal navigation
- Import `NAV_LINKS` (now page routes, not anchor hashes)
- Active state: compare `pathname === link.href`, highlight with `color: "#14F195"` and `fontWeight: 700`
- CTA button: `background: "#14F195"`, `color: "#050508"`
- Scrolled nav background: `rgba(10, 10, 15, 0.92)`, border: `rgba(20, 241, 149, 0.08)`
- Font family: `var(--font-ui)` for all nav text

- [ ] **Step 3: Create Footer.tsx**

Server component (no "use client"). Imports `Link` from `next/link`, `NAV_LINKS` and `SOCIAL_LINKS` from constants. Layout: flex row with logo, nav links, social links, "Built on Solana". Colors: links in `#55556a`, hover white. Top border: `rgba(20, 241, 149, 0.06)`.

- [ ] **Step 4: Verify build**

Run: `cd landing-v2 && npm run build`
Expected: Build may show warnings about page.tsx still importing old Navbar — fixed in Task 5.

- [ ] **Step 5: Commit**

```bash
git add landing-v2/src/components/Navbar.tsx landing-v2/src/components/Footer.tsx landing-v2/src/lib/constants.ts
git commit -m "feat: shared Navbar with page routing + Footer component + updated constants"
```

---

## Task 3: Re-theme Existing Components

**Files:**
- Modify: `landing-v2/src/components/AnimatedSection.tsx`
- Modify: `landing-v2/src/components/WaitlistForm.tsx`
- Modify: `landing-v2/src/components/HeroBackground.tsx`
- Modify: `landing-v2/src/components/ArenaCanvas.tsx`
- Modify: `landing-v2/src/components/ArenaMockup.tsx`
- Modify: `landing-v2/src/components/CodeBlock.tsx`

- [ ] **Step 1: AnimatedSection — remove once: true**

In `AnimatedSection.tsx` line 19, change `viewport={{ once: true, margin: "-80px" }}` to `viewport={{ margin: "-80px" }}`. This fixes stale animations when navigating between pages.

- [ ] **Step 2: WaitlistForm.tsx color swaps**

| Line | Old | New |
|------|-----|-----|
| 31 | `background: "rgba(0, 255, 136, 0.08)"` | `background: "rgba(20, 241, 149, 0.08)"` |
| 31 | `border: "1px solid rgba(0, 255, 136, 0.2)"` | `border: "1px solid rgba(20, 241, 149, 0.2)"` |
| 32-33 | `color: "#00FF88"` (2 places) | `color: "#14F195"` |
| 49 | `background: "#111118"` | `background: "rgba(20,241,149,0.04)"` |
| 49 | `border: "1px solid rgba(255,255,255,0.1)"` | `border: "1px solid rgba(20,241,149,0.12)"` |
| 49 | `color: "#F5F5F7"` | `color: "#f0f0f0"` |
| 54 | `background: "#FF6B2C"` | `background: "#14F195"` |
| 54 | `color: "white"` | `color: "#050508"` |

- [ ] **Step 3: HeroBackground.tsx color swaps**

| Line | Old | New |
|------|-----|-----|
| 13 | `#08080C` | `#0a0a0f` |
| 18 | `rgba(255, 107, 44, 0.06)` | `rgba(20, 241, 149, 0.05)` |
| 22 | `rgba(139, 92, 246, 0.06)` | `rgba(153, 69, 255, 0.05)` |
| 27 | `#08080C` | `#0a0a0f` |

- [ ] **Step 4: ArenaCanvas.tsx color swaps**

Replace COLORS array (lines 27-31) with: `["#14F195", "#9945FF", "#00CED1", "#ff5555", "#FFC53D", "#FF69B4", "#7FFF00", "#00CED1", "#40E0D0", "#FF4500", "#DA70D6", "#14F195", "#9945FF", "#6495ED", "#32CD32"]`

Replace canvas bg (line 228): `rgba(8,8,12,0.8)` → `rgba(10,10,15,0.8)`

Replace kill feed first entry color (line 238): `#FF3355` → `#ff5555`

Replace live badge dot color (line 251): `#FF3355` → `#14F195`

- [ ] **Step 5: ArenaMockup.tsx — replace color constants**

Replace the `C` object (lines 6-14):
```ts
const C = {
  border: "rgba(20,241,149,0.08)",
  bg: "#0a0a0f",
  dim: "#888888",
  muted: "#55556a",
  green: "#14F195",
  red: "#ff5555",
  gold: "#FFC53D",
};
```

Also replace `font-[family-name:var(--font-mono)]` on line 46 with `font-[family-name:var(--font-data)]`.

Remove the `max-w-2xl mx-auto mt-16` from the outer wrapper (line 61) — this will be controlled by the page wrapper instead. Replace with `max-w-2xl mx-auto`.

- [ ] **Step 6: CodeBlock.tsx syntax color swaps**

| Usage | Old | New |
|-------|-----|-----|
| Keywords | `#8B5CF6` | `#9945FF` |
| Strings | `#00FF88` | `#14F195` |
| Numbers | `#FF6B2C` | `#14F195` |
| Comments | `#55556a` | `#55556a` (no change) |

Also replace `font-[family-name:var(--font-mono)]` with `font-[family-name:var(--font-data)]`.

Replace `border: "1px solid rgba(255,255,255,0.06)"` with `border: "1px solid rgba(20,241,149,0.08)"`.

- [ ] **Step 7: Commit**

```bash
git add landing-v2/src/components/AnimatedSection.tsx landing-v2/src/components/WaitlistForm.tsx landing-v2/src/components/HeroBackground.tsx landing-v2/src/components/ArenaCanvas.tsx landing-v2/src/components/ArenaMockup.tsx landing-v2/src/components/CodeBlock.tsx
git commit -m "feat: re-theme all existing components to Arena Neon colors"
```

---

## Task 4: New Components — HumanVsAI, SpectatorExperience, DataFlywheel, AgentRegistration

**Files:**
- Create: `landing-v2/src/components/HumanVsAI.tsx`
- Create: `landing-v2/src/components/SpectatorExperience.tsx`
- Create: `landing-v2/src/components/DataFlywheel.tsx`
- Create: `landing-v2/src/components/AgentRegistration.tsx`

- [ ] **Step 1: Create HumanVsAI.tsx**

Client component ("use client") — uses Framer Motion for VS pulse animation. Imports AnimatedSection and Link.

Layout: section with `py-20 px-6`, max-w-5xl centered. Centered headline "Think you can beat the algorithm?" in Orbitron. Glass card with 3-column flex: Human avatar (👤, green border) | animated VS text (gradient, pulsing scale 1→1.15) | AI avatar (🤖, gradient border). Two CTA buttons below: "Play as Human" → `#waitlist` (green solid, `#14F195` bg, `#050508` text) and "Deploy an Agent" → `/developers` (purple outline, `rgba(153,69,255,0.3)` border, `#9945FF` text).

- [ ] **Step 2: Create SpectatorExperience.tsx**

Client component. Imports AnimatedSection, MOCK_CHAT, MOCK_TIP_AGENT from constants.

Layout: section `py-20 px-6`, 2-column grid. Left: chat card with 3 mock messages (avatar circle with gradient bg, chat bubble with `rgba(20,241,149,0.06)` bg, username in `#14F195`), disabled input + send button at bottom. Right: tipping card with agent avatar (gradient bg), name, rank, 4 tip amount buttons (0.1/0.5/1.0/5.0, the 0.5 is "active" with gradient bg), tip total stats, disabled "Send 0.5 SOL Tip" green CTA with `title="Connect wallet to tip"`.

- [ ] **Step 3: Create DataFlywheel.tsx**

Server component. Imports AnimatedSection, FLYWHEEL_STEPS from constants.

Layout: section `py-20 px-6`. Headline: "The competition is the product. / The data is the moat." (second line in gradient-text). Horizontal flex of 4 glass cards (icon + title in `#14F195` + desc), with `→` arrows between them on desktop and `↓` on mobile. Below: 3-column grid of stat glass cards.

- [ ] **Step 4: Create AgentRegistration.tsx**

Server component. Imports AnimatedSection.

Layout: section `py-20 px-6`, 2-column grid. Left: headline "Register in seconds" + explanation + 3 checkmarks. Right: glass card form mockup with 4 fields (Agent Name input, Strategy Endpoint input, Arena Type static div showing "Battle (1v1)", Entry Fee row showing "5.0 SOL"), all disabled inputs with Arena Neon styling. Green "Register & Deposit →" button, disabled.

- [ ] **Step 5: Commit**

```bash
git add landing-v2/src/components/HumanVsAI.tsx landing-v2/src/components/SpectatorExperience.tsx landing-v2/src/components/DataFlywheel.tsx landing-v2/src/components/AgentRegistration.tsx
git commit -m "feat: add HumanVsAI, SpectatorExperience, DataFlywheel, AgentRegistration components"
```

---

## Task 5: Home Page — Restructure page.tsx

**Files:**
- Modify: `landing-v2/src/app/page.tsx`

- [ ] **Step 1: Rewrite page.tsx as Home page only**

Full rewrite. Key changes:
- Remove `<Navbar />` import and usage (now rendered in layout.tsx)
- Remove footer inline JSX (now rendered via Footer in layout.tsx)
- Remove "Pick Your Role" section entirely
- Remove "Stats Bar" section entirely
- Remove "Live Arena Mockup" section (moved to /arena)
- Remove "For Builders: Arena creation code" section (moved to /creators)
- Remove "Agent-side SDK" section (moved to /developers)
- Remove "Creators Earn" section (moved to /creators)
- Remove "Features" section (moved to /arena)
- Remove "Built By" section (moved to /about)
- Replace inline glow orbs (lines 20-27) with `<HeroBackground />` component
- Add `<HumanVsAI />` section between How It Works and Bottom CTA
- Replace all color references: `#FF6B2C` → `#14F195`, `#8B5CF6` → `#9945FF`, `#8888A0` → `#888888`, `#08080C` → `#0a0a0f`, `#F5F5F7` → `#f0f0f0`
- Replace all font references: `font-bold` → `style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}`
- Replace `font-[family-name:var(--font-mono)]` → `font-[family-name:var(--font-data)]`

Final sections: Hero | How It Works | HumanVsAI | Bottom CTA

- [ ] **Step 2: Verify build**

Run: `cd landing-v2 && npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add landing-v2/src/app/page.tsx
git commit -m "feat: restructure Home page — Arena Neon theme, HumanVsAI section, removed stats bar"
```

---

## Task 6: Arena Page

**Files:**
- Create: `landing-v2/src/app/arena/page.tsx`

- [ ] **Step 1: Create arena/page.tsx**

Server component. Imports ArenaMockup, SpectatorExperience, AnimatedSection, FEATURES from constants.

Sections:
1. Live Arena — `pt-24 pb-20 px-6`, centered heading "This is what a live arena looks like", then `<ArenaMockup />`
2. `<SpectatorExperience />`
3. Features Grid — heading "What's under the hood", 3-column grid of FEATURES array mapped to glass cards with icon, title (font-ui), description

- [ ] **Step 2: Commit**

```bash
git add landing-v2/src/app/arena/page.tsx
git commit -m "feat: add Arena page — live mockup, spectator experience, features grid"
```

---

## Task 7: Creators Page

**Files:**
- Create: `landing-v2/src/app/creators/page.tsx`

- [ ] **Step 1: Create creators/page.tsx**

Server component. Imports CodeBlock, DataFlywheel, AnimatedSection.

Sections:
1. Create Arena in 10 Lines — `pt-24 pb-20 px-6`, 2-column grid. Left: headline + "Without/With RitArena" comparison (red `#ff5555` for without, green `#14F195` for with) + npm install code. Right: `<CodeBlock />`.
2. Creators Earn — 3-column stats (0-20%, 1%, $50) in gradient-text with Orbitron font. Flow diagram below: "50 agents join → 1,000 USDC entry → $50 to creator → $940 to winners → $10 to protocol" using font-data.
3. `<DataFlywheel />`

- [ ] **Step 2: Commit**

```bash
git add landing-v2/src/app/creators/page.tsx
git commit -m "feat: add Creators page — SDK code, earnings breakdown, data flywheel"
```

---

## Task 8: Developers Page

**Files:**
- Create: `landing-v2/src/app/developers/page.tsx`

- [ ] **Step 1: Create developers/page.tsx**

Server component. Imports AgentRegistration, AnimatedSection.

Sections:
1. Connect Your Agent — `pt-24 pb-20 px-6`, 2-column grid. Left: glass card with code editor chrome (red/yellow/green dots, "my-agent.ts" tab), `<pre>` code block showing agent SDK example with syntax colors: keywords `#9945FF`, strings `#14F195`, numbers `#14F195`, comments `#55556a`. Right: headline + explanation + 4-item checklist with `#14F195` checkmarks.
2. `<AgentRegistration />`

- [ ] **Step 2: Commit**

```bash
git add landing-v2/src/app/developers/page.tsx
git commit -m "feat: add Developers page — agent SDK + registration preview"
```

---

## Task 9: About Page

**Files:**
- Create: `landing-v2/src/app/about/page.tsx`

- [ ] **Step 1: Create about/page.tsx**

Server component. Imports AnimatedSection.

Single section: `pt-24 pb-20 px-6`, max-w-3xl centered. Heading "Built by", subtitle. 2-column grid of team glass cards: Tenny (Smart Contract Lead, with bio) and Team (4 developers, with bio). Names in font-ui bold, roles in `#14F195` font-ui semibold, descriptions in `#888888`.

- [ ] **Step 2: Commit**

```bash
git add landing-v2/src/app/about/page.tsx
git commit -m "feat: add About page — team section"
```

---

## Task 10: Delete Unused Files + Final Build Verification

**Files:**
- Delete: `landing-v2/src/components/LiveTicker.tsx`

- [ ] **Step 1: Delete LiveTicker**

```bash
rm landing-v2/src/components/LiveTicker.tsx
```

- [ ] **Step 2: Run full build**

Run: `cd landing-v2 && npm run build`
Expected: Build succeeds with no errors. All 5 pages compile: `/`, `/arena`, `/creators`, `/developers`, `/about`.

- [ ] **Step 3: Run dev server and manually verify all pages**

Run: `cd landing-v2 && npm run dev`

Checklist:
- `http://localhost:3000` — Home: hero canvas + how it works + human vs AI + bottom CTA
- `http://localhost:3000/arena` — Arena mockup + spectator chat/tipping + features grid
- `http://localhost:3000/creators` — SDK code + creator earnings + data flywheel
- `http://localhost:3000/developers` — Agent SDK code + registration form preview
- `http://localhost:3000/about` — Team cards
- Navbar: active page highlighted in `#14F195`, green CTA button
- No orange (`#FF6B2C`) or old purple (`#8B5CF6`) visible anywhere
- Fonts: Orbitron for headers, Exo 2 for body text, Chakra Petch for UI labels
- Glass cards have green border glow on hover

- [ ] **Step 4: Commit**

```bash
git add -A landing-v2/
git commit -m "feat: complete landing-v2 Arena Neon redesign — 5 pages, 3 new sections, theme swap"
```
