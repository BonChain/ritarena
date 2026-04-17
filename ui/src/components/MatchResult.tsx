import type { MatchWinner, RitArenaTheme } from "../types";
import { themeToStyle } from "../theme";

export interface MatchResultProps {
  winner: MatchWinner;
  txSignature: string;
  explorerUrl: string;
  currency?: string;
  theme?: RitArenaTheme;
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
        border: "1px solid var(--ritarena-accent)",
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
          padding: "8px 16px",
          borderRadius: "var(--ritarena-radius)",
          border: "1px solid var(--ritarena-border)",
          color: "var(--ritarena-text-muted)",
          fontFamily: "var(--ritarena-font-mono)",
          fontSize: "12px",
          textDecoration: "none",
        }}
      >
        Verify on Explorer &rarr;
      </a>
    </div>
  );
}
