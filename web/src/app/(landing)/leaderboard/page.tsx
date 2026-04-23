"use client";

import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { RitArena, type AgentProfile } from "@ritarena/sdk";
import Leaderboard, { type LeaderboardRow } from "@/components/Leaderboard";

const BOT_NAMES = new Set([
  "@copycat",
  "@counter-predictor",
  "@chaos",
  "@last-winner",
  "@rock-head",
]);

function toRow(p: AgentProfile): Omit<LeaderboardRow, "rank"> & { isBot: boolean } {
  const completed = Number(p.arenasCompleted);
  const wins = Number(p.wins);
  const losses = Math.max(0, completed - wins);
  const winRate = completed > 0 ? (wins / completed) * 100 : 0;
  const earnings = Number(p.totalEarnings) / 1_000_000;
  const isBot = BOT_NAMES.has(p.name);
  const displayName = isBot
    ? p.name
    : p.name ||
      `${p.owner.toBase58().slice(0, 6)}…${p.owner.toBase58().slice(-4)}`;
  return {
    name: displayName,
    wins,
    losses,
    winRate,
    earnings,
    isBot,
  };
}

export default function LeaderboardPage() {
  const { connection } = useConnection();
  const [tab, setTab] = useState<"players" | "bots">("players");
  const [allRows, setAllRows] = useState<
    ReadonlyArray<Omit<LeaderboardRow, "rank"> & { isBot: boolean }> | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const reader = RitArena.readOnly(connection);
        const profiles = await reader.listProfiles();
        if (cancelled) return;
        const mapped = profiles
          .filter((p) => Number(p.arenasCompleted) > 0)
          .map(toRow);
        setAllRows(mapped);
      } catch (err) {
        if (!cancelled) setError(String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connection]);

  const rows: LeaderboardRow[] = (() => {
    if (!allRows) return [];
    const filtered = allRows.filter((r) => (tab === "bots" ? r.isBot : !r.isBot));
    const sorted = [...filtered].sort(
      (a, b) => b.wins - a.wins || b.winRate - a.winRate
    );
    const limit = tab === "players" ? 100 : Infinity;
    return sorted.slice(0, limit).map((r, i) => ({ ...r, rank: i + 1 }));
  })();

  return (
    <section className="pt-32 pb-16 px-6 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1
          className="text-4xl md:text-5xl tracking-tight mb-8"
          style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
        >
          Leaderboard
        </h1>

        {error && (
          <div
            className="glass-card p-6 mb-6"
            style={{ color: "#ff5577", fontFamily: "var(--font-data)" }}
          >
            Couldn&apos;t load profiles: {error}
          </div>
        )}

        {allRows === null && !error && (
          <div className="glass-card h-64 animate-pulse" />
        )}

        {allRows !== null && (
          <Leaderboard rows={rows} tab={tab} onTabChange={setTab} />
        )}
      </div>
    </section>
  );
}
