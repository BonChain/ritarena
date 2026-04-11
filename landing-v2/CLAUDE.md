@AGENTS.md

# RitArena Landing V2

## Project Overview

Landing site for **RitArena** — an AI agent competition platform on Solana. Built for the Colosseum Frontier Hackathon 2026 (deadline: May 11, 2026).

**One-liner**: "The platform where AI bots and humans fight each other for prize money."

## Tech Stack

- **Framework**: Next.js 16.2.2 (standalone output, App Router)
- **React**: 19.2.4
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/postcss`)
- **Animation**: Framer Motion 12.38
- **Icons**: Lucide React + inline SVGs
- **Fonts**: DM Sans (display), Exo 2 (body), Chakra Petch (UI), Share Tech Mono (data/mono)
- **TypeScript**: 5.x with strict mode
- **Path alias**: `@/*` → `./src/*`

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

## Architecture

### Pages (src/app/)

| Route | Purpose | Key Sections |
|---|---|---|
| `/` | Homepage | Hero, Problem (800 teams stat), Solution (10 lines SDK), Portal Cards (Creators/Developers/Players), Countdown (Apr 20), Traction Strip |
| `/arena` | Play page | How to play, Live preview (ArenaCanvas + ArenaMockup), HumanVsAI, SpectatorExperience |
| `/creators` | Creator page | SDK code example, Creator earnings math (50 agents × 20 USDC × 5% = $50), DataFlywheel |
| `/developers` | Developer page | Agent integration code, AgentRegistration form, supported types (trading bots, AI models, game AI) |
| `/about` | About page | Origin story, Roadmap (6 phases through Q4 2026), Team (Tenny + 4 engineers) |

### Components (src/components/)

| Component | Type | Used On | Purpose |
|---|---|---|---|
| `Navbar` | Client | All (layout) | Fixed nav with scroll detection, links from `NAV_LINKS` |
| `NavTicker` | Client | All (layout) | Kill feed ticker from ArenaCanvas events |
| `Footer` | Server | All (layout) | Logo, nav links, socials (X, Telegram) |
| `HeroBackground` | Client | Home | Bottom fade gradient |
| `WaitlistForm` | Client | Home, Arena, Developers | Email signup with localStorage, props: `id`, `ctaText` |
| `AnimatedSection` | Client | All pages | Fade-in + slide-up on viewport, props: `className`, `delay` |
| `ArenaCanvas` | Client | Home, Arena | Canvas-based battle sim with 15 agents, kill feed, health bars |
| `CountdownTimer` | Client | Home | Countdown to Apr 20, 2026 12:00 UTC |
| `CodeBlock` | Client | Home, Creators | SDK code example (battle royale in 10 lines) |
| `ArenaMockup` | Client | Arena | Leaderboard mockup (GRID WARS #7) |
| `HumanVsAI` | Client | Arena | Human vs AI comparison (34% vs 66% win rate) |
| `SpectatorExperience` | Client | Arena | Chat + tip agent panels |
| `DataFlywheel` | Client | Creators | 4-step pipeline: Arena → Logged → Verified → Training Data API |
| `AgentRegistration` | Client | Developers | Agent signup form (demo, inputs disabled) |

### Data (src/lib/)

| File | Contents |
|---|---|
| `constants.ts` | NAV_LINKS, SOCIAL_LINKS, MOCK_ARENA, FEATURES, CODE_EXAMPLE, MOCK_CHAT, MOCK_TIP_AGENT, FLYWHEEL_STEPS |
| `kill-events.ts` | Simple event emitter for kill messages (ArenaCanvas → NavTicker) |

## Design System

### Colors

| Token | Hex | Usage |
|---|---|---|
| Background | `#0a0a0f` | Page background |
| Text | `#f0f0f0` | Primary text |
| Green (primary) | `#14F195` | CTAs, positive, Solana green |
| Purple (secondary) | `#9945FF` | Accents, Solana purple |
| Muted | `#888888` | Secondary text |
| Dim | `#55556a` | Labels, tertiary text |
| Silver | `#c0c0c0` | 2nd place |
| Bronze | `#cd7f32` | 3rd place |
| Gold | `#FFC53D` | 1st place |

### CSS Classes (globals.css)

- `.gradient-text` — Green-to-purple gradient text
- `.glass-card` — Glassmorphic card with blur, border, hover effects
- `.cta-shimmer` — CTA button with shimmer sweep animation
- `.arena-grid-bg` / `.arena-grid-dots` / `.arena-noise` — Background overlays
- `.ticker-enter` / `.ticker-exit` — Kill feed animations

### Font Variables

- `--font-display`: DM Sans (headings)
- `--font-body`: Exo 2 (body text)
- `--font-ui`: Chakra Petch (UI elements, buttons)
- `--font-data`: Share Tech Mono (stats, labels, monospace)
- `--font-score`: Same as display (scores, numbers)

## Key Product Details (keep consistent)

- **Fee structure**: 1% protocol fee + 0-20% creator fee + remainder to prize pool
- **SDK package**: `@ritarena/sdk` (also `@ritarena/ui` for React components)
- **Entry fee example**: 5 USDC (CodeBlock) or 20 USDC (creators page math)
- **Max agents per arena**: 50
- **Elimination**: Bottom 20% per round
- **First arena date**: April 20, 2026
- **Team**: Tenny (founder) + 4 engineers
- **Tenny's background**: Enterprise systems ($1B+ orgs) → Solana → Pactda (3rd Sui Overflow 2025) → Mushin (Solana Thailand) → RitArena
- **Socials**: X @ritarenaxyz, Telegram t.me/+3mDMwbLEnK8zZjA1, Tenny @tenny2201

## Important Notes

- **AGENTS.md warning**: Next.js 16 has breaking changes from training data. Always check `node_modules/next/dist/docs/` before writing Next.js-specific code.
- **Human vs AI is a core differentiator** — humans and AI agents compete in the same arenas, same rules, same leaderboard. Never treat it as a minor feature.
- **Training Data API is the real revenue story** — protocol fee (1%) alone won't reach $1M ARR. The data flywheel (competition → RL logs → sell to ML teams) is the moat.
- **No jargon in hero copy** — always lead with plain English. "AI bots and humans fight for prize money" not "permissionless agent competition infrastructure."
- **Positioning**: "Roblox for AI agents" — use this analogy with judges and VCs.
- **Competitors**: The Arena (human PvP only, no agents), Forge AI (no real stakes), Moltiverse (400+ standalone games, no shared infrastructure).
