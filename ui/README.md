# @ritarena/ui

Themeable React components for RitArena game arena UIs.

## Install

```bash
npm install @ritarena/ui
```

## Usage

```tsx
import { Leaderboard, PrizePool, EventFeed } from '@ritarena/ui'
import '@ritarena/ui/styles.css'  // default dark theme (optional)

<Leaderboard players={[
  { id: 'a', name: 'ALPHA', score: 42, alive: true, rank: 1, color: '#14F195' },
]} />
```

## Theming

Override CSS variables:

```css
:root {
  --ritarena-accent: #FFC53D;
  --ritarena-bg: #1a0a0a;
}
```

Or pass a theme prop:

```tsx
<Leaderboard players={data} theme={{ accent: '#FFC53D' }} />
```

## Components

| Component | Description |
|---|---|
| `<Leaderboard>` | Ranked player list with scores |
| `<PrizePool>` | Prize amount + fee breakdown |
| `<EventFeed>` | Auto-scrolling event log |
| `<AgentCard>` | Per-agent identity card |
| `<MatchResult>` | Winner + Explorer txn link |
| `<PhaseTimer>` | Countdown bar |
| `<GodPowerBar>` | Spectator power buttons |
| `<EliminationEffect>` | Overlay animation |

## Import Paths

```tsx
import { Leaderboard } from '@ritarena/ui'         // display (you pass data)
import { Leaderboard } from '@ritarena/ui/live'     // auto-fetch by arenaId (coming soon)
import { useLeaderboard } from '@ritarena/ui/hooks' // raw typed hook (coming soon)
```

## License

MIT
