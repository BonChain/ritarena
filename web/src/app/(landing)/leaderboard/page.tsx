// TODO: Add player + bot tabs once sdk.reader.listProfiles() ships.
// Planned data shape in docs/superpowers/plans/2026-04-21-arena-2-rps.md Task 10.

"use client";

import Leaderboard from "@/components/Leaderboard";
import { useState } from "react";

export default function LeaderboardPage() {
  const [tab, setTab] = useState<"players" | "bots">("players");

  return (
    <section className="pt-32 pb-16 px-6 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1
          className="text-4xl md:text-5xl tracking-tight mb-8"
          style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
        >
          Leaderboard
        </h1>

        <Leaderboard rows={[]} tab={tab} onTabChange={setTab} />
      </div>
    </section>
  );
}
