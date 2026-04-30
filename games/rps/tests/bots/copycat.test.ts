import { describe, it, expect } from "vitest";
import { copycat } from "../../src/bots/copycat";
import type { RoundHistory } from "../../src/bots/types";

describe("copycat bot", () => {
  it("picks a random valid choice in round 0", () => {
    const picks = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const c = copycat.pickChoice({ round: 0, history: [], selfIndex: 0, humanIndex: 1 });
      expect(["rock", "paper", "scissors"]).toContain(c);
      picks.add(c);
    }
    // Statistically very likely to see at least 2 distinct choices in 50 samples.
    expect(picks.size).toBeGreaterThanOrEqual(2);
  });

  it("copies human's round 0 choice in round 1", () => {
    const history: RoundHistory[] = [
      { choices: ["rock", "paper", "scissors"], scores: [1, 1, 1] },
    ];
    const c = copycat.pickChoice({ round: 1, history, selfIndex: 0, humanIndex: 1 });
    expect(c).toBe("paper");
  });

  it("falls back to random if no human in arena", () => {
    const c = copycat.pickChoice({ round: 1, history: [], selfIndex: 0, humanIndex: null });
    expect(["rock", "paper", "scissors"]).toContain(c);
  });
});
