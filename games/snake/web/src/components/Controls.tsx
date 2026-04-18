// games/snake/web/src/components/Controls.tsx
import type { ClientMessage } from "../lib/ws";

export interface ControlsProps {
  phase: string;
  mode: "mock" | "devnet";
  onMode: (mode: "mock" | "devnet") => void;
  onSend: (msg: ClientMessage) => void;
  speedMultiplier: number;
}

export function Controls({ phase, mode, onMode, onSend, speedMultiplier }: ControlsProps) {
  const canStart = phase === "lobby" || phase === "finished";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px",
        background: "var(--ritarena-bg-card)",
        borderRadius: "var(--ritarena-radius)",
        boxShadow: "var(--ritarena-shadow-card)",
        flexWrap: "wrap",
      }}
    >
      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
        <span style={{ color: "var(--ritarena-text-muted)", fontFamily: "var(--ritarena-font-mono)" }}>
          MODE
        </span>
        <select
          value={mode}
          onChange={(e) => onMode(e.target.value as "mock" | "devnet")}
          disabled={!canStart}
          style={{
            padding: "6px 10px",
            background: "var(--ritarena-bg)",
            color: "var(--ritarena-text)",
            border: "1px solid var(--ritarena-border)",
            borderRadius: "var(--ritarena-radius)",
            fontFamily: "var(--ritarena-font-mono)",
          }}
        >
          <option value="mock">Mock</option>
          <option value="devnet">Devnet</option>
        </select>
      </label>

      <div style={{ display: "flex", gap: "4px" }}>
        {[1, 2, 5].map((mult) => (
          <button
            key={mult}
            type="button"
            onClick={() => onSend({ type: "speed", multiplier: mult })}
            style={{
              padding: "6px 10px",
              background: speedMultiplier === mult ? "var(--ritarena-accent)" : "transparent",
              color: speedMultiplier === mult ? "var(--ritarena-bg)" : "var(--ritarena-text-muted)",
              border: "1px solid var(--ritarena-border)",
              borderRadius: "var(--ritarena-radius)",
              fontFamily: "var(--ritarena-font-mono)",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {mult}x
          </button>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <button
        type="button"
        disabled={!canStart}
        onClick={() =>
          onSend(
            phase === "finished"
              ? { type: "restart" }
              : { type: "start", mode },
          )
        }
        style={{
          padding: "10px 20px",
          background: "var(--ritarena-accent)",
          color: "var(--ritarena-bg)",
          border: "none",
          borderRadius: "var(--ritarena-radius)",
          fontFamily: "var(--ritarena-font-mono)",
          fontWeight: 700,
          fontSize: "13px",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          cursor: canStart ? "pointer" : "not-allowed",
          opacity: canStart ? 1 : 0.4,
        }}
      >
        {phase === "finished" ? "Restart" : "Start"}
      </button>
    </div>
  );
}
