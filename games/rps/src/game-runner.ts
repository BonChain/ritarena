import type { Connection, Keypair } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import { pdas, hashLeaf, computeMerkleRoot } from "@ritarena/sdk";
import type { RpsChoice, ScoreUpdate, SubmitEliminationParams, FinalizeArenaParams } from "@ritarena/sdk";
import { EventEmitter } from "node:events";
import { createHash } from "node:crypto";
import { BOT_ROSTER } from "./bots/index.js";
import type { RoundHistory } from "./bots/types.js";
import { resolveRound } from "./round-resolver.js";
import type { RpsOracle } from "./oracle-client.js";

export type GameRunnerEvents = {
  "round-start": { round: number; deadline: number };
  "round-result": { round: number; choices: RpsChoice[]; scores: number[]; pubkeys: string[]; tx: string };
  "match-complete": { finalRanks: { pubkey: string; rank: number; score: number }[]; tx: string };
  error: { message: string };
};

const ROUND_MS = 10_000;
const TOTAL_ROUNDS = 3;

export class RpsGameRunner extends EventEmitter {
  private history: RoundHistory[] = [];
  private humanChoice: RpsChoice | null = null;
  private humanLastChoice: RpsChoice | null = null;
  /** arenaId as a number (SDK takes number, not string). */
  private readonly arenaIdNum: number;
  /** entry PDA for each participant, indexed same as allPubkeys(). */
  private entryPdas: PublicKey[] = [];
  private currentRound = 0;
  /** One-shot guard: run() may be called multiple times (React StrictMode
   *  double-mount reopens the WS → game-server dispatches run() again).
   *  Only the first caller drives the match; subsequent calls no-op. */
  private started = false;

  constructor(
    private readonly connection: Connection,
    private readonly oracle: RpsOracle,
    arenaId: string,
    private readonly botKeypairs: readonly Keypair[],
    private readonly humanPubkey: PublicKey
  ) {
    super();
    this.arenaIdNum = Number(arenaId);
  }

  /** WebSocket layer calls this when the human submits. Idempotent per round. */
  setHumanChoice(choice: RpsChoice): void {
    this.humanChoice = choice;
  }

