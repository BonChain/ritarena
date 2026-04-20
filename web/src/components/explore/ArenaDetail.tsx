"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Arena, AgentProfile, ArenaEntry } from "@ritarena/sdk";
import { getReader } from "@/lib/explorer/sdk-client";
import { getArenaWithCreator } from "@/lib/explorer/explorer-data";
import {
  arenaPrizePool,
  arenaStateKey,
  formatUsdc,
  shortPubkey,
  timeAgo,
} from "@/lib/explorer/format";
import { computeTrustTier } from "@/lib/explorer/trust-tier";
import { getGameMeta } from "@/lib/explorer/games-registry";
import TrustBadge from "./TrustBadge";
import StateChip from "./StateChip";
import CreatorMini from "./CreatorMini";
import ExploreEmpty from "./ExploreEmpty";

export default function ArenaDetail({ arenaId }: { arenaId: number }) {
  const [arena, setArena] = useState<Arena | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<AgentProfile | null>(
    null
  );
  const [entries, setEntries] = useState<ArenaEntry[] | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "missing" | "error">(
    "loading"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdByCreator, setCreatedByCreator] = useState<number | null>(null);

  // Initial load + entries fetch
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const initial = await getArenaWithCreator(arenaId);
        if (cancelled) return;
        if (!initial) {
          setStatus("missing");
          return;
        }
        setArena(initial.arena);
        setCreatorProfile(initial.creatorProfile);
        setStatus("ok");
        const reader = getReader();
        const e = await reader.getArenaEntries(arenaId);
        if (!cancelled) {
          setEntries(
            [...e].sort((a, b) => Number(b.score) - Number(a.score))
          );
        }
        // Background: how many arenas has this creator launched?
        try {
          const all = await reader.listArenas({ creator: initial.arena.creator });
          if (!cancelled) setCreatedByCreator(all.length);
        } catch {
          if (!cancelled) setCreatedByCreator(null);
        }
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
        setErrorMsg(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [arenaId]);

  // Real-time arena updates
  useEffect(() => {
    if (status !== "ok") return;
    const reader = getReader();
    const unsub = reader.watchArena(arenaId, (next) => {
      setArena(next);
    });
    return () => {
      unsub();
    };
  }, [arenaId, status]);

  if (status === "missing") notFound();

  if (status === "loading" || !arena) {
    return (
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div
            className="h-10 w-64 rounded mb-3 animate-pulse"
            style={{ background: "rgba(20, 241, 149, 0.06)" }}
          />
          <div
            className="h-5 w-96 rounded mb-12 animate-pulse"
            style={{ background: "rgba(255,255,255,0.04)" }}
          />
          <div className="grid md:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass-card h-28 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <ExploreEmpty
            title="Couldn't load this arena"
            body={errorMsg ?? "Unknown error talking to devnet."}
            action={
              <Link
                href="/explore"
                className="text-sm underline"
                style={{ color: "#14F195" }}
              >
                Back to Explorer
              </Link>
            }
          />
        </div>
      </section>
    );
  }

  const tier = computeTrustTier(arena, creatorProfile);
  const state = arenaStateKey(arena);
  const prizePool = arenaPrizePool(arena);
  const game = getGameMeta(arena.actionSchema);

  return (
    <section className="pt-32 pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/explore"
          className="text-sm"
          style={{
            color: "#888888",
            fontFamily: "var(--font-ui)",
          }}
        >
          &larr; Back to Explorer
        </Link>

        <div className="flex flex-wrap items-center gap-3 mt-4 mb-2">
          <h1
            className="text-3xl md:text-4xl tracking-tight"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
          >
            <span className="gradient-text">Arena #{Number(arena.id)}</span>
          </h1>
          <StateChip state={state} />
          <TrustBadge tier={tier} />
        </div>
        <div
          className="flex items-center gap-2 mt-1"
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
          <span
            style={{
              fontFamily: "var(--font-data)",
              color: "#55556a",
              fontSize: "0.75rem",
              marginLeft: "0.5rem",
            }}
          >
            {game.description}
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <div className="glass-card p-5">
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
                fontSize: "1.75rem",
                color: "#14F195",
              }}
            >
              {formatUsdc(prizePool)}
            </div>
            <div
              className="mt-2"
              style={{
                fontFamily: "var(--font-data)",
                fontSize: "0.7rem",
                color: "#888888",
              }}
            >
              Entry: {formatUsdc(arena.entryFee)}
            </div>
          </div>

          <div className="glass-card p-5">
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
                fontSize: "1.75rem",
                color: "#f0f0f0",
              }}
            >
              {arena.aliveAgents}
              <span style={{ color: "#55556a", fontWeight: 400 }}>
                {" / "}
                {arena.currentAgents}
                <span style={{ fontSize: "0.9rem" }}>
                  {" "}
                  (max {arena.maxAgents})
                </span>
              </span>
            </div>
            <div
              className="mt-2"
              style={{
                fontFamily: "var(--font-data)",
                fontSize: "0.7rem",
                color: "#888888",
              }}
            >
              Round {arena.currentRound}
            </div>
          </div>

          <div className="glass-card p-5">
            <div
              style={{
                fontFamily: "var(--font-data)",
                fontSize: "0.65rem",
                color: "#55556a",
                letterSpacing: "0.1em",
              }}
            >
              CREATOR BOND
            </div>
            <div
              style={{
                fontFamily: "var(--font-score)",
                fontWeight: 700,
                fontSize: "1.75rem",
                color: "#f0f0f0",
              }}
            >
              {formatUsdc(arena.stakeBondAmount)}
            </div>
            <div className="mt-2">
              <CreatorMini creator={arena.creator} profile={creatorProfile} />
            </div>
            {createdByCreator !== null && (
              <div
                className="mt-1"
                style={{
                  fontFamily: "var(--font-data)",
                  fontSize: "0.68rem",
                  color: "#55556a",
                }}
              >
                Created {createdByCreator} arena
                {createdByCreator === 1 ? "" : "s"} total
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-5 mt-6">
          <div
            className="mb-3"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "1.1rem",
            }}
          >
            Arena rules
          </div>
          <dl
            className="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-6"
            style={{ fontFamily: "var(--font-data)", fontSize: "0.78rem" }}
          >
            <div>
              <dt style={{ color: "#55556a" }}>Action schema</dt>
              <dd style={{ color: "#f0f0f0", wordBreak: "break-all" }}>
                {arena.actionSchema || "—"}
              </dd>
            </div>
            <div>
              <dt style={{ color: "#55556a" }}>Prize split</dt>
              <dd style={{ color: "#f0f0f0" }}>
                {arena.prizeSplit.join(" / ")}
              </dd>
            </div>
            <div>
              <dt style={{ color: "#55556a" }}>Creator fee</dt>
              <dd style={{ color: "#f0f0f0" }}>
                {(arena.creatorFeeBps / 100).toFixed(2)}%
              </dd>
            </div>
            <div>
              <dt style={{ color: "#55556a" }}>Elimination</dt>
              <dd style={{ color: "#f0f0f0" }}>
                {arena.eliminationPercent}% / round
              </dd>
            </div>
            <div>
              <dt style={{ color: "#55556a" }}>Started</dt>
              <dd style={{ color: "#f0f0f0" }}>{timeAgo(arena.startedAt)}</dd>
            </div>
            <div>
              <dt style={{ color: "#55556a" }}>Last submission</dt>
              <dd style={{ color: "#f0f0f0" }}>
                {timeAgo(arena.lastSubmissionAt)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-8">
          <h2
            className="mb-3"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "1.25rem",
            }}
          >
            Entries
          </h2>
          {entries === null && (
            <div className="glass-card h-32 animate-pulse" />
          )}
          {entries !== null && entries.length === 0 && (
            <ExploreEmpty
              title="No entries yet"
              body="Nobody has joined this arena."
            />
          )}
          {entries !== null && entries.length > 0 && (
            <div className="glass-card overflow-hidden">
              <table
                className="w-full"
                style={{
                  fontFamily: "var(--font-data)",
                  fontSize: "0.78rem",
                  color: "#f0f0f0",
                }}
              >
                <thead>
                  <tr style={{ color: "#55556a" }}>
                    <th className="text-left px-4 py-3">#</th>
                    <th className="text-left px-4 py-3">Owner</th>
                    <th className="text-right px-4 py-3">Score</th>
                    <th className="text-right px-4 py-3">Status</th>
                    <th className="text-right px-4 py-3">Prize rank</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => (
                    <tr
                      key={e.owner.toBase58()}
                      style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      <td className="px-4 py-3" style={{ color: "#55556a" }}>
                        {i + 1}
                      </td>
                      <td className="px-4 py-3">{shortPubkey(e.owner)}</td>
                      <td className="px-4 py-3 text-right">
                        {Number(e.score)}
                      </td>
                      <td
                        className="px-4 py-3 text-right"
                        style={{ color: e.alive ? "#14F195" : "#ff5577" }}
                      >
                        {e.alive ? "alive" : "out"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {e.prizeRank > 0 ? `#${e.prizeRank}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
