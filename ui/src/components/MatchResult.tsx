"use client";

import type { MatchWinner, RitArenaTheme } from "../types";
import { themeToStyle } from "../theme";

/**
 * Post-match winner display with Solana Explorer verification link.
 * @example
 * <MatchResult
 *   winner={{ name: "ALPHA", prize: 24_000_000 }}
 *   txSignature="3fWF5T..."
 *   explorerUrl="https://explorer.solana.com/tx/3fWF5T...?cluster=devnet"
 * />
 */
export interface MatchResultProps {
  /** Winner info (name + prize in base units) */
  winner: MatchWinner;
  /** Full transaction signature */
  txSignature: string;
  /** Full URL to transaction on Solana Explorer (include ?cluster=devnet if needed) */
  explorerUrl: string;
  /** Currency label. Default "USDC" */
  currency?: string;
  /** Per-instance theme override */
  theme?: RitArenaTheme;
  /** Additional CSS class */
  className?: string;
}

export function MatchResult({
  winner,
  txSignature,
  explorerUrl,
  currency = "USDC",
  theme,
  className,
}: MatchResultProps) {
  const prizeDisplay = (winner.prize / 1_000_000).toFixed(2);

  return (
    <div
      className={className}
      style={{
        ...themeToStyle(theme),
        background: "var(--ritarena-bg-card)",
        boxShadow: "0 0 0 1px var(--ritarena-accent), 0 0 32px var(--ritarena-accent-glow), var(--ritarena-shadow-elevated)",
        borderRadius: "var(--ritarena-radius)",
        fontFamily: "var(--ritarena-font)",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          color: "var(--ritarena-text-muted)",
          marginBottom: "8px",
        }}
      >
        Winner
      </div>
      <div
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: "var(--ritarena-text)",
          marginBottom: "4px",
        }}
      >
        {winner.name}
      </div>
      <div
        style={{
          fontSize: "32px",
          fontWeight: 700,
          color: "var(--ritarena-accent)",
          fontFamily: "var(--ritarena-font-mono)",
          textShadow: "0 0 24px var(--ritarena-accent-glow)",
        }}
      >
        {prizeDisplay}
      </div>
      <div
        style={{
          fontSize: "12px",
          color: "var(--ritarena-text-muted)",
          marginBottom: "16px",
        }}
      >
        {currency}
      </div>
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-block",
          padding: "10px 20px",
          borderRadius: "var(--ritarena-radius)",
          background: "var(--ritarena-accent)",
          color: "var(--ritarena-bg)",
          fontFamily: "var(--ritarena-font-mono)",
          fontSize: "12px",
          fontWeight: 700,
          letterSpacing: "0.05em",
          textDecoration: "none",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 4px 12px var(--ritarena-accent-glow)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "";
          e.currentTarget.style.boxShadow = "";
        }}
      >
        Verify on Explorer &rarr;
      </a>
    </div>
  );
}
