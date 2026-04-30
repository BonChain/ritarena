import { describe, it, expect } from "vitest";
import { resolveRpsRound, type RpsChoice } from "../src/rps";

describe("resolveRpsRound", () => {
  it("scores a 3-player round where rock, scissors, paper all tie", () => {
    const choices: RpsChoice[] = ["rock", "scissors", "paper"];
    expect(resolveRpsRound(choices)).toEqual([1, 1, 1]);
  });

  it("scores an all-rock game as zeros (no wins)", () => {
    expect(resolveRpsRound(["rock", "rock", "rock"])).toEqual([0, 0, 0]);
  });

  it("scores rock vs two scissors: rock gets 2 wins", () => {
    expect(resolveRpsRound(["rock", "scissors", "scissors"])).toEqual([2, 0, 0]);
  });

  it("handles 6 players (typical arena size)", () => {
    expect(resolveRpsRound(["rock", "rock", "rock", "paper", "paper", "scissors"]))
      .toEqual([1, 1, 1, 3, 3, 2]);
  });

  it("every 2-player outcome has score sum ≤ 1", () => {
    const choices: RpsChoice[] = ["rock", "paper", "scissors"];
    for (const a of choices) {
      for (const b of choices) {
        const [sa, sb] = resolveRpsRound([a, b]);
        expect(sa + sb).toBeLessThanOrEqual(1);
      }
    }
  });
});
