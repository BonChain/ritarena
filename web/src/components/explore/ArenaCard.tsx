"use client";

import Link from "next/link";
import type { Arena, AgentProfile } from "@ritarena/sdk";
import { pdas } from "@ritarena/sdk";
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
  const arenaPda = pdas.arena(id).toBase58();

  return (
    <div className="glass-card p-5 transition-transform flex flex-col">
      {/* Top: clickable area → /explore/[id] */}
      <Link href={`/explore/${id}`} className="block">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              style={{
                fontFamily: "var(--font-data)",
                color: "#a0a0a0",
                fontSize: "0.85rem",
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
          className="flex items-center gap-2 mb-4"
          title={game.description}
        >
          <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>{game.icon}</span>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "1.25rem",
              color: game.color,
            }}
          >
            {game.name}
          </span>
        </div>

        <div className="flex items-baseline gap-3 mb-4">
          <div>
            <div
              style={{
                fontFamily: "var(--font-data)",
                fontSize: "0.8rem",
                color: "#a0a0a0",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Prize pool
            </div>
            <div
              style={{
                fontFamily: "var(--font-score)",
                fontWeight: 700,
                fontSize: "1.85rem",
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
                fontSize: "0.8rem",
                color: "#a0a0a0",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Agents
            </div>
            <div
              style={{
                fontFamily: "var(--font-score)",
                fontWeight: 700,
                fontSize: "1.5rem",
                color: "#f0f0f0",
              }}
            >
              {arena.aliveAgents}
              <span style={{ color: "#a0a0a0", fontWeight: 400 }}>
                {" / "}
                {arena.currentAgents}
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Footer: creator + entry (own anchors, kept outside the Link) */}
      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <CreatorMini creator={arena.creator} profile={creatorProfile} />
        <span
          style={{
            fontFamily: "var(--font-data)",
            color: "#c0c0c0",
            fontSize: "0.95rem",
          }}
        >
          {formatUsdc(arena.entryFee)} entry
        </span>
      </div>

      {/* On-chain verification link */}
      <a
        href={`https://explorer.solana.com/address/${arenaPda}?cluster=devnet`}
        target="_blank"
        rel="noopener noreferrer"
        className="block mt-3 text-center"
        style={{
          fontFamily: "var(--font-data)",
          color: "#888888",
          fontSize: "0.85rem",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#14F195")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#888888")}
      >
        View on Solana Explorer ↗
      </a>
    </div>
  );
}
