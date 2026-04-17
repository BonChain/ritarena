import { useState, useEffect } from "react";
import type { RitArenaTheme } from "../types";
import { themeToStyle } from "../theme";

export interface EliminationEffectProps {
  agentName: string;
  trigger: number;
  variant?: "shatter" | "fade" | "rekt";
  position?: "fixed" | "absolute";
  theme?: RitArenaTheme;
  className?: string;
}

export function EliminationEffect({
  agentName,
  trigger,
  variant = "rekt",
  position = "absolute",
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
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{
        ...themeToStyle(theme),
        position,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: "var(--ritarena-z-overlay, 9999)" as any,
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
          color: "var(--ritarena-danger)",
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
