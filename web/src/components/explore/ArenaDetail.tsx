"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Arena, AgentProfile, ArenaEntry } from "@ritarena/sdk";
import { pdas } from "@ritarena/sdk";
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
import { getArenaReplay } from "@/lib/explorer/arena-replays";
import YouTubeEmbed from "@/components/YouTubeEmbed";

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
  const replayVideoId = getArenaReplay(arenaId);

  return (
    <section className="pt-32 pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Link
            href="/explore"
            className="text-base"
            style={{
              color: "#a0a0a0",
              fontFamily: "var(--font-ui)",
            }}
          >
            &larr; Back to Explorer
          </Link>
          <a
            href={`https://explorer.solana.com/address/${pdas
              .arena(arenaId)
              .toBase58()}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base"
            style={{
              color: "#14F195",
              fontFamily: "var(--font-ui)",
              fontWeight: 700,
            }}
          >
            View on Solana Explorer ↗
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-6 mb-3">
          <h1
            className="text-4xl md:text-5xl tracking-tight"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
          >
            <span className="gradient-text">Arena #{Number(arena.id)}</span>
          </h1>
          <StateChip state={state} />
          <TrustBadge tier={tier} />
        </div>
        <div
          className="flex flex-wrap items-baseline gap-3 mt-2"
          title={game.description}
        >
          <span style={{ fontSize: "1.8rem", lineHeight: 1 }}>{game.icon}</span>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "1.6rem",
              color: game.color,
            }}
          >
            {game.name}
          </span>
          <span
            style={{
              fontFamily: "var(--font-body)",
              color: "#a0a0a0",
              fontSize: "0.95rem",
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
                fontSize: "0.85rem",
                color: "#a0a0a0",
                letterSpacing: "0.1em",
              }}
            >
              PRIZE POOL
            </div>
            <div
              style={{
                fontFamily: "var(--font-score)",
                fontWeight: 700,
                fontSize: "2.25rem",
                color: "#14F195",
              }}
            >
              {formatUsdc(prizePool)}
            </div>
            <div
              className="mt-2"
              style={{
                fontFamily: "var(--font-data)",
                fontSize: "0.95rem",
                color: "#c0c0c0",
              }}
            >
              Entry: {formatUsdc(arena.entryFee)}
            </div>
          </div>

          <div className="glass-card p-5">
            <div
              style={{
                fontFamily: "var(--font-data)",
                fontSize: "0.85rem",
                color: "#a0a0a0",
                letterSpacing: "0.1em",
              }}
            >
              AGENTS
            </div>
            <div
              style={{
                fontFamily: "var(--font-score)",
                fontWeight: 700,
                fontSize: "2.25rem",
                color: "#f0f0f0",
              }}
            >
              {arena.aliveAgents}
              <span style={{ color: "#a0a0a0", fontWeight: 400 }}>
                {" / "}
                {arena.currentAgents}
                <span style={{ fontSize: "1.1rem" }}>
                  {" "}
                  (max {arena.maxAgents})
                </span>
              </span>
            </div>
            <div
              className="mt-2"
              style={{
                fontFamily: "var(--font-data)",
                fontSize: "0.95rem",
                color: "#c0c0c0",
              }}
            >
              Round {arena.currentRound}
            </div>
          </div>

          <div className="glass-card p-5">
            <div
              style={{
                fontFamily: "var(--font-data)",
                fontSize: "0.85rem",
                color: "#a0a0a0",
                letterSpacing: "0.1em",
              }}
            >
              CREATOR BOND
            </div>
            <div
              style={{
                fontFamily: "var(--font-score)",
                fontWeight: 700,
                fontSize: "2.25rem",
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
                  fontSize: "0.85rem",
                  color: "#a0a0a0",
                }}
              >
                Created {createdByCreator} arena
                {createdByCreator === 1 ? "" : "s"} total
              </div>
            )}
          </div>
        </div>

        {replayVideoId && (
          <div className="glass-card p-5 mt-6">
            <div
              className="mb-4"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "1.4rem",
              }}
            >
              Replay
            </div>
            <YouTubeEmbed
              videoId={replayVideoId}
              title={`Arena #${arenaId} replay`}
            />
            <a
              href="https://github.com/BonChain/ritarena/tree/main/games/snake"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-sm transition-colors"
              style={{
                color: "#a0a0a0",
                fontFamily: "var(--font-data)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#14F195")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#a0a0a0")}
            >
              Source code: BonChain/ritarena/games/snake &#8599;
            </a>
          </div>
        )}

        <div className="glass-card p-5 mt-6">
          <div
            className="mb-4"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "1.4rem",
            }}
          >
            Arena rules
          </div>
          <dl
            className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6"
            style={{ fontFamily: "var(--font-data)", fontSize: "0.95rem" }}
          >
            <div>
              <dt style={{ color: "#a0a0a0", fontSize: "0.8rem", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.25rem" }}>Action schema</dt>
              <dd style={{ color: "#f0f0f0", wordBreak: "break-all" }}>
                {arena.actionSchema || "—"}
              </dd>
            </div>
            <div>
              <dt style={{ color: "#a0a0a0", fontSize: "0.8rem", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.25rem" }}>Prize split</dt>
              <dd style={{ color: "#f0f0f0" }}>
                {arena.prizeSplit.join(" / ")}
              </dd>
            </div>
            <div>
              <dt style={{ color: "#a0a0a0", fontSize: "0.8rem", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.25rem" }}>Creator fee</dt>
              <dd style={{ color: "#f0f0f0" }}>
                {(arena.creatorFeeBps / 100).toFixed(2)}%
              </dd>
            </div>
            <div>
              <dt style={{ color: "#a0a0a0", fontSize: "0.8rem", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.25rem" }}>Elimination</dt>
              <dd style={{ color: "#f0f0f0" }}>
                {arena.eliminationPercent}% / round
              </dd>
            </div>
            <div>
              <dt style={{ color: "#a0a0a0", fontSize: "0.8rem", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.25rem" }}>Started</dt>
              <dd style={{ color: "#f0f0f0" }}>{timeAgo(arena.startedAt)}</dd>
            </div>
            <div>
              <dt style={{ color: "#a0a0a0", fontSize: "0.8rem", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.25rem" }}>Last submission</dt>
              <dd style={{ color: "#f0f0f0" }}>
                {timeAgo(arena.lastSubmissionAt)}
              </dd>
            </div>
            <div className="col-span-2 md:col-span-4">
              <dt style={{ color: "#a0a0a0", fontSize: "0.8rem", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.25rem" }}>Rules hash</dt>
              <dd
                style={{
                  color: "#c0c0c0",
                  fontSize: "0.85rem",
                  wordBreak: "break-all",
                }}
              >
                {Array.from(arena.rulesHash as ArrayLike<number>)
                  .map((b) => b.toString(16).padStart(2, "0"))
                  .join("")}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-8">
          <h2
            className="mb-4"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "1.6rem",
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
                  fontSize: "0.95rem",
                  color: "#f0f0f0",
                }}
              >
                <thead>
                  <tr
                    style={{
                      color: "#a0a0a0",
                      fontSize: "0.8rem",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    <th className="text-left px-4 py-4">#</th>
                    <th className="text-left px-4 py-4">Owner</th>
                    <th className="text-right px-4 py-4">Score</th>
                    <th className="text-right px-4 py-4">Status</th>
                    <th className="text-right px-4 py-4">Prize rank</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => (
                    <tr
                      key={e.owner.toBase58()}
                      style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      <td className="px-4 py-4" style={{ color: "#a0a0a0" }}>
                        {i + 1}
                      </td>
                      <td className="px-4 py-4">
                        <a
                          href={`https://explorer.solana.com/address/${e.owner.toBase58()}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#f0f0f0" }}
                          onMouseEnter={(ev) =>
                            (ev.currentTarget.style.color = "#14F195")
                          }
                          onMouseLeave={(ev) =>
                            (ev.currentTarget.style.color = "#f0f0f0")
                          }
                        >
                          {shortPubkey(e.owner)} ↗
                        </a>
                      </td>
                      <td className="px-4 py-4 text-right">
                        {Number(e.score)}
                      </td>
                      <td
                        className="px-4 py-4 text-right"
                        style={{ color: e.alive ? "#14F195" : "#ff5577" }}
                      >
                        {e.alive ? "alive" : "out"}
                      </td>
                      <td className="px-4 py-4 text-right">
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
