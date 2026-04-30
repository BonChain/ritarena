import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { RpsChoice } from "@ritarena/sdk";

export type LogEntry = {
  arenaId: string;
  round: number;
  pubkey: string;
  choice: RpsChoice;
  score: number;
  ts: number;
  tx: string;
};

export class LogWriter {
  constructor(private readonly dir: string) {}

  async appendRound(
    arenaId: string,
    round: number,
    pubkeys: readonly string[],
    choices: readonly RpsChoice[],
    scores: readonly number[],
    tx: string
  ): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    const path = join(this.dir, `${arenaId}.jsonl`);
    const ts = Date.now();
    const lines = pubkeys.map((pk, i) =>
      JSON.stringify({
        arenaId,
        round,
        pubkey: pk,
        choice: choices[i],
        score: scores[i],
        ts,
        tx,
      } satisfies LogEntry)
    ).join("\n") + "\n";
    await appendFile(path, lines, "utf-8");
  }
}
