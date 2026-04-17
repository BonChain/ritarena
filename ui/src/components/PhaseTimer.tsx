"use client";

import type { RitArenaTheme } from "../types";
import { themeToStyle } from "../theme";

/**
 * Countdown timer with progress bar. Turns red (danger) at ≤3s remaining.
 * Renders with `role="progressbar"` and aria-value attributes.
 * @example
 * <PhaseTimer label="OPEN PHASE" secondsRemaining={4} totalSeconds={7} />
 */
export interface PhaseTimerProps {
  /** Phase name (shown in caps above bar) */
  label: string;
  /** Current countdown value */
  secondsRemaining: number;
  /** Total phase duration (for progress bar width) */
  totalSeconds: number;
  /** Per-instance theme override */
  theme?: RitArenaTheme;
  /** Additional CSS class */
  className?: string;
}

export function PhaseTimer({
  label,
  secondsRemaining,
  totalSeconds,
  theme,
  className,
}: PhaseTimerProps) {
  const progress = totalSeconds > 0 ? secondsRemaining / totalSeconds : 0;
  const urgent = secondsRemaining <= 3;

  return (
    <div
      className={className}
      style={{
        ...themeToStyle(theme),
        background: "var(--ritarena-bg-card)",
        boxShadow: "var(--ritarena-shadow-card)",
        borderRadius: "var(--ritarena-radius)",
        fontFamily: "var(--ritarena-font-mono)",
        padding: "8px 12px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "6px",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--ritarena-text-muted)",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: "16px",
            fontWeight: 700,
            color: urgent ? "var(--ritarena-danger)" : "var(--ritarena-accent)",
          }}
        >
          {secondsRemaining}s
        </span>
      </div>
      <div
        style={{
          height: "4px",
          borderRadius: "2px",
          background: "var(--ritarena-border)",
          overflow: "hidden",
        }}
      >
        <div
          data-testid="progress-bar"
          role="progressbar"
          aria-valuenow={secondsRemaining}
          aria-valuemin={0}
          aria-valuemax={totalSeconds}
          aria-label={label}
          style={{
            height: "100%",
            width: `${progress * 100}%`,
            background: urgent ? "var(--ritarena-danger)" : "var(--ritarena-accent)",
            borderRadius: "2px",
            transition: "width 0.3s ease, background 0.2s ease",
          }}
        />
      </div>
    </div>
  );
}
