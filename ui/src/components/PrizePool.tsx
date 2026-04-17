"use client";

import type { RitArenaTheme } from "../types";
import { themeToStyle } from "../theme";

/**
 * Shows total prize pool after protocol + creator fees are deducted.
 * @example
 * <PrizePool total={40_000_000} creatorFeeBps={500} protocolFeeBps={100} />
 * // Renders: 37.60 USDC (40 - 1% - 5%)
 */
export interface PrizePoolProps {
  /** Total pool in base units (6 decimals for USDC). E.g. 40_000_000 = 40 USDC */
  total: number;
  /** Creator fee in basis points. E.g. 500 = 5% */
  creatorFeeBps: number;
  /** Protocol fee in basis points. E.g. 100 = 1% */
  protocolFeeBps: number;
  /** Currency label. Default: "USDC" */
  currency?: string;
  /** Per-instance theme override */
  theme?: RitArenaTheme;
  /** Additional CSS class */
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
        boxShadow: "var(--ritarena-shadow-card)",
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
          textShadow: "0 0 24px var(--ritarena-accent-glow)",
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
