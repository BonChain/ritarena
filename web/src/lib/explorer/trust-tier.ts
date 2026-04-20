// trust-tier.ts
import type { Arena, AgentProfile } from "@ritarena/sdk";

export type TrustTier = "green" | "yellow" | "red";

/**
 * Computes the explorer trust tier for an arena.
 *
 * Locked formula (descoped from spec TT-1/TT-2/TT-3 — disputes counter
 * does not exist on-chain yet):
 *   green  = bond > 0 AND creator.arenasCompleted >= 3
 *   yellow = bond > 0 (any other case, incl. profile fetch failure)
 *   red    = bond == 0
 *
 * If the creator profile fetch failed (null) AND bond > 0, we still return
 * yellow because the bond itself is on-chain and verifiable. If bond is 0,
 * we always return red regardless of profile state.
 */
export function computeTrustTier(
  arena: Arena,
  creatorProfile: AgentProfile | null
): TrustTier {
  const bond = BigInt(arena.stakeBondAmount.toString());
  if (bond === BigInt(0)) return "red";
  if (creatorProfile == null) return "yellow";
  const completed = Number(creatorProfile.arenasCompleted);
  return completed >= 3 ? "green" : "yellow";
}
