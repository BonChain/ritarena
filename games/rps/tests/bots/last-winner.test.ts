import { describe, it, expect } from "vitest";
import { lastWinner } from "../../src/bots/last-winner";
import type { RoundHistory } from "../../src/bots/types";

describe("last-winner bot", () => {
  it("picks random in round 0", () => {
    const c = lastWinner.pickChoice({ round: 0, history: [], selfIndex: 0, humanIndex: 1 });
    expect(["rock", "paper", "scissors"]).toContain(c);
  });

  it("picks the choice with highest total score in round 1", () => {
    // Previous round: [rock, paper, scissors] with scores [0, 1, 0]
    // paper had highest total (1), so bot picks paper.
    const history: RoundHistory[] = [
      { choices: ["rock", "paper", "scissors"], scores: [0, 1, 0] },
    ];
    const c = lastWinner.pickChoice({ round: 1, history, selfIndex: 0, humanIndex: 1 });
    expect(c).toBe("paper");
  });
});
