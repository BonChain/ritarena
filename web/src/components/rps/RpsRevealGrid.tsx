"use client";

import { motion } from "framer-motion";
import { txExplorerUrl, type RpsChoice } from "@ritarena/sdk";
import { useRevealSequence } from "@/lib/rps/use-reveal-sequence";

const CHOICE_GLYPHS: Record<RpsChoice, string> = { rock: "🪨", paper: "📄", scissors: "✂️" };

type Props = {
  round: number; // 1-indexed for display
  choices: readonly RpsChoice[];
  scores: readonly number[];
  pubkeys: readonly string[];
  humanPubkey: string | null;
  /** Resolves a player pubkey to a display name. */
  nameFor: (pubkey: string) => string;
  tx: string;
};

type Outcome = "winner" | "loser" | "tie";

export default function RpsRevealGrid({ round, choices, scores, pubkeys, humanPubkey, nameFor, tx }: Props) {
  const { revealedCount } = useRevealSequence({ epoch: round, count: pubkeys.length });

  const someoneWon = scores.some((s) => s > 0);
  const outcomeFor = (i: number): Outcome => {
    if (scores[i] > 0) return "winner";
    if (someoneWon) return "loser";
    return "tie";
  };

  return (
    <div className="glass-card p-6 text-center">
      <div
        className="text-sm uppercase tracking-widest mb-4"
        style={{ color: "#9945FF", fontFamily: "var(--font-data)" }}
      >
        Round {round} resolved
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {pubkeys.map((pk, i) => {
          const revealed = i < revealedCount;
          const outcome = outcomeFor(i);
          const isHuman = pk === humanPubkey;
          const name = nameFor(pk);

          const tileStyle =
            outcome === "winner"
              ? {
                  borderColor: "rgba(20,241,149,0.6)",
                  boxShadow: "0 0 24px rgba(20,241,149,0.3)",
                }
              : outcome === "loser"
                ? { opacity: 0.45 }
                : undefined;

          return (
            <motion.div
              key={pk}
              className="glass-card p-3 text-center"
              style={{
                borderColor: isHuman ? "rgba(20,241,149,0.5)" : undefined,
                ...tileStyle,
              }}
              initial={{ opacity: 0, scale: 0.7, rotateX: -90 }}
              animate={
                revealed
                  ? { opacity: tileStyle?.opacity ?? 1, scale: 1, rotateX: 0 }
                  : { opacity: 0, scale: 0.7, rotateX: -90 }
              }
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
            >
              <div className="text-3xl mb-1" style={{ minHeight: "1.2em" }}>
                {revealed ? CHOICE_GLYPHS[choices[i]] : "?"}
              </div>
              <div className="text-xs truncate" style={{ color: "#a0a0a0" }}>
                {name}
              </div>
              <div
                className="text-sm"
                style={{
                  color: outcome === "winner" ? "#14F195" : outcome === "loser" ? "#ff5577" : "#888",
                  fontFamily: "var(--font-score)",
                  fontWeight: 700,
                }}
              >
                +{scores[i]}
              </div>
            </motion.div>
          );
        })}
      </div>

      <a
        href={txExplorerUrl(tx)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-4 text-xs underline opacity-70 hover:opacity-100 transition-opacity"
        style={{ color: "#9945FF", fontFamily: "var(--font-data)" }}
      >
        View round on Solana Explorer ↗
      </a>
    </div>
  );
}
