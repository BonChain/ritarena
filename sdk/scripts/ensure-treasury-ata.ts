// One-time setup: create the treasury PDA's USDC associated token account.
//
// Before v0.5.0 of the program, this ATA was created as a side effect of the
// first profile registration (register_profile had init_if_needed on it).
// Starting with v0.5.0 register_profile is fee-free and no longer initializes
// this account, so collect_protocol_fee and abandon_arena will fail until the
// ATA exists. Run this script once after deploying the v0.5.0 program upgrade.
//
// Idempotent — safe to re-run; no-op if the ATA already exists.
//
// Usage:
//   cd sdk
//   npx tsx scripts/ensure-treasury-ata.ts
//
// Env overrides:
//   RPC_URL              — defaults to https://api.devnet.solana.com
//   SOLANA_KEYPAIR_PATH  — defaults to ~/.config/solana/id.json (payer for the tx)

import {
  Connection,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountIdempotentInstruction,
} from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";
import { RitArena, pdas } from "../src/index";

const RPC_URL = process.env.RPC_URL ?? "https://api.devnet.solana.com";

function loadKeypair(): Keypair {
  const p =
    process.env.SOLANA_KEYPAIR_PATH ??
    path.join(process.env.HOME || "~", ".config/solana/id.json");
  return Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(p, "utf-8")))
  );
}

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");
  const payer = loadKeypair();
  const sdk = RitArena.readOnly(connection);

  const protocol = await sdk.getProtocol();
  if (!protocol) {
    console.error(`Protocol not initialized on ${RPC_URL}. Aborting.`);
    process.exit(1);
  }

  const usdcMint = protocol.usdcMint;
  const treasuryPda = pdas.treasury();
  const ata = await getAssociatedTokenAddress(usdcMint, treasuryPda, true);

  console.log("RPC:           ", RPC_URL);
  console.log("Payer:         ", payer.publicKey.toBase58());
  console.log("USDC mint:     ", usdcMint.toBase58());
  console.log("Treasury PDA:  ", treasuryPda.toBase58());
  console.log("Treasury ATA:  ", ata.toBase58());
  console.log();

  const info = await connection.getAccountInfo(ata);
  if (info !== null) {
    console.log("✓ ATA already exists — no action needed.");
    return;
  }

  console.log("Creating ATA...");

  const tx = new Transaction().add(
    createAssociatedTokenAccountIdempotentInstruction(
      payer.publicKey,
      ata,
      treasuryPda,
      usdcMint
    )
  );

  const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
  console.log("✓ Created. Signature:", sig);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
