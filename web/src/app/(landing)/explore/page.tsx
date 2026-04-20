"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ArenaFilter } from "@ritarena/sdk";
import {
  listArenasWithCreators,
  type ArenaWithCreator,
} from "@/lib/explorer/explorer-data";
import ArenaCard from "@/components/explore/ArenaCard";
import StateFilter, {
  type StateFilterValue,
} from "@/components/explore/StateFilter";
import ExploreEmpty from "@/components/explore/ExploreEmpty";
import { arenaPrizePool, arenaStateKey, formatUsdc } from "@/lib/explorer/format";

const POLL_MS = 10_000;
const PAGE_SIZE = 12;

export default function ExplorePage() {
  const [items, setItems] = useState<ArenaWithCreator[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StateFilterValue>("all");
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE);
  const inFlight = useRef(false);

  // Reset pagination when the user changes the filter so they always see
  // the freshest top-of-list rather than scroll-position deep in stale data.
  useEffect(() => {
    setDisplayLimit(PAGE_SIZE);
  }, [filter]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (inFlight.current) return;
      inFlight.current = true;
      try {
        const sdkFilter: ArenaFilter | undefined =
          filter === "all" ? undefined : { state: filter };
        const next = await listArenasWithCreators(sdkFilter);
        if (!cancelled) {
          setItems(next);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load arenas");
          setItems((prev) => prev ?? []);
        }
      } finally {
        inFlight.current = false;
      }
    }

    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [filter]);

  const visible = useMemo(() => {
    if (!items) return null;
    if (filter === "all") return items;
    return items.filter((x) => arenaStateKey(x.arena) === filter);
  }, [items, filter]);

  const stats = useMemo(() => {
    if (!items) return null;
    let live = 0;
    let totalPaid = BigInt(0);
    for (const { arena } of items) {
      const state = arenaStateKey(arena);
      if (state === "registration" || state === "active" || state === "eliminating") {
        live += 1;
      }
      if (state === "finished") {
        totalPaid += arenaPrizePool(arena);
      }
    }
    return { live, total: items.length, totalPaid };
  }, [items]);

  return (
    <section className="pt-32 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-6">
          <div>
            <h1
              className="text-4xl md:text-5xl tracking-tight mb-2"
              style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
            >
              <span className="gradient-text">Arena Explorer</span>
            </h1>
            <p className="text-lg" style={{ color: "#a0a0a0" }}>
              Browse live and finished arenas on devnet. Auto-refreshes every
              10 seconds.
            </p>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Live now", value: String(stats.live), color: "#14F195" },
              { label: "Total arenas", value: String(stats.total), color: "#f0f0f0" },
              {
                label: "Prize paid",
                value: formatUsdc(stats.totalPaid),
                color: "#9945FF",
              },
            ].map((s) => (
              <div key={s.label} className="glass-card p-5">
                <div
                  style={{
                    fontFamily: "var(--font-data)",
                    fontSize: "0.85rem",
                    color: "#a0a0a0",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {s.label}
                </div>
                <div
                  className="mt-1"
                  style={{
                    fontFamily: "var(--font-score)",
                    fontWeight: 700,
                    fontSize: "2rem",
                    color: s.color,
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mb-6">
          <StateFilter value={filter} onChange={setFilter} />
        </div>

        {visible === null && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="glass-card h-48 animate-pulse" />
            ))}
          </div>
        )}

        {visible !== null && visible.length === 0 && !error && (
          <ExploreEmpty
            title="No arenas to show"
            body={
              filter === "all"
                ? "There are no arenas on devnet yet. Check back soon."
                : `No arenas in "${filter}" state right now.`
            }
          />
        )}

        {visible !== null && visible.length > 0 && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {visible.slice(0, displayLimit).map((x) => (
                <ArenaCard
                  key={Number(x.arena.id)}
                  arena={x.arena}
                  creatorProfile={x.creatorProfile}
                />
              ))}
            </div>
            <div
              className="mt-8 flex flex-col items-center gap-3"
              style={{ fontFamily: "var(--font-data)" }}
            >
              <div style={{ color: "#a0a0a0", fontSize: "0.9rem" }}>
                Showing {Math.min(displayLimit, visible.length)} of{" "}
                {visible.length}
              </div>
              {displayLimit < visible.length && (
                <button
                  type="button"
                  onClick={() => setDisplayLimit((n) => n + PAGE_SIZE)}
                  className="px-6 py-3 rounded-lg transition-all"
                  style={{
                    background: "rgba(20, 241, 149, 0.08)",
                    border: "1px solid rgba(20, 241, 149, 0.4)",
                    color: "#14F195",
                    fontFamily: "var(--font-ui)",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    letterSpacing: "0.04em",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(20, 241, 149, 0.16)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(20, 241, 149, 0.08)")
                  }
                >
                  Load {Math.min(PAGE_SIZE, visible.length - displayLimit)} more
                </button>
              )}
            </div>
          </>
        )}

        {error && (
          <div
            className="mt-6 text-center"
            style={{
              fontFamily: "var(--font-data)",
              color: "#ff5577",
              fontSize: "0.75rem",
            }}
          >
            Last refresh failed: {error}
          </div>
        )}
      </div>
    </section>
  );
}
