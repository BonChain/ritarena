import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LogWriter } from "../src/log-writer";

describe("LogWriter", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "rps-log-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("writes the round tx signature into every JSONL row", async () => {
    const writer = new LogWriter(dir);
    const tx = "5xK9wQbZJ8vGq2pT3rN7sM4aH1uL6yD2cF8eW9oP1nB7aX4zV5kR3sQ6tY8mU2cJ";

    await writer.appendRound(
      "42",
      0,
      ["pk-a", "pk-b"],
      ["rock", "paper"],
      [0, 1],
      tx
    );

    const content = await readFile(join(dir, "42.jsonl"), "utf-8");
    const rows = content.trim().split("\n").map((l) => JSON.parse(l));

    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.tx).toBe(tx);
    }
  });
});
