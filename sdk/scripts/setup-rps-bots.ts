// One-time setup for the Arena #2 (RPS) game server: generate 6 keypairs
// (1 oracle + 5 bots), fund each from your main Solana CLI wallet, and
// register the 5 bots' on-chain AgentProfiles with their canonical names.
//
// Idempotent:
//   - Existing keypair files are reused (delete the directory to regenerate).
//   - Accounts with balance >= MIN_BALANCE_LAMPORTS are left alone.
//   - Profiles that already exist on-chain are left alone.
//
// Usage:
//   cd sdk
//   npx tsx scripts/setup-rps-bots.ts
//
// Env overrides:
//   RPC_URL                 — default https://api.devnet.solana.com
//   BOT_KEYPAIRS_DIR        — default ~/.ritarena/bots
//   SOLANA_KEYPAIR_PATH     — default ~/.config/solana/id.json (funds the others)

import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import * as path from "path";
import { RitArena } from "../src/index";

const RPC_URL = process.env.RPC_URL ?? "https://api.devnet.solana.com";
const BOTS_DIR =
  process.env.BOT_KEYPAIRS_DIR ??
  path.join(process.env.HOME || "~", ".ritarena/bots");
const PAYER_PATH =
  process.env.SOLANA_KEYPAIR_PATH ??
  path.join(process.env.HOME || "~", ".config/solana/id.json");
const FUND_AMOUNT_SOL = 0.05;
const MIN_BALANCE_LAMPORTS = 0.02 * LAMPORTS_PER_SOL;

type Role = {
  /** Display name. For bots this is also the on-chain profile name. */
  name: string;
  /** Filename (without the @-prefix the bot names carry). */
  file: string;
  /** Whether to register an on-chain AgentProfile for this role. */
  register: boolean;
};

// Filenames match what games/rps/src/bot-keypairs.ts expects (bot name minus @-prefix).
// The oracle doesn't need a profile — it only creates arenas + submits scores,
// never enters as a player.
const ROLES: Role[] = [
  { name: "oracle", file: "oracle.json", register: false },
  { name: "@copycat", file: "copycat.json", register: true },
  { name: "@counter-predictor", file: "counter-predictor.json", register: true },
  { name: "@chaos", file: "chaos.json", register: true },
  { name: "@last-winner", file: "last-winner.json", register: true },
  { name: "@rock-head", file: "rock-head.json", register: true },
];

function loadOrCreateKeypair(filePath: string): { kp: Keypair; wasNew: boolean } {
  if (existsSync(filePath)) {
    const secret = JSON.parse(readFileSync(filePath, "utf-8")) as number[];
    return { kp: Keypair.fromSecretKey(new Uint8Array(secret)), wasNew: false };
  }
  const kp = Keypair.generate();
  writeFileSync(filePath, JSON.stringify(Array.from(kp.secretKey)), "utf-8");
  return { kp, wasNew: true };
}

async function main() {
  mkdirSync(BOTS_DIR, { recursive: true });

  const connection = new Connection(RPC_URL, "confirmed");
  const payer = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(readFileSync(PAYER_PATH, "utf-8")) as number[])
  );
  const payerBalance = await connection.getBalance(payer.publicKey);

  console.log("RPC:       ", RPC_URL);
  console.log("Bots dir:  ", BOTS_DIR);
  console.log(
    "Payer:     ",
    payer.publicKey.toBase58(),
    `(${payerBalance / LAMPORTS_PER_SOL} SOL)`
  );
  console.log();

  const summary: Array<{ role: string; pubkey: string; notes: string[] }> = [];

  for (const role of ROLES) {
    console.log(`--- ${role.name} ---`);
    const filePath = path.join(BOTS_DIR, role.file);
    const { kp, wasNew } = loadOrCreateKeypair(filePath);
    const pubkey = kp.publicKey.toBase58();
    const notes: string[] = [];
    notes.push(wasNew ? "new keypair" : "reused keypair");
    console.log(`  pubkey: ${pubkey}`);

    // Fund if needed.
    let balance = await connection.getBalance(kp.publicKey);
    if (balance < MIN_BALANCE_LAMPORTS) {
      console.log(
        `  funding (${balance / LAMPORTS_PER_SOL} SOL → +${FUND_AMOUNT_SOL} SOL)...`
      );
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: kp.publicKey,
          lamports: Math.round(FUND_AMOUNT_SOL * LAMPORTS_PER_SOL),
        })
      );
      try {
        await sendAndConfirmTransaction(connection, tx, [payer]);
        balance = await connection.getBalance(kp.publicKey);
        notes.push(`funded +${FUND_AMOUNT_SOL} SOL`);
        console.log(`  ✓ balance now ${balance / LAMPORTS_PER_SOL} SOL`);
      } catch (err) {
        notes.push("fund FAILED");
        console.error(`  ✗ fund failed:`, err);
        summary.push({ role: role.name, pubkey, notes });
        console.log();
        continue;
      }
    } else {
      notes.push(`already funded (${balance / LAMPORTS_PER_SOL} SOL)`);
      console.log(`  ✓ already funded (${balance / LAMPORTS_PER_SOL} SOL)`);
    }

    // Register profile if this role needs one.
    if (role.register) {
      const sdk = RitArena.fromKeypair(connection, kp);
      const existing = await sdk.getProfile(kp.publicKey);
      if (existing) {
        notes.push(`profile exists ("${existing.name}")`);
        console.log(`  ✓ profile exists: "${existing.name}"`);
      } else {
        try {
          const sig = await sdk.registerProfile(role.name);
          notes.push(`registered "${role.name}"`);
          console.log(
            `  ✓ registered profile "${role.name}" (tx ${sig.slice(0, 10)}...)`
          );
        } catch (err) {
          notes.push("register FAILED");
          console.error(`  ✗ register failed:`, err);
        }
      }
    }

    summary.push({ role: role.name, pubkey, notes });
    console.log();
  }

  console.log("=== Summary ===");
  for (const r of summary) {
    console.log(`  ${r.role.padEnd(22)} ${r.pubkey}`);
    for (const n of r.notes) console.log(`                         → ${n}`);
  }
  console.log();
  console.log("Game server env:");
  console.log(`  ORACLE_KEYPAIR_PATH=${path.join(BOTS_DIR, "oracle.json")}`);
  console.log(`  BOT_KEYPAIRS_DIR=${BOTS_DIR}`);
  console.log();

  const anyFailed = summary.some((r) => r.notes.some((n) => n.includes("FAILED")));
  if (anyFailed) {
    console.error("✗ Some actions failed. See summary above.");
    process.exit(1);
  }
  console.log("✓ All 6 keypairs ready.");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
