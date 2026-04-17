/**
 * A single player's state in the arena.
 * Passed to `<Leaderboard>`, used by `<AgentCard>` indirectly.
 */
export interface Player {
  /** Unique identifier (wallet address, bot ID, etc.) */
  id: string;
  /** Display name (up to 32 chars recommended) */
  name: string;
  /** Current score — can be negative */
  score: number;
  /** `true` if still in the game, `false` if eliminated */
  alive: boolean;
  /** Current rank (1 = leader). Stable sort uses `id` as tiebreak. */
  rank: number;
  /** Optional hex color for agent indicator dot */
  color?: string;
  /** Optional avatar character/emoji (falls back to first letter of name) */
  avatar?: string;
}

/**
 * A single event in the game event feed.
 * Types drive the color of the message in `<EventFeed>`.
 */
export interface GameEvent {
  /** Human-readable message — keep under ~60 chars for best rendering */
  message: string;
  /** Event category — drives color. `hype` = accent, `elimination` = danger, `score` = normal, `system` = muted */
  type: "hype" | "elimination" | "score" | "system";
  /** Unix timestamp (ms) — used as React key; must be unique per event */
  timestamp: number;
}

/**
 * A spectator "god power" — a paid action that affects the match.
 * @example
 * { id: "bomb", label: "Bomb Tile", icon: "💣", cooldown: 0, cost: 0.1 }
 */
export interface GodPower {
  /** Unique identifier passed to `onUse(powerId)` callback */
  id: string;
  /** Button label (shown below icon) */
  label: string;
  /** Icon — emoji or text. Rendered with `aria-hidden` */
  icon: string;
  /** Seconds remaining on cooldown. 0 = ready to use */
  cooldown: number;
  /** Cost per use (displayed in `currency` when off cooldown) */
  cost: number;
}

/**
 * Winner info for `<MatchResult>`.
 */
export interface MatchWinner {
  /** Winner's display name */
  name: string;
  /** Prize amount in base units (6 decimals for USDC). E.g. 24_000_000 = 24 USDC */
  prize: number;
}

/**
 * Theme overrides. Any field set becomes a CSS variable on the component's root.
 * Omit fields to inherit from CSS defaults or parent variables.
 * @example
 * <Leaderboard players={data} theme={{ accent: '#FFC53D', bg: '#1a0a0a' }} />
 */
export interface RitArenaTheme {
  /** Primary highlight color (scores, winners, progress). Default `#888888` */
  accent?: string;
  /** Optional glow behind accent elements. Default `transparent` */
  accentGlow?: string;
  /** Elimination / urgent / error color. Default `#ff5555` */
  danger?: string;
  /** Page/backdrop background. Default `#0d0d14` */
  bg?: string;
  /** Component card background. Default `#12121c` */
  bgCard?: string;
  /** Primary text color. Default `#e0e0e0` */
  text?: string;
  /** Muted text (labels, tertiary). Default `#666666` */
  textMuted?: string;
  /** Border / divider color. Default `#1a1a2a` */
  border?: string;
  /** Card shadow. Default includes border ring. Set to `none` to disable depth. */
  shadowCard?: string;
  /** Stronger shadow for elevated cards (winners, match results). */
  shadowElevated?: string;
  /** Border radius. Default `6px` */
  radius?: string;
  /** Primary font stack. Default system-ui */
  font?: string;
  /** Monospace font (stats, codes). Default ui-monospace */
  fontMono?: string;
}
