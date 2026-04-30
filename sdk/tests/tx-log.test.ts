import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TxLog } from "../src/tx-log";

describe("TxLog", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "tx-log-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("append() writes a JSONL row and computes explorerUrl + ts", async () => {
    const log = new TxLog({ dir });
    const sig = "5xK9wQbZJ8vGq2pT3rN7sM4aH1uL6yD2cF8eW9oP1nB7aX4zV5kR3sQ6tY8mU2cJ";

    const before = Date.now();
    const entry = await log.append({ arenaId: 7, kind: "create", tx: sig });
    const after = Date.now();

    expect(entry.tx).toBe(sig);
    expect(entry.kind).toBe("create");
    expect(entry.arenaId).toBe(7);
    expect(entry.explorerUrl).toBe(
      `https://explorer.solana.com/tx/${sig}?cluster=devnet`
    );
    expect(entry.ts).toBeGreaterThanOrEqual(before);
    expect(entry.ts).toBeLessThanOrEqual(after);

    const raw = await readFile(join(dir, "7.jsonl"), "utf-8");
    const rows = raw.trim().split("\n").map((l) => JSON.parse(l));
    expect(rows).toEqual([entry]);
  });

  it("respects cluster option for explorer URL", async () => {
    const log = new TxLog({ dir, cluster: "mainnet-beta" });
    const entry = await log.append({ arenaId: 1, kind: "finalize", tx: "abc" });
    expect(entry.explorerUrl).toBe(
      "https://explorer.solana.com/tx/abc?cluster=mainnet-beta"
    );
  });

  it("list() returns every entry for an arena in append order", async () => {
    const log = new TxLog({ dir });
    await log.append({ arenaId: 9, kind: "create", tx: "tx-create" });
    await log.append({ arenaId: 9, kind: "start", tx: "tx-start" });
    await log.append({ arenaId: 9, kind: "round", round: 1, tx: "tx-r1" });

    const entries = await log.list(9);
    expect(entries.map((e) => e.kind)).toEqual(["create", "start", "round"]);
    expect(entries[2].round).toBe(1);
  });

  it("list() returns [] for unknown arenaId", async () => {
    const log = new TxLog({ dir });
    expect(await log.list(99)).toEqual([]);
  });

  it("findByKind() returns the first matching entry", async () => {
    const log = new TxLog({ dir });
    await log.append({ arenaId: 3, kind: "round", round: 1, tx: "tx-r1" });
    await log.append({ arenaId: 3, kind: "round", round: 2, tx: "tx-r2" });
    await log.append({ arenaId: 3, kind: "finalize", tx: "tx-finalize" });

    const finalize = await log.findByKind(3, "finalize");
    expect(finalize?.tx).toBe("tx-finalize");

    const round = await log.findByKind(3, "round");
    expect(round?.tx).toBe("tx-r1");

    const claim = await log.findByKind(3, "claim");
    expect(claim).toBeNull();
  });

  it("findRound() matches by round number", async () => {
    const log = new TxLog({ dir });
    await log.append({ arenaId: 5, kind: "round", round: 1, tx: "tx-r1" });
    await log.append({ arenaId: 5, kind: "round", round: 2, tx: "tx-r2" });

    expect((await log.findRound(5, 2))?.tx).toBe("tx-r2");
    expect(await log.findRound(5, 99)).toBeNull();
  });
});
