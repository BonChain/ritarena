import { describe, it, expect } from "vitest";
import { rockHead } from "../../src/bots/rock-head";

describe("rock-head bot", () => {
  it("picks rock ~50% over 5000 samples", () => {
    let rocks = 0;
    for (let i = 0; i < 5000; i++) {
      if (rockHead.pickChoice({ round: 0, history: [], selfIndex: 0, humanIndex: 1 }) === "rock") {
        rocks += 1;
      }
    }
    const rate = rocks / 5000;
    expect(rate).toBeGreaterThan(0.45);
    expect(rate).toBeLessThan(0.55);
  });
});
