"use client";

import type { Connection } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import { RitArena } from "@ritarena/sdk";

const RPS_SERVER = process.env.NEXT_PUBLIC_RPS_HTTP ?? "http://localhost:3001";

export type CreateAndEnterStep = "creating" | "entering";

type WalletLike = {
  publicKey: PublicKey;
  // The anchor-shaped sign methods. Casting at the call site mirrors the rest
  // of the codebase — typing here is intentionally loose to match.
  signTransaction: unknown;
  signAllTransactions: unknown;
};

/**
 * POST /arenas to the game server, then sign the human's enter_arena tx.
 *
 * Used by both the lobby's first-Play flow and the match page's instant
 * rematch flow. Returns the new arenaId; the caller is responsible for
 * navigation.
 *
 * Idempotency: if the entry tx has already been processed (e.g. retry within
 * the recent-blockhash dedup window), this resolves successfully — the entry
 * is on-chain and the caller can proceed.
 */
export async function createAndEnterArena({
  connection,
  wallet,
  onStep,
}: {
  connection: Connection;
  wallet: WalletLike;
  onStep?: (step: CreateAndEnterStep) => void;
}): Promise<{ arenaId: string }> {
  onStep?.("creating");
  const res = await fetch(`${RPS_SERVER}/arenas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ humanPubkey: wallet.publicKey.toBase58() }),
  });
  if (!res.ok) throw new Error(await res.text());
  const { arenaId } = (await res.json()) as { arenaId: string };

  onStep?.("entering");
  const sdk = new RitArena(connection, wallet as never);
  try {
    await sdk.enterArena(Number(arenaId));
  } catch (err) {
    const msg = String(err);
    if (!msg.includes("already been processed")) throw err;
  }

  return { arenaId };
}
