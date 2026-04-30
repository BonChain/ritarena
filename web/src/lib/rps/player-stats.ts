"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicKey } from "@solana/web3.js";

/**
 * Per-pubkey RPS stats kept in localStorage. Stats follow the wallet — switching
 * wallets reads a different bucket so streaks don't bleed across identities.
 *
 * `bestScore` is the highest single-match total. With 5 opponents × 3 rounds,
 * the theoretical ceiling is 15 (uniquely countering all 5 bots three rounds
 * in a row); realistic personal bests sit around 9-12.
 */
export type PlayerStats = {
  currentStreak: number;
  bestStreak: number;
  bestScore: number;
  matchesPlayed: number;
  matchesWon: number;
};

export const ZERO_STATS: PlayerStats = {
  currentStreak: 0,
  bestStreak: 0,
  bestScore: 0,
  matchesPlayed: 0,
  matchesWon: 0,
};

function storageKey(pubkey: PublicKey): string {
  return `rps-stats-${pubkey.toBase58()}`;
}

function readStats(pubkey: PublicKey): PlayerStats {
  if (typeof window === "undefined") return ZERO_STATS;
  const raw = window.localStorage.getItem(storageKey(pubkey));
  if (!raw) return ZERO_STATS;
  try {
    const parsed = JSON.parse(raw) as Partial<PlayerStats>;
    return { ...ZERO_STATS, ...parsed };
  } catch {
    return ZERO_STATS;
  }
}

function writeStats(pubkey: PublicKey, stats: PlayerStats): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(pubkey), JSON.stringify(stats));
}

export function usePlayerStats(pubkey: PublicKey | null) {
  const [stats, setStats] = useState<PlayerStats>(ZERO_STATS);
  // Idempotency guard: each arenaId records at most once, even under StrictMode
  // double-mount or repeated effect fires.
  const recordedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!pubkey) {
      setStats(ZERO_STATS);
      return;
    }
    setStats(readStats(pubkey));
  }, [pubkey]);

  function record(arenaId: string, result: { rank: number; score: number }): PlayerStats {
    if (!pubkey) return stats;
    if (recordedRef.current.has(arenaId)) return stats;
    recordedRef.current.add(arenaId);

    const won = result.rank === 1;
    const nextStreak = won ? stats.currentStreak + 1 : 0;
    const next: PlayerStats = {
      matchesPlayed: stats.matchesPlayed + 1,
      matchesWon: stats.matchesWon + (won ? 1 : 0),
      currentStreak: nextStreak,
      bestStreak: Math.max(stats.bestStreak, nextStreak),
      bestScore: Math.max(stats.bestScore, result.score),
    };
    writeStats(pubkey, next);
    setStats(next);
    return next;
  }

  return { stats, record };
}