  /**
   * Run the full 3-round match. Resolves when finalize_arena lands.
   * Throws if any on-chain call fails.
   *
   * Caller is responsible for ensuring all participants have already entered
   * the arena on-chain before calling run(). Entry PDAs are resolved from
   * the participant pubkeys at run-time.
   */
  async run(): Promise<void> {
    if (this.started) return;
    this.started = true;

    // Resolve entry PDAs for all participants (bots + human).
    // Must be called after all participants have entered the arena on-chain.
    const arenaPda = pdas.arena(this.arenaIdNum);
    this.entryPdas = this.allOwnerPubkeys().map((owner) => {
      const profilePda = pdas.agentProfile(owner);
      return pdas.arenaEntry(arenaPda, profilePda);
    });

    // Start arena on-chain. SDK takes arenaId as number.
    await this.oracle.underlying.startArena(this.arenaIdNum);

    for (let round = 0; round < TOTAL_ROUNDS; round++) {
      await this.runRound(round);
    }

    // Compute final ranks.
    const ownerPubkeys = this.allOwnerPubkeys();
    const totals = new Array<number>(ownerPubkeys.length).fill(0);
    for (const h of this.history) {
      for (let i = 0; i < totals.length; i++) {
        totals[i] += h.scores[i];
      }
    }

    // Sort desc by total, tiebreak by highest single-round score, then pubkey asc.
    const indexed = ownerPubkeys.map((pk, i) => ({
      pubkey: pk.toBase58(),
      entryPda: this.entryPdas[i],
      total: totals[i],
      bestRound: Math.max(...this.history.map((h) => h.scores[i])),
    }));
    indexed.sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      if (b.bestRound !== a.bestRound) return b.bestRound - a.bestRound;
      return a.pubkey.localeCompare(b.pubkey);
    });

    const finalRanks = indexed.map((x, i) => ({
      pubkey: x.pubkey,
      rank: i + 1,
      score: x.total,
    }));

    // Merkle root for the final state (one leaf per winner).
    const finalLeaves = indexed.slice(0, 3).map((w) =>
      createHash("sha256")
        .update(`final:${w.pubkey}:rank:${indexed.indexOf(w) + 1}`)
        .digest() as Buffer
    );
    const finalMerkleRoot = computeMerkleRoot(finalLeaves);

    // finalizeArena: winners take entry PDAs (not owner pubkeys).
    const params: FinalizeArenaParams = {
      merkleRoot: new Uint8Array(finalMerkleRoot),
      winners: indexed.slice(0, 1).map((w, i) => ({
        entry: w.entryPda,
        rank: i + 1,
      })),
      entryAccounts: this.entryPdas,
    };

    const finalizeTx = await this.oracle.underlying.finalizeArena(this.arenaIdNum, params);

    this.emit("match-complete", { finalRanks, tx: finalizeTx });
  }

  private async runRound(round: number): Promise<void> {
    const deadline = Date.now() + ROUND_MS;
    this.emit("round-start", { round, deadline });
    this.humanChoice = null;
    this.currentRound = round;

    // Wait the full round window OR until human has submitted.
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (this.humanChoice !== null || Date.now() >= deadline) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });

    // Resolve human's choice with timeout rule.
    let humanFinal: RpsChoice;
    if (this.humanChoice !== null) {
      humanFinal = this.humanChoice;
    } else if (this.humanLastChoice !== null) {
      humanFinal = this.humanLastChoice; // repeat previous round
    } else {
      // Round 0 forfeit: use "rock" as placeholder — score resolution still runs.
      humanFinal = "rock";
    }
    this.humanLastChoice = humanFinal;

    // Collect bot choices.
    const botChoices: RpsChoice[] = BOT_ROSTER.map((bot, i) => {
      try {
        return bot.pickChoice({
          round,
          history: this.history,
          selfIndex: i,
          humanIndex: BOT_ROSTER.length,
        });
      } catch (err) {
        this.emit("error", { message: `bot ${bot.name} threw: ${String(err)}` });
        return randomFallback();
      }
    });

    const allChoices: RpsChoice[] = [...botChoices, humanFinal];
    const ownerPubkeys = this.allOwnerPubkeys();

    const result = resolveRound({
      pubkeys: ownerPubkeys.map((pk) => pk.toBase58()),
      choices: allChoices,
    });

    // Build Merkle root from round actions.
    const roundNumber = round + 1;
    const leaves = ownerPubkeys.map((pk, i) =>
      hashLeaf({
        snakeId: pk.toBase58(),
        round: roundNumber,
        tick: i,
        action: allChoices[i],
        result: "played",
        score: result.scores[i],
      })
    );
    const merkleRoot = computeMerkleRoot(leaves);

    // Score updates: entry PDAs (not owner pubkeys), per SubmitEliminationParams.
    const scores: ScoreUpdate[] = ownerPubkeys.map((_, i) => ({
      entry: this.entryPdas[i],
      score: result.scores[i],
    }));

    const submitParams: SubmitEliminationParams = {
      merkleRoot: new Uint8Array(merkleRoot),
      roundNumber,
      eliminated: [], // no mid-match elimination for RPS
      scores,
      entryAccounts: this.entryPdas,
    };

    const roundTx = await this.oracle.underlying.submitElimination(this.arenaIdNum, submitParams);

    this.history.push({
      choices: [...allChoices],
      scores: [...result.scores],
    });

    this.emit("round-result", {
      round,
      choices: allChoices,
      scores: [...result.scores],
      pubkeys: ownerPubkeys.map((pk) => pk.toBase58()),
      tx: roundTx,
    });
  }

  private allOwnerPubkeys(): PublicKey[] {
    const bots = this.botKeypairs.map((kp) => kp.publicKey);
    return [...bots, this.humanPubkey];
  }
}

function randomFallback(): RpsChoice {
  const n = Math.floor(Math.random() * 3);
  return (["rock", "paper", "scissors"] as const)[n];
}
