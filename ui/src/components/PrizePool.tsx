import type { RitArenaTheme } from "../types";
import { themeToStyle } from "../theme";

export interface PrizePoolProps {
  total: number;
  creatorFeeBps: number;
  protocolFeeBps: number;
  currency?: string;
  theme?: RitArenaTheme;
  className?: string;
}

export function PrizePool({
  total,
  creatorFeeBps,
  protocolFeeBps,
  currency = "USDC",
  theme,
  className,
}: PrizePoolProps) {
  const totalDisplay = (total / 1_000_000).toFixed(2);
  const protocolFee = (total * protocolFeeBps) / 10_000;
  const creatorFee = (total * creatorFeeBps) / 10_000;
  const prizePool = total - protocolFee - creatorFee;
  const prizeDisplay = (prizePool / 1_000_000).toFixed(2);

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
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--ritarena-text-muted)",
          fontFamily: "var(--ritarena-font-mono)",
        }}
      >
        Prize Pool
      </div>
      <div
        style={{
          fontSize: "28px",
          fontWeight: 700,
          color: "var(--ritarena-accent)",
          fontFamily: "var(--ritarena-font-mono)",
          lineHeight: 1.2,
        }}
      >
        {prizeDisplay}
      </div>
      <div
        style={{
          fontSize: "12px",
          color: "var(--ritarena-text-muted)",
          fontFamily: "var(--ritarena-font-mono)",
        }}
      >
        {currency}
      </div>
      <div
        style={{
          marginTop: "8px",
          fontSize: "11px",
          color: "var(--ritarena-text-muted)",
          fontFamily: "var(--ritarena-font-mono)",
          display: "flex",
          justifyContent: "center",
          gap: "12px",
        }}
      >
        <span>Total: <span>{totalDisplay}</span></span>
        <span>Fee: {(protocolFeeBps / 100).toFixed(0)}%+{(creatorFeeBps / 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}
