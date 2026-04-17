"use client";

import type { RitArenaTheme } from "../types";
import { themeToStyle } from "../theme";

/**
 * Per-agent identity card with status badge.
 * @example
 * <AgentCard name="ALPHA" score={42} status="alive" rank={1} color="#14F195" />
 */
export interface AgentCardProps {
  /** Display name */
  name: string;
  /** Current score (shown if status="alive") */
  score: number;
  /** Visual state — `alive` shows score, `eliminated` shows REKT, `winner` shows WINNER + accent border */
  status: "alive" | "eliminated" | "winner";
  /** Current rank */
  rank: number;
  /** Avatar circle color */
  color?: string;
  /** Avatar content (falls back to first letter of name) */
  avatar?: string;
  /** Per-instance theme override */
  theme?: RitArenaTheme;
  /** Additional CSS class */
  className?: string;
}

export function AgentCard({
  name,
  score,
  status,
  rank,
  color,
  avatar,
  theme,
  className,
}: AgentCardProps) {
  const statusLabel = status === "winner" ? "WINNER" : status === "eliminated" ? "REKT" : null;

  return (
    <div
      className={className}
      style={{
        ...themeToStyle(theme),
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 12px",
        background: "var(--ritarena-bg-card)",
        boxShadow: status === "winner"
          ? "0 0 0 1px var(--ritarena-accent), 0 0 16px var(--ritarena-accent-glow), var(--ritarena-shadow-card)"
          : "var(--ritarena-shadow-card)",
        borderRadius: "var(--ritarena-radius)",
        transition: "box-shadow 0.2s ease, opacity 0.2s ease",
        fontFamily: "var(--ritarena-font)",
        opacity: status === "eliminated" ? 0.5 : 1,
      }}
    >
      <span
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          background: color || "var(--ritarena-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "12px",
          fontWeight: 700,
          color: "var(--ritarena-bg)",
          flexShrink: 0,
        }}
      >
        {avatar || name[0]}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            color: "var(--ritarena-text)",
            fontSize: "14px",
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "var(--ritarena-text-muted)",
            fontFamily: "var(--ritarena-font-mono)",
          }}
        >
          Rank #{rank}
        </div>
      </div>
      <div
        style={{
          fontFamily: "var(--ritarena-font-mono)",
          fontWeight: 700,
          fontSize: "16px",
          color:
            status === "winner"
              ? "var(--ritarena-accent)"
              : status === "eliminated"
                ? "var(--ritarena-danger)"
                : "var(--ritarena-text)",
        }}
      >
        {statusLabel || score}
      </div>
    </div>
  );
}
