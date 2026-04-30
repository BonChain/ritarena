// games/snake/web/src/components/MatchOverlay.tsx
import { MatchResult } from "@ritarena/ui";
import { txExplorerUrl } from "@ritarena/sdk";
import { getPersonality } from "../lib/bots";
import type { ArenaInfo, GameState } from "../lib/ws";

export interface MatchOverlayProps {
  state: GameState;
  arenaInfo: ArenaInfo | null;
  winnerTxSignature?: string;
  onDismiss: () => void;
}

export function MatchOverlay({ state, arenaInfo, winnerTxSignature, onDismiss }: MatchOverlayProps) {
  if (!state.gameOver || !state.winner) return null;

  const personality = getPersonality(state.winner);
  const winnerName = personality?.name ?? state.winner.toUpperCase();

  const prizePoolLamports = arenaInfo ? arenaInfo.prizePool * 1_000_000 : 0;
  const firstPlaceShare = arenaInfo?.prizeSplit?.[0] ?? 100;
  const prize = Math.floor((prizePoolLamports * firstPlaceShare) / 100);

  const explorerUrl = winnerTxSignature
    ? txExplorerUrl(winnerTxSignature)
    : arenaInfo?.explorerUrl ?? "#";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        padding: "20px",
      }}
      onClick={(e) => {
        // Dismiss when clicking the backdrop (not the card)
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px", position: "relative" }}>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "-12px",
            right: "-12px",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            border: "1px solid var(--ritarena-border)",
            background: "var(--ritarena-bg-card)",
            color: "var(--ritarena-text)",
            fontFamily: "var(--ritarena-font-mono)",
            fontSize: "18px",
            cursor: "pointer",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--ritarena-shadow-card)",
          }}
        >
          ×
        </button>
        <MatchResult
          winner={{ name: winnerName, prize }}
          txSignature={winnerTxSignature ?? ""}
          explorerUrl={explorerUrl}
          currency="USDC"
        />
      </div>
    </div>
  );
}
