"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import type { RpsChoice } from "@ritarena/sdk";
import { useArenaSocket } from "@/lib/rps/use-arena-socket";
import { usePlayerStats, type PlayerStats } from "@/lib/rps/player-stats";
import { createAndEnterArena } from "@/lib/rps/start-match";
import * as sfx from "@/lib/rps/sfx";
import RpsArenaLobby from "@/components/rps/RpsArenaLobby";
import RpsContextStrip from "@/components/rps/RpsContextStrip";
import RpsRevealGrid from "@/components/rps/RpsRevealGrid";
import RpsResultCard from "@/components/rps/RpsResultCard";
import RpsHowToPanel from "@/components/rps/RpsHowToPanel";
import MuteToggle from "@/components/rps/MuteToggle";

const BOTS = [
  { name: "@copycat", tagline: "Mirrors your last move." },
  { name: "@counter-predictor", tagline: "Counters your top choice." },
  { name: "@chaos", tagline: "Pure randomness." },
  { name: "@last-winner", tagline: "Plays last round's winner." },
  { name: "@rock-head", tagline: "Really likes rock." },
] as const;

const TOTAL_ROUNDS = 3;
const MAX_PER_ROUND = 5; // 5 opponents → max +5 per round
const MAX_MATCH_SCORE = TOTAL_ROUNDS * MAX_PER_ROUND;
const HOWTO_KEY = "rps-howto-open";

type MatchSnapshot = {
  arenaId: string;
  rank: number;
  score: number;
  prevBestScore: number;
  postRecordStats: PlayerStats;
};

