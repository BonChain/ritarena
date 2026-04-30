import { describe, it, expect } from "vitest";
import { counterPredictor } from "../../src/bots/counter-predictor";
import type { RoundHistory } from "../../src/bots/types";

describe("counter-predictor bot", () => {
  it("picks random in round 0", () => {
    const c = counterPredictor.pickChoice({ round: 0, history: [], selfIndex: 0, humanIndex: 1 });
    expect(["rock", "paper", "scissors"]).toContain(c);
  });

  it("picks paper when human has played rock 3x and paper 1x", () => {
    const history: RoundHistory[] = [
      { choices: ["rock", "rock", "scissors"], scores: [0, 0, 0] },
      { choices: ["rock", "rock", "scissors"], scores: [0, 0, 0] },
      { choices: ["rock", "rock", "scissors"], scores: [0, 0, 0] },
      { choices: ["paper", "paper", "scissors"], scores: [0, 0, 0] },
    ];
    // self is index 0, human is index 1. Human chose rock 3×, paper 1× → top is rock.
    // counter(rock) = paper.
    const c = counterPredictor.pickChoice({ round: 4, history, selfIndex: 0, humanIndex: 1 });
    expect(c).toBe("paper");
  });
});
