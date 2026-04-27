import { appendFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { txExplorerUrl, type SolanaCluster } from "./explorer";

export type TxKind =
  | "create"
  | "enter"
  | "start"
  | "round"
  | "finalize"
  | "claim"
  | "collect-fee"
  | "creator-fee"
  | "stake-bond"
  | "cancel"
  | "abandon";

export interface TxLogEntry {
  arenaId: number;
  kind: TxKind;
  round?: number;
  pubkey?: string;
  tx: string;
  explorerUrl: string;
  ts: number;
}

export interface TxLogAppendInput {
  arenaId: number;
  kind: TxKind;
  tx: string;
  round?: number;
  pubkey?: string;
}

export class TxLog {
  private readonly dir: string;
  private readonly cluster: SolanaCluster;

  constructor(opts: { dir: string; cluster?: SolanaCluster }) {
    this.dir = opts.dir;
    this.cluster = opts.cluster ?? "devnet";
  }

  async append(input: TxLogAppendInput): Promise<TxLogEntry> {
    const entry: TxLogEntry = {
      arenaId: input.arenaId,
      kind: input.kind,
      tx: input.tx,
      explorerUrl: txExplorerUrl(input.tx, this.cluster),
      ts: Date.now(),
    };
    if (input.round !== undefined) entry.round = input.round;
    if (input.pubkey !== undefined) entry.pubkey = input.pubkey;

    await mkdir(this.dir, { recursive: true });
    await appendFile(this.path(input.arenaId), JSON.stringify(entry) + "\n", "utf-8");
    return entry;
  }

  async list(arenaId: number): Promise<TxLogEntry[]> {
    let raw: string;
    try {
      raw = await readFile(this.path(arenaId), "utf-8");
    } catch {
      return [];
    }
    return raw
      .split("\n")
      .filter((line) => line.length > 0)
      .map((line) => JSON.parse(line) as TxLogEntry);
  }

  async findByKind(arenaId: number, kind: TxKind): Promise<TxLogEntry | null> {
    const entries = await this.list(arenaId);
    return entries.find((e) => e.kind === kind) ?? null;
  }

  async findRound(arenaId: number, round: number): Promise<TxLogEntry | null> {
    const entries = await this.list(arenaId);
    return entries.find((e) => e.kind === "round" && e.round === round) ?? null;
  }

  private path(arenaId: number): string {
    return join(this.dir, `${arenaId}.jsonl`);
  }
}
