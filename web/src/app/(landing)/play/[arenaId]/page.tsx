"use client";

import { use, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { RpsChoice } from "@ritarena/sdk";
import { useArenaSocket } from "@/lib/rps/use-arena-socket";
import RpsChoiceButtons from "@/components/rps/RpsChoiceButtons";
import RpsArenaLobby from "@/components/rps/RpsArenaLobby";
import RpsResultCard from "@/components/rps/RpsResultCard";

const BOTS = [
  { name: "@copycat", tagline: "Mirrors your last move." },
  { name: "@counter-predictor", tagline: "Counters your top choice." },
  { name: "@chaos", tagline: "Pure randomness." },
  { name: "@last-winner", tagline: "Plays last round's winner." },
  { name: "@rock-head", tagline: "Really likes rock." },
];

export default function MatchPage({
  params,
}: {
  params: Promise<{ arenaId: string }>;
}) {
  const { arenaId } = use(params);
  const { publicKey } = useWallet();
  const { phase, submit } = useArenaSocket(arenaId);
  const [roundLocked, setRoundLocked] = useState(false);

  useEffect(() => {
    // Reset lock state at each round start.
    if (phase.kind === "round-start") setRoundLocked(false);
  }, [phase.kind, phase.kind === "round-start" ? phase.round : null]);

  function handlePick(choice: RpsChoice) {
    if (phase.kind !== "round-start") return;
    submit(choice, phase.round);
    setRoundLocked(true);
  }

  // Build player list (bots + human)
  const players = [
    ...BOTS.map((b) => ({
      pubkey: b.name,
      name: b.name,
      tagline: b.tagline,
      isBot: true,
    })),
    ...(publicKey
      ? [{
          pubkey: publicKey.toBase58(),
          name: "You",
          isBot: false,
          isHuman: true,
        }]
      : []),
  ];

  return (
    <section className="pt-32 pb-16 px-6 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-baseline justify-between mb-8">
          <h1
            className="text-2xl md:text-3xl tracking-tight"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
          >
            Arena #{arenaId}
          </h1>
          <div
            className="text-sm uppercase tracking-widest"
            style={{ color: "#9945FF", fontFamily: "var(--font-data)" }}
          >
            Round {phase.kind === "round-start" ? phase.round + 1 : phase.kind === "round-resolved" ? phase.round + 1 : "-"}{" / 3"}
          </div>
        </div>

        <div className="mb-10">
          <RpsArenaLobby players={players} />
        </div>

        {phase.kind === "waiting" && (
          <p className="text-center text-lg" style={{ color: "#a0a0a0" }}>
            Waiting for match to start…
          </p>
        )}

        {phase.kind === "round-start" && (
          <RpsChoiceButtons
            deadline={phase.deadline}
            onPick={handlePick}
            locked={roundLocked}
          />
        )}

        {phase.kind === "round-resolved" && (
          <div className="glass-card p-6 text-center">
            <div
              className="text-sm uppercase tracking-widest mb-3"
              style={{ color: "#9945FF", fontFamily: "var(--font-data)" }}
            >
              Round {phase.round + 1} resolved
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {phase.pubkeys.map((pk, i) => {
                const name = BOTS[i]?.name ?? "You";
                return (
                  <div key={pk} className="text-center">
                    <div className="text-2xl mb-1">
                      {phase.choices[i] === "rock" ? "🪨" : phase.choices[i] === "paper" ? "📄" : "✂️"}
                    </div>
                    <div className="text-xs" style={{ color: "#a0a0a0" }}>
                      {name}
                    </div>
                    <div className="text-sm" style={{ color: "#14F195" }}>
                      +{phase.scores[i]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {phase.kind === "complete" && publicKey && (() => {
          const me = phase.finalRanks.find((r) => r.pubkey === publicKey.toBase58());
          if (!me) return null;
          return (
            <RpsResultCard
              arenaId={arenaId}
              humanRank={me.rank}
              humanScore={me.score}
              onRematch={() => {
                window.location.href = "/play";
              }}
            />
          );
        })()}
      </div>
    </section>
  );
}
