"use client";

import Link from "next/link";

type Props = {
  arenaId: string;
  humanRank: number;
  humanScore: number;
  onRematch: () => void;
};

export default function RpsResultCard({ arenaId, humanRank, humanScore, onRematch }: Props) {
  const medal = humanRank === 1 ? "🥇" : humanRank === 2 ? "🥈" : humanRank === 3 ? "🥉" : "";
  const shareText = `I ranked #${humanRank} on RitArena Arena #${arenaId} vs 5 AI agents. ${medal}`;
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(`https://ritarena.xyz/explore/${arenaId}`)}`;

  return (
    <div className="glass-card p-8 text-center">
      <div className="text-6xl mb-3">{medal || "🎮"}</div>
      <div
        className="text-2xl uppercase tracking-widest mb-2"
        style={{ color: "#9945FF", fontFamily: "var(--font-data)" }}
      >
        Final rank
      </div>
      <div
        className="text-6xl mb-4"
        style={{ fontFamily: "var(--font-score)", fontWeight: 700, color: "#14F195" }}
      >
        #{humanRank}
      </div>
      <div className="text-base mb-8" style={{ color: "#c0c0c0" }}>
        Beat {humanScore} opponents total across 3 rounds.
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onRematch}
          className="cta-shimmer px-6 py-3 rounded-lg text-sm"
          style={{
            background: "#14F195",
            color: "#050508",
            fontFamily: "var(--font-ui)",
            fontWeight: 700,
          }}
        >
          Rematch →
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
    </div>
  );
}
