import { describe, it, expect } from "vitest";
import { chaos } from "../../src/bots/chaos";

describe("chaos bot", () => {
  it("distributes roughly uniformly over 3000 samples", () => {
    const counts = { rock: 0, paper: 0, scissors: 0 };
    for (let i = 0; i < 3000; i++) {
      counts[chaos.pickChoice({ round: 0, history: [], selfIndex: 0, humanIndex: 1 })] += 1;
    }
    // Expected ~1000 each. Allow ±150 (very loose — this is a smoke test).
    expect(counts.rock).toBeGreaterThan(850);
    expect(counts.rock).toBeLessThan(1150);
    expect(counts.paper).toBeGreaterThan(850);
    expect(counts.paper).toBeLessThan(1150);
    expect(counts.scissors).toBeGreaterThan(850);
    expect(counts.scissors).toBeLessThan(1150);
  });
});
