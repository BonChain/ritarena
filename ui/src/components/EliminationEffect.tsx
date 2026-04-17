import { useState, useEffect } from "react";
import type { RitArenaTheme } from "../types";
import { themeToStyle } from "../theme";

export interface EliminationEffectProps {
  agentName: string;
  trigger: number | boolean;
  variant?: "shatter" | "fade" | "rekt";
  theme?: RitArenaTheme;
  className?: string;
}

export function EliminationEffect({
  agentName,
  trigger,
  variant = "rekt",
  theme,
  className,
}: EliminationEffectProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  if (!visible) return null;

  return (
    <div
      className={className}
      style={{
        ...themeToStyle(theme),
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 9999,
        textAlign: "center",
        fontFamily: "var(--ritarena-font)",
        animation: "ritarena-fade-in 0.2s ease-out",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontSize: "48px",
          fontWeight: 900,
          color: "#ff5555",
          textShadow: "0 0 40px rgba(255,85,85,0.6)",
          letterSpacing: "-0.02em",
        }}
      >
        {variant === "rekt" ? "REKT" : "ELIMINATED"}
      </div>
      <div
        style={{
          fontSize: "20px",
          color: "var(--ritarena-text-muted)",
          marginTop: "4px",
        }}
      >
        {agentName}
      </div>
    </div>
  );
}
