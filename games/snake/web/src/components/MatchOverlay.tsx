// games/snake/web/src/components/MatchOverlay.tsx
import { MatchResult } from "@ritarena/ui";
import { getPersonality } from "../lib/bots";
import type { ArenaInfo, GameState } from "../lib/ws";

export interface MatchOverlayProps {
  state: GameState;
  arenaInfo: ArenaInfo | null;
  winnerTxSignature?: string;
}

export function MatchOverlay({ state, arenaInfo, winnerTxSignature }: MatchOverlayProps) {
  if (!state.gameOver || !state.winner) return null;

  const personality = getPersonality(state.winner);
  const winnerName = personality?.name ?? state.winner.toUpperCase();

  // Prize pool in USDC lamports
  const prizePoolLamports = arenaInfo ? arenaInfo.prizePool * 1_000_000 : 0;
  const firstPlaceShare = arenaInfo?.prizeSplit?.[0] ?? 100;
  const prize = Math.floor((prizePoolLamports * firstPlaceShare) / 100);

  const explorerUrl = winnerTxSignature
    ? `https://explorer.solana.com/tx/${winnerTxSignature}?cluster=devnet`
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
    >
      <div style={{ width: "100%", maxWidth: "420px" }}>
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
