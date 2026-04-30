import { describe, it, expect } from "vitest";
import { resolveRound, type RoundInput } from "../src/round-resolver";

describe("resolveRound", () => {
  it("produces scores aligned with input pubkeys and preserves order", () => {
    const input: RoundInput = {
      pubkeys: ["a", "b", "c"],
      choices: ["rock", "scissors", "paper"],
    };
    const result = resolveRound(input);
    expect(result.scores).toEqual([1, 1, 1]);
    expect(result.pubkeys).toEqual(["a", "b", "c"]);
  });

  it("throws when pubkey count does not match choice count", () => {
    expect(() =>
      resolveRound({ pubkeys: ["a", "b"], choices: ["rock"] })
    ).toThrow();
  });
});
