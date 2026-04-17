import type { RitArenaTheme } from "../types";
import { themeToStyle } from "../theme";

export interface PhaseTimerProps {
  label: string;
  secondsRemaining: number;
  totalSeconds: number;
  theme?: RitArenaTheme;
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
        border: "1px solid var(--ritarena-border)",
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
            color: urgent ? "#ff5555" : "var(--ritarena-accent)",
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
          style={{
            height: "100%",
            width: `${progress * 100}%`,
            background: urgent ? "#ff5555" : "var(--ritarena-accent)",
            borderRadius: "2px",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}