export default function MatchPage({
  params,
}: {
  params: Promise<{ arenaId: string }>;
}) {
  const { arenaId } = use(params);
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const router = useRouter();

  const { phase, running, submit, connected } = useArenaSocket(arenaId);
  const { stats, record } = usePlayerStats(publicKey ?? null);
  const [roundLocked, setRoundLocked] = useState(false);
  const [myChoiceThisRound, setMyChoiceThisRound] = useState<RpsChoice | null>(null);
  const [howToOpen, setHowToOpen] = useState(true);
  const [matchSnapshot, setMatchSnapshot] = useState<MatchSnapshot | null>(null);
  const [rematchError, setRematchError] = useState<string | null>(null);

  // Reset lock + pick at each round start.
  useEffect(() => {
    if (phase.kind === "round-start") {
      setRoundLocked(false);
      setMyChoiceThisRound(null);
    }
  }, [phase.kind, phase.kind === "round-start" ? phase.round : null]);

  // Reset per-arena state if the user navigates between arenas (instant rematch
  // keeps this component mounted).
  useEffect(() => {
    setMatchSnapshot(null);
    setRematchError(null);
  }, [arenaId]);

  // Snapshot stats + record on first complete event for this arenaId.
  useEffect(() => {
    if (phase.kind !== "complete" || !publicKey) return;
    if (matchSnapshot) return;
    const me = phase.finalRanks.find((r) => r.pubkey === publicKey.toBase58());
    if (!me) return;

    const prevBestScore = stats.bestScore;
    const postRecordStats = record(arenaId, { rank: me.rank, score: me.score });
    setMatchSnapshot({
      arenaId,
      rank: me.rank,
      score: me.score,
      prevBestScore,
      postRecordStats,
    });
    if (me.rank <= 3) sfx.flourish();
  }, [phase, publicKey, arenaId, matchSnapshot, stats.bestScore, record]);

  // Restore panel preference once on mount.
  useEffect(() => {
    const saved = window.localStorage.getItem(HOWTO_KEY);
    if (saved === "0") setHowToOpen(false);
  }, []);

  function setHowTo(open: boolean) {
    setHowToOpen(open);
    window.localStorage.setItem(HOWTO_KEY, open ? "1" : "0");
  }

  function handlePick(choice: RpsChoice) {
    if (phase.kind !== "round-start") return;
    submit(choice, phase.round);
    setMyChoiceThisRound(choice);
    setRoundLocked(true);
  }

  async function handleRematch() {
    if (!publicKey || !signTransaction || !signAllTransactions) return;
    setRematchError(null);
    try {
      const { arenaId: newArenaId } = await createAndEnterArena({
        connection,
        wallet: { publicKey, signTransaction, signAllTransactions },
      });
      router.push(`/play/${newArenaId}`);
    } catch (err) {
      setRematchError(String(err));
      throw err; // bubble so the result card re-enables its button
    }
  }

  const myPubkey = publicKey?.toBase58() ?? "";

  // Once any round has resolved, `running.lastPubkeys` gives the canonical
  // pubkey-per-slot mapping (5 bots in roster order, then the human).
  const botMeta = BOTS.map((b, i) => ({
    name: b.name,
    tagline: b.tagline,
    pubkey: running.lastPubkeys?.[i] ?? `__pending_${i}`,
  }));

  const players = [
    ...botMeta.map((b) => ({ pubkey: b.pubkey, name: b.name, tagline: b.tagline, isBot: true })),
    ...(publicKey
      ? [{ pubkey: myPubkey, name: "You", isBot: false, isHuman: true }]
      : []),
  ];

  function nameFor(pk: string): string {
    if (pk === myPubkey) return "You";
    const i = botMeta.findIndex((b) => b.pubkey === pk);
    return i >= 0 ? botMeta[i].name : pk.slice(0, 4);
  }

  const roundLabel =
    phase.kind === "round-start"
      ? phase.round + 1
      : phase.kind === "round-resolved"
        ? phase.round + 1
        : "-";

  return (
    <section className="pt-32 pb-16 px-6 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-baseline justify-between mb-8 gap-4">
          <h1
            className="text-2xl md:text-3xl tracking-tight"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
          >
            Arena #{arenaId}
          </h1>
          <div className="flex items-center gap-2">
            <div
              className="text-sm uppercase tracking-widest mr-2"
              style={{ color: "#9945FF", fontFamily: "var(--font-data)" }}
            >
              Round {roundLabel} / {TOTAL_ROUNDS}
            </div>
            <button
              type="button"
              onClick={() => setHowTo(!howToOpen)}
              aria-label={howToOpen ? "Hide how-to panel" : "Show how-to panel"}
              title="How to play"
              className="text-sm font-bold w-9 h-9 rounded-md flex items-center justify-center transition-colors hover:bg-[rgba(255,255,255,0.06)]"
              style={{
                color: howToOpen ? "#14F195" : "#c0c0c0",
                fontFamily: "var(--font-ui)",
              }}
            >
              ?
            </button>
            <MuteToggle />
          </div>
        </div>

        <div
          className={
            howToOpen
              ? "lg:grid lg:grid-cols-[320px_1fr] lg:gap-6"
              : ""
          }
        >
          {howToOpen && (
            <aside
              className="
                fixed inset-0 z-50 overflow-y-auto p-6
                bg-[rgba(10,10,15,0.95)] backdrop-blur-md
                lg:static lg:z-auto lg:bg-transparent lg:backdrop-blur-none
                lg:p-0 lg:overflow-visible
              "
            >
              <RpsHowToPanel onClose={() => setHowTo(false)} />
            </aside>
          )}

          <main className="min-w-0">
            {phase.kind === "waiting" && (
              <>
                <div className="mb-10">
                  <RpsArenaLobby players={players} />
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full border-2"
                    style={{
                      borderColor: "rgba(20,241,149,0.15)",
                      borderTopColor: "#14F195",
                      animation: "rps-spin 0.9s linear infinite",
                    }}
                  />
                  <p
                    className="text-sm uppercase tracking-widest"
                    style={{ color: "#14F195", fontFamily: "var(--font-data)" }}
                  >
                    {connected ? "Bots loading — round 1 incoming…" : "Connecting to game server…"}
                  </p>
                  <style jsx>{`
                    @keyframes rps-spin {
                      to {
                        transform: rotate(360deg);
                      }
                    }
                  `}</style>
                </div>
              </>
            )}

            {phase.kind === "round-start" && (
              <RpsContextStrip
                deadline={phase.deadline}
                round={phase.round + 1}
                totalRounds={TOTAL_ROUNDS}
                bots={botMeta}
                myPubkey={myPubkey}
                myChoiceThisRound={myChoiceThisRound}
                running={running}
                locked={roundLocked}
                onPick={handlePick}
              />
            )}

            {phase.kind === "round-resolved" && (
              <RpsRevealGrid
                round={phase.round + 1}
                choices={phase.choices}
                scores={phase.scores}
                pubkeys={phase.pubkeys}
                humanPubkey={myPubkey || null}
                nameFor={nameFor}
                tx={phase.tx}
              />
            )}

            {phase.kind === "complete" && publicKey && matchSnapshot && (
              <>
                {rematchError && (
                  <p className="mb-4 text-sm text-center" style={{ color: "#ff5577" }}>
                    {rematchError}
                  </p>
                )}
                <RpsResultCard
                  arenaId={arenaId}
                  humanRank={matchSnapshot.rank}
                  humanScore={matchSnapshot.score}
                  maxScore={MAX_MATCH_SCORE}
                  previousBest={matchSnapshot.prevBestScore}
                  currentStreak={matchSnapshot.postRecordStats.currentStreak}
                  bestStreak={matchSnapshot.postRecordStats.bestStreak}
                  finalizeTx={phase.tx}
                  onRematch={handleRematch}
                />
              </>
            )}
          </main>
        </div>
      </div>
    </section>
  );
}
