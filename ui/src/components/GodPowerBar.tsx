"use client";

import type { GodPower, RitArenaTheme } from "../types";
import { themeToStyle } from "../theme";

/**
 * Grid of spectator power buttons with cooldown indicators.
 * Uses native `<button disabled>` — respects keyboard and a11y.
 * @example
 * <GodPowerBar powers={powers} onUse={(id) => handleGodPower(id)} currency="USDC" />
 */
export interface GodPowerBarProps {
  /** Available powers */
  powers: GodPower[];
  /** Called with power id on button click */
  onUse: (powerId: string) => void;
  /** Disable all buttons (e.g., competitors can't use god powers in their own match) */
  disabled?: boolean;
  /** Currency label for cost display. Default "USDC" */
  currency?: string;
  /** Per-instance theme override */
  theme?: RitArenaTheme;
  /** Additional CSS class */
  className?: string;
}

export function GodPowerBar({
  powers,
  onUse,
  disabled = false,
  currency = "USDC",
  theme,
  className,
}: GodPowerBarProps) {
  return (
    <div
      className={className}
      style={{
        ...themeToStyle(theme),
        display: "flex",
        gap: "8px",
        padding: "8px",
        background: "var(--ritarena-bg-card)",
        border: "1px solid var(--ritarena-border)",
        borderRadius: "var(--ritarena-radius)",
      }}
    >
      {powers.map((power) => {
        const onCooldown = power.cooldown > 0;
        const isDisabled = disabled || onCooldown;

        return (
          <button
            key={power.id}
            disabled={isDisabled}
            onClick={() => onUse(power.id)}
            aria-label={power.label}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              padding: "8px",
              background: isDisabled ? "var(--ritarena-bg)" : "transparent",
              border: `1px solid ${isDisabled ? "var(--ritarena-border)" : "var(--ritarena-accent)"}`,
              borderRadius: "var(--ritarena-radius)",
              cursor: isDisabled ? "not-allowed" : "pointer",
              opacity: isDisabled ? 0.4 : 1,
              color: "var(--ritarena-text)",
              fontFamily: "var(--ritarena-font)",
            }}
          >
            <span style={{ fontSize: "20px" }} aria-hidden="true">{power.icon}</span>
            <span style={{ fontSize: "11px", fontWeight: 600 }}>{power.label}</span>
            <span
              style={{
                fontSize: "10px",
                fontFamily: "var(--ritarena-font-mono)",
                color: "var(--ritarena-text-muted)",
              }}
            >
              {onCooldown ? `${power.cooldown}s` : `${power.cost} ${currency}`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
