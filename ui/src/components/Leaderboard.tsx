import type { Player, RitArenaTheme } from "../types";
import { themeToStyle } from "../theme";

export interface LeaderboardProps {
  players: Player[];
  maxVisible?: number;
  showEliminated?: boolean;
  theme?: RitArenaTheme;
  className?: string;
}

export function Leaderboard({
  players,
  maxVisible,
  showEliminated = true,
  theme,
  className,
}: LeaderboardProps) {
  const sorted = [...players].sort((a, b) => a.rank - b.rank);
  const filtered = showEliminated ? sorted : sorted.filter((p) => p.alive);
  const visible = maxVisible ? filtered.slice(0, maxVisible) : filtered;

  return (
    <div
      className={className}
      style={{
        ...themeToStyle(theme),
        background: "var(--ritarena-bg-card)",
        border: "1px solid var(--ritarena-border)",
        borderRadius: "var(--ritarena-radius)",
        fontFamily: "var(--ritarena-font)",
        padding: "12px",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--ritarena-text-muted)",
          fontFamily: "var(--ritarena-font-mono)",
          marginBottom: "8px",
        }}
      >
        Leaderboard
      </div>
      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {visible.map((player) => (
          <li
            key={player.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 8px",
              borderBottom: "1px solid var(--ritarena-border)",
              opacity: player.alive ? 1 : 0.4,
              textDecoration: player.alive ? "none" : "line-through",
              color: "var(--ritarena-text)",
              fontSize: "14px",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontFamily: "var(--ritarena-font-mono)",
                  color: "var(--ritarena-text-muted)",
                  width: "20px",
                  textAlign: "right",
                }}
              >
                {player.rank}
              </span>
              {player.color && (
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: player.color,
                    flexShrink: 0,
                  }}
                />
              )}
              <span>{player.name}</span>
            </span>
            <span
              style={{
                fontFamily: "var(--ritarena-font-mono)",
                color: player.alive
                  ? "var(--ritarena-accent)"
                  : "var(--ritarena-text-muted)",
              }}
            >
              {player.alive ? player.score : "REKT"}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
