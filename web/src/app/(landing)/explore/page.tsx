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
import { arenaStateKey } from "@/lib/explorer/format";

const POLL_MS = 10_000;

export default function ExplorePage() {
  const [items, setItems] = useState<ArenaWithCreator[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StateFilterValue>("all");
  const inFlight = useRef(false);

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

  return (
    <section className="pt-32 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visible.map((x) => (
              <ArenaCard
                key={Number(x.arena.id)}
                arena={x.arena}
                creatorProfile={x.creatorProfile}
              />
            ))}
          </div>
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
