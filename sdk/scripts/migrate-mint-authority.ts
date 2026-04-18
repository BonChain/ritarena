// One-shot migration: transfer the existing test-USDC mint authority to the program PDA.
// Run ONCE by the original mint authority (whoever ran sdk/scripts/test-devnet.ts first).
// After this runs, anyone can call `RitArena.mintTestUsdc()` to mint test USDC.

import { Connection, Keypair, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { createSetAuthorityInstruction, AuthorityType, getMint } from "@solana/spl-token";
import { RitArena, pdas } from "../src/index";
import * as fs from "fs";
import * as path from "path";

const RPC_URL = "https://api.devnet.solana.com";

function loadKeypair(): Keypair {
  const p = process.env.SOLANA_KEYPAIR_PATH
    ?? path.join(process.env.HOME || "~", ".config/solana/id.json");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(p, "utf-8"))));
}

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");
  const authority = loadKeypair();
  const sdk = RitArena.readOnly(connection);

  const protocol = await sdk.getProtocol();
  if (!protocol) {
    console.error("Protocol not initialized on devnet. Aborting.");
    process.exit(1);
  }

  const usdcMint = protocol.usdcMint;
  const newAuthority = pdas.testUsdcMintAuthority();

  console.log("Wallet         :", authority.publicKey.toBase58());
  console.log("USDC mint      :", usdcMint.toBase58());
  console.log("New authority  :", newAuthority.toBase58(), "(program PDA)");

  const mintInfo = await getMint(connection, usdcMint);
  const currentAuthority = mintInfo.mintAuthority;
  console.log("Current authority:", currentAuthority?.toBase58() ?? "<none>");

  if (!currentAuthority) {
    console.error("Mint has no authority — already migrated or frozen. Nothing to do.");
    process.exit(1);
  }
  if (currentAuthority.equals(newAuthority)) {
    console.log("Already migrated. Done.");
    return;
  }
  if (!currentAuthority.equals(authority.publicKey)) {
    console.error("This wallet is not the current mint authority. Aborting.");
    console.error(`  Current : ${currentAuthority.toBase58()}`);
    console.error(`  Local   : ${authority.publicKey.toBase58()}`);
    process.exit(1);
  }

  const ix = createSetAuthorityInstruction(
    usdcMint,
    authority.publicKey,
    AuthorityType.MintTokens,
    newAuthority
  );
  const tx = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [authority]);

  console.log("\nMigration tx :", sig);
  console.log("Explorer     : https://explorer.solana.com/tx/" + sig + "?cluster=devnet");

  // Verify
  const after = await getMint(connection, usdcMint);
  console.log("Authority now:", after.mintAuthority?.toBase58() ?? "<none>");
  if (!after.mintAuthority?.equals(newAuthority)) {
    console.error("FAILED — authority did not update. Check the transaction.");
    process.exit(1);
  }
  console.log("\nDone — anyone can now call RitArena.mintTestUsdc().");
}

main().catch((err) => { console.error("FAILED:", err); process.exit(1); });
