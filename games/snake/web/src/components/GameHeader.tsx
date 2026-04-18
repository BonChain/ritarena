// games/snake/web/src/components/GameHeader.tsx
import type { ArenaInfo } from "../lib/ws";

export interface GameHeaderProps {
  arenaInfo: ArenaInfo | null;
  phase: string;
}

export function GameHeader({ arenaInfo, phase }: GameHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        background: "var(--ritarena-bg-card)",
        borderRadius: "var(--ritarena-radius)",
        boxShadow: "var(--ritarena-shadow-card)",
        fontFamily: "var(--ritarena-font)",
      }}
    >
      <div>
        <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--ritarena-text)" }}>
          SNAKE ROYALE
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "var(--ritarena-text-muted)",
            fontFamily: "var(--ritarena-font-mono)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          {arenaInfo ? `ARENA #${arenaInfo.arenaId} · ${arenaInfo.mode.toUpperCase()}` : "LOBBY"}
        </div>
      </div>
      <div
        style={{
          padding: "6px 12px",
          background: "var(--ritarena-accent-glow)",
          color: "var(--ritarena-accent)",
          borderRadius: "var(--ritarena-radius)",
          fontFamily: "var(--ritarena-font-mono)",
          fontSize: "11px",
          fontWeight: 700,
          textTransform: "uppercase",
        }}
      >
        {phase}
      </div>
    </div>
  );
}
