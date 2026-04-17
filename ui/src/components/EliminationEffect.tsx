"use client";

import { useState, useEffect } from "react";
import type { RitArenaTheme } from "../types";
import { themeToStyle } from "../theme";

/**
 * Full-screen overlay animation. Fires when `trigger` changes, auto-hides after 2s.
 * Uses `role="alert"` and `aria-live="assertive"` for screen reader announcement.
 * @example
 * // Increment trigger to fire the overlay
 * <EliminationEffect agentName={lastKill.name} trigger={lastKill.timestamp} />
 */
export interface EliminationEffectProps {
  /** Name of eliminated agent (shown below "REKT") */
  agentName: string;
  /** Monotonic counter — increment to fire overlay. Same value twice = no effect */
  trigger: number;
  /** Visual variant. `rekt` shows "REKT", others show "ELIMINATED". Default "rekt" */
  variant?: "shatter" | "fade" | "rekt";
  /** CSS position strategy. `absolute` needs a positioned parent, `fixed` is viewport-wide. Default "absolute" */
  position?: "absolute" | "fixed";
  /** Per-instance theme override */
  theme?: RitArenaTheme;
  /** Additional CSS class */
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
