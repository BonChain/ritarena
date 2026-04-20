import type { Arena } from "@ritarena/sdk";
import { PublicKey } from "@solana/web3.js";

/** USDC lamports (BN/bigint/number) → "12.50 USDC" */
export function formatUsdc(lamports: { toString(): string }): string {
  const n = Number(BigInt(lamports.toString())) / 1e6;
  return `${n.toLocaleString(undefined, {
    minimumFractionDigits: n < 10 ? 2 : 0,
    maximumFractionDigits: 2,
  })} USDC`;
}

/** Truncate a base58 pubkey: "AbCd…WxYz" */
export function shortPubkey(pk: PublicKey | string): string {
  const s = typeof pk === "string" ? pk : pk.toBase58();
  if (s.length <= 10) return s;
  return `${s.slice(0, 4)}\u2026${s.slice(-4)}`;
}

/** Get the arena state key as a string ("registration" | "active" | ...) */
export function arenaStateKey(arena: Arena): string {
  return Object.keys(arena.state)[0] ?? "unknown";
}

/** Total prize pool = entryFees + sponsorDeposit (both in lamports). */
export function arenaPrizePool(arena: Arena): bigint {
  return (
    BigInt(arena.totalEntryFees.toString()) +
    BigInt(arena.sponsorDeposit.toString())
  );
}

/** Unix seconds → "3m ago" / "2h ago" / "5d ago". */
export function timeAgo(unixSeconds: { toString(): string }): string {
  const then = Number(BigInt(unixSeconds.toString())) * 1000;
  if (!then) return "—";
  const diff = Date.now() - then;
  if (diff < 0) return "just now";
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}
