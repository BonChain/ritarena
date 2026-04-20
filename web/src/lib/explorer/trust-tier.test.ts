// trust-tier.test.ts
import { describe, it, expect } from "vitest";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import type { Arena, AgentProfile } from "@ritarena/sdk";
import { computeTrustTier } from "./trust-tier";

function makeArena(stakeBondAmount: bigint): Arena {
  return {
    stakeBondAmount: new BN(stakeBondAmount.toString()),
    creator: PublicKey.default,
  } as unknown as Arena;
}

function makeProfile(arenasCompleted: number): AgentProfile {
  return {
    arenasCompleted: new BN(arenasCompleted),
  } as unknown as AgentProfile;
}

describe("computeTrustTier", () => {
  it("returns green when bond > 0 and creator has >= 3 completed arenas", () => {
    expect(computeTrustTier(makeArena(1n), makeProfile(3))).toBe("green");
    expect(computeTrustTier(makeArena(1_000_000n), makeProfile(99))).toBe(
      "green"
    );
  });

  it("returns yellow when bond > 0 but creator has < 3 completed arenas", () => {
    expect(computeTrustTier(makeArena(1n), makeProfile(0))).toBe("yellow");
    expect(computeTrustTier(makeArena(1n), makeProfile(2))).toBe("yellow");
  });

  it("returns yellow when bond > 0 and creator profile fetch failed", () => {
    expect(computeTrustTier(makeArena(1n), null)).toBe("yellow");
  });

  it("returns red when bond is 0 regardless of creator history", () => {
    expect(computeTrustTier(makeArena(0n), makeProfile(99))).toBe("red");
    expect(computeTrustTier(makeArena(0n), null)).toBe("red");
  });
});
