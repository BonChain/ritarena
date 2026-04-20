"use client";

import Link from "next/link";
import type { Arena, AgentProfile } from "@ritarena/sdk";
import {
  arenaPrizePool,
  arenaStateKey,
  formatUsdc,
} from "@/lib/explorer/format";
import { computeTrustTier } from "@/lib/explorer/trust-tier";
import { getGameMeta } from "@/lib/explorer/games-registry";
import TrustBadge from "./TrustBadge";
import StateChip from "./StateChip";
import CreatorMini from "./CreatorMini";

export default function ArenaCard({
  arena,
  creatorProfile,
}: {
  arena: Arena;
  creatorProfile: AgentProfile | null;
}) {
  const tier = computeTrustTier(arena, creatorProfile);
  const state = arenaStateKey(arena);
  const id = Number(arena.id);
  const prizePool = arenaPrizePool(arena);
  const game = getGameMeta(arena.actionSchema);

  return (
    <Link
      href={`/explore/${id}`}
      className="glass-card block p-5 transition-transform"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            style={{
              fontFamily: "var(--font-data)",
              color: "#55556a",
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
            }}
          >
            ARENA #{id}
          </span>
          <StateChip state={state} />
        </div>
        <TrustBadge tier={tier} size="sm" />
      </div>

      <div
        className="flex items-center gap-2 mb-3"
        title={game.description}
      >
        <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>{game.icon}</span>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "1rem",
            color: game.color,
          }}
        >
          {game.name}
        </span>
      </div>

      <div className="flex items-baseline gap-3 mb-3">
        <div>
          <div
            style={{
              fontFamily: "var(--font-data)",
              fontSize: "0.65rem",
              color: "#55556a",
              letterSpacing: "0.1em",
            }}
          >
            PRIZE POOL
          </div>
          <div
            style={{
              fontFamily: "var(--font-score)",
              fontWeight: 700,
              fontSize: "1.5rem",
              color: "#14F195",
            }}
          >
            {formatUsdc(prizePool)}
          </div>
        </div>
        <div className="ml-auto text-right">
          <div
            style={{
              fontFamily: "var(--font-data)",
              fontSize: "0.65rem",
              color: "#55556a",
              letterSpacing: "0.1em",
            }}
          >
            AGENTS
          </div>
          <div
            style={{
              fontFamily: "var(--font-score)",
              fontWeight: 700,
              fontSize: "1.25rem",
              color: "#f0f0f0",
            }}
          >
            {arena.aliveAgents}
            <span style={{ color: "#55556a", fontWeight: 400 }}>
              {" / "}
              {arena.currentAgents}
            </span>
          </div>
        </div>
      </div>

      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <CreatorMini creator={arena.creator} profile={creatorProfile} />
        <span
          style={{
            fontFamily: "var(--font-data)",
            color: "#55556a",
            fontSize: "0.7rem",
          }}
        >
          {formatUsdc(arena.entryFee)} entry
        </span>
      </div>
    </Link>
  );
}
