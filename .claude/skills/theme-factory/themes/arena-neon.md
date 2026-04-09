# Arena Neon

A Solana-native gaming theme with high-energy neon accents on deep black, designed for competitive AI agent arenas.

## Color Palette

- **Solana Green**: `#14F195` - Primary accent, CTAs, active states, rankings
- **Solana Purple**: `#9945FF` - Secondary accent, tags, hover states, decorative elements
- **Near Black**: `#0a0a0f` - Primary background
- **Card Dark**: `#0d0d18` - Card/surface background
- **Light Text**: `#f0f0f0` - Primary text
- **Muted Text**: `#888888` - Secondary/meta text
- **Danger Red**: `#ff5555` - Live indicators, eliminations, errors
- **Gradient Primary**: `linear-gradient(135deg, #14F195, #9945FF)` - Hero elements, VS icon, battle timer, progress bars ONLY

## Typography

- **Headers / Display**: Orbitron (900, 700, 600)
- **UI Labels / Names**: Chakra Petch (700, 600)
- **Section Labels**: Rajdhani (600)
- **Monospace / Data**: Share Tech Mono
- **Scores / Numbers**: Space Mono (700)
- **Body Text**: Exo 2 (300, 400, 600, 700)

## Gradient Usage Rules (Client Focus Group Feedback)

**DO use gradient on:**
- Hero elements (page title, section headers)
- CTA buttons (primary actions)
- VS icon in battle cards
- Battle timer
- Progress bar fills
- Stat values (large display numbers)

**DO NOT use gradient on:**
- Data-dense components (leaderboard rows, bracket matches, stats tables)
- Small text or labels
- Backgrounds or large surface areas
- Multiple elements in close proximity (visual noise)

**Rule:** Use gradient as a surgical accent, not wallpaper. Data layers stay on solid near-black with single-color (#14F195 or #9945FF) accents.

## Contrast & Accessibility

- All small text (< 14px) must use `#f0f0f0` on `#0a0a0f` or `#0d0d18` — passes WCAG AAA
- Muted text (`#888888`) only on backgrounds darker than `#0d0d18` — passes WCAG AA for large text
- Never use `#14F195` or `#9945FF` as text on light backgrounds
- Monospace data (scores, addresses, timestamps) always in `#f0f0f0` or `#14F195`

## Component Color Map

| Component | Background | Primary Accent | Secondary Accent |
|-----------|-----------|---------------|-----------------|
| Leaderboard rows | `rgba(20,241,149,0.04)` | `#14F195` (rank, score) | — |
| Top-ranked row | `rgba(20,241,149,0.1)` + inset glow | `#14F195` | — |
| Battle card fighters | `rgba(20,241,149,0.05)` | `#f0f0f0` (name) | `#9945FF` (type) |
| Fighter avatars | green→purple gradient bg | — | — |
| VS icon | — | gradient text | — |
| Battle timer | — | gradient text | — |
| Battle status badge | green→purple gradient bg | `#14F195` text | border `rgba(20,241,149,0.2)` |
| Event dots | `#14F195` + glow | alternate: `#9945FF` + glow | — |
| Creator avatar | green→purple gradient bg | border `rgba(20,241,149,0.2)` | — |
| Earnings card | green→purple gradient bg | gradient text (amount) | — |
| Lobby items | `rgba(20,241,149,0.04)` | `#14F195` (player count) | — |
| Lobby tags | `rgba(20,241,149,0.08)` | `#14F195` | purple variant: `#9945FF` |
| Live tags | `rgba(255,60,60,0.12)` | `#ff5555` | — |
| Kill feed killer | — | `#14F195` | — |
| Kill feed divider | green→purple gradient | — | — |
| Form inputs | `rgba(20,241,149,0.04)` | border focus: `#14F195` | — |
| Fee display | green→purple gradient bg | `#14F195` text | — |
| Chat avatars | green→purple gradient bg | `#14F195` | — |
| Chat bubbles | `rgba(20,241,149,0.06)` | `#14F195` (username) | — |
| Tip buttons | transparent | border `rgba(20,241,149,0.2)`, `#14F195` text | active: gradient bg |
| Bracket matches | `rgba(20,241,149,0.04)` | `#14F195` (winner) | — |
| Stat boxes | `rgba(20,241,149,0.04)` | gradient text (value) | — |
| CTA primary | green gradient solid | `#050508` text | shadow `rgba(20,241,149,0.3)` |
| CTA secondary | `rgba(20,241,149,0.12)` | `#14F195` text | — |
| CTA outline | transparent | border `rgba(153,69,255,0.25)`, `#9945FF` text | — |

## Best Used For

AI agent gaming platforms, Solana-native applications, competitive esports interfaces, hackathon demo projects targeting Solana ecosystem judges.
