"use client";

import { useState } from "react";
import Link from "next/link";
import { txExplorerUrl } from "@ritarena/sdk";

type Props = {
  arenaId: string;
  humanRank: number;
  humanScore: number;
  maxScore: number;
  /** Best score across all prior matches (excluding this one). */
  previousBest: number;
  currentStreak: number;
  bestStreak: number;
  finalizeTx: string;
  /** Async — caller sets up the next arena, signs entry, navigates. */
  onRematch: () => Promise<void> | void;
};

export default function RpsResultCard({
  arenaId,
  humanRank,
  humanScore,
  maxScore,
  previousBest,
  currentStreak,
  bestStreak,
  finalizeTx,
  onRematch,
}: Props) {
  const [rematchPending, setRematchPending] = useState(false);
  const medal = humanRank === 1 ? "🥇" : humanRank === 2 ? "🥈" : humanRank === 3 ? "🥉" : "";
  const isNewPB = humanScore > previousBest;
  const tiedPB = humanScore === previousBest && previousBest > 0;
  const oneFromPB = !isNewPB && !tiedPB && previousBest - humanScore === 1;

  const shareText = `I ranked #${humanRank} (${humanScore}/${maxScore}) on RitArena Arena #${arenaId} vs 5 AI agents. ${medal}`;
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(`https://ritarena.xyz/explore/${arenaId}`)}`;

  async function handleRematch() {
    if (rematchPending) return;
    setRematchPending(true);
    try {
      await onRematch();
    } finally {
      // Parent navigates on success, so this rarely runs; on error the parent
      // surfaces it and we re-enable the button.
      setRematchPending(false);
    }
  }

  return (
    <div className="glass-card p-8 text-center">
      <div className="text-6xl mb-2">{medal || "🎮"}</div>
      <div
        className="text-xs uppercase tracking-widest"
        style={{ color: "#9945FF", fontFamily: "var(--font-data)" }}
      >
        Final rank
      </div>
      <div
        className="text-6xl mb-3"
        style={{ fontFamily: "var(--font-score)", fontWeight: 700, color: "#14F195" }}
      >
        #{humanRank}
      </div>

      <div className="flex flex-col items-center gap-1 mb-6">
        <div
          className="text-3xl"
          style={{ fontFamily: "var(--font-score)", fontWeight: 700, color: "#f0f0f0" }}
        >
          {humanScore}
          <span style={{ color: "#55556a" }}> / {maxScore}</span>
        </div>
        {isNewPB ? (
          <div
            className="text-sm uppercase tracking-widest mt-1 px-3 py-1 rounded"
            style={{
              color: "#050508",
              background: "#14F195",
              fontFamily: "var(--font-ui)",
              fontWeight: 700,
            }}
          >
            ★ New high score
          </div>
        ) : tiedPB ? (
          <div className="text-xs" style={{ color: "#14F195", fontFamily: "var(--font-data)" }}>
            Tied your best
          </div>
        ) : oneFromPB ? (
          <div className="text-xs" style={{ color: "#FFC53D", fontFamily: "var(--font-data)" }}>
            One point from your best ({previousBest}/{maxScore}) — go again
          </div>
        ) : previousBest > 0 ? (
          <div className="text-xs" style={{ color: "#55556a", fontFamily: "var(--font-data)" }}>
            Best so far: {previousBest}/{maxScore}
          </div>
        ) : null}
      </div>

      <div
        className="flex justify-center gap-6 mb-6 text-xs"
        style={{ fontFamily: "var(--font-data)", color: "#a0a0a0" }}
      >
        <span>
          {humanRank === 1 ? "🔥 " : ""}
          Streak: <strong style={{ color: humanRank === 1 ? "#14F195" : "#888" }}>{currentStreak}</strong>
        </span>
        <span>
          Best streak: <strong style={{ color: "#f0f0f0" }}>{bestStreak}</strong>
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          onClick={handleRematch}
          disabled={rematchPending}
          className="cta-shimmer px-6 py-3 rounded-lg text-sm transition-all hover:brightness-110 disabled:opacity-60"
          style={{
            background: "#14F195",
            color: "#050508",
            fontFamily: "var(--font-ui)",
            fontWeight: 700,
          }}
        >
          {rematchPending ? "Setting up…" : "Rematch →"}
        </button>
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 rounded-lg text-sm border border-[rgba(255,255,255,0.15)] transition-colors hover:border-white"
          style={{ color: "#c0c0c0", fontFamily: "var(--font-ui)", fontWeight: 600 }}
        >
          Share on X ↗
        </a>
        <Link
          href={`/explore/${arenaId}`}
          className="px-6 py-3 rounded-lg text-sm"
          style={{ color: "#888", fontFamily: "var(--font-ui)", fontWeight: 600 }}
        >
          View on-chain
        </Link>
      </div>

      <a
        href={txExplorerUrl(finalizeTx)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-6 text-xs underline opacity-70 hover:opacity-100 transition-opacity"
        style={{ color: "#9945FF", fontFamily: "var(--font-data)" }}
      >
        View finalize tx on Solana Explorer ↗
      </a>
    </div>
  );
}
