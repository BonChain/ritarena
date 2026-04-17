import type { GodPower, RitArenaTheme } from "../types";
import { themeToStyle } from "../theme";

export interface GodPowerBarProps {
  powers: GodPower[];
  onUse: (powerId: string) => void;
  disabled?: boolean;
  theme?: RitArenaTheme;
  className?: string;
}

export function GodPowerBar({
  powers,
  onUse,
  disabled = false,
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
            onClick={() => !isDisabled && onUse(power.id)}
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
            <span style={{ fontSize: "20px" }}>{power.icon}</span>
            <span style={{ fontSize: "11px", fontWeight: 600 }}>{power.label}</span>
            <span
              style={{
                fontSize: "10px",
                fontFamily: "var(--ritarena-font-mono)",
                color: "var(--ritarena-text-muted)",
              }}
            >
              {onCooldown ? `${power.cooldown}s` : `${power.cost} USDC`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
