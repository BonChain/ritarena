import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet, BN } from "@coral-xyz/anchor";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";

import { pdas, PROGRAM_ID, BATTLE_ROYALE_TEMPLATE } from "../src/index";
import { IDL } from "../src/idl/index";

const RPC_URL = "https://api.devnet.solana.com";

function loadKeypair(): Keypair {
  const keypairPath = path.join(
    process.env.HOME || "~",
    ".config/solana/id.json"
  );
  const secret = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");
  const keypair = loadKeypair();
  const wallet = new Wallet(keypair);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const program = new Program(IDL as any, provider);

  console.log("=== RitArena Devnet Integration Test ===");
  console.log("Program ID:", PROGRAM_ID.toBase58());
  console.log("Wallet:", keypair.publicKey.toBase58());
  console.log(
    "Balance:",
    (await connection.getBalance(keypair.publicKey)) / 1e9,
    "SOL"
  );

  // Step 1: Check if protocol is initialized
  const protocolPda = pdas.protocol();
  console.log("\n--- Step 1: Check Protocol ---");
  console.log("Protocol PDA:", protocolPda.toBase58());

  let protocolAccount = await connection.getAccountInfo(protocolPda);

  if (!protocolAccount) {
    console.log("Protocol NOT initialized. Initializing...");

    // Create a test USDC mint
    console.log("Creating test USDC mint...");
    const usdcMint = await createMint(
      connection,
      keypair,
      keypair.publicKey,
      null,
      6
    );
    console.log("Test USDC mint:", usdcMint.toBase58());

    const treasuryPda = pdas.treasury();

    // Initialize protocol
    const tx = await (program.methods as any)
      .initializeProtocol()
      .accounts({
        authority: keypair.publicKey,
        usdcMint: usdcMint,
        protocol: protocolPda,
        treasury: treasuryPda,
      })
      .rpc();
    console.log("Protocol initialized! tx:", tx);
  } else {
    console.log("Protocol already initialized.");
  }

  // Fetch protocol to get USDC mint
  const protocol = await (program.account as any).protocolConfig.fetch(
    protocolPda
  );
  const usdcMint: PublicKey = protocol.usdcMint;
  console.log("USDC mint:", usdcMint.toBase58());

  // Step 2: Ensure we have USDC
  console.log("\n--- Step 2: Fund USDC ---");
  const ownerAta = await getOrCreateAssociatedTokenAccount(
    connection,
    keypair,
    usdcMint,
    keypair.publicKey
  );
  console.log("Owner USDC ATA:", ownerAta.address.toBase58());
  console.log("USDC balance:", Number(ownerAta.amount) / 1e6);

  if (Number(ownerAta.amount) < 100_000_000) {
    console.log("Minting 1000 test USDC...");
    await mintTo(
      connection,
      keypair,
      usdcMint,
      ownerAta.address,
      keypair.publicKey,
      1_000_000_000 // 1000 USDC
    );
    const updated = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      usdcMint,
      keypair.publicKey
    );
    console.log("New USDC balance:", Number(updated.amount) / 1e6);
  }

  // Step 3: Register profile (if not already)
  console.log("\n--- Step 3: Register Profile ---");
  const profilePda = pdas.agentProfile(keypair.publicKey);
  const profileAccount = await connection.getAccountInfo(profilePda);

  if (!profileAccount) {
    console.log("Registering agent profile...");
    const treasuryPda = pdas.treasury();
    const treasuryUsdc = await getAssociatedTokenAddress(
      usdcMint,
      treasuryPda,
      true
    );

    const tx = await (program.methods as any)
      .registerProfile("DevTestAgent")
      .accounts({
        owner: keypair.publicKey,
        agentProfile: profilePda,
        protocol: protocolPda,
        usdcMint,
        ownerUsdc: ownerAta.address,
        treasuryUsdc,
        treasury: treasuryPda,
      })
      .rpc();
    console.log("Profile registered! tx:", tx);
  } else {
    console.log("Profile already registered.");
  }

  // Step 4: Create Arena!
  console.log("\n--- Step 4: Create Arena ---");
  const arenaId = Number(protocol.totalArenas);
  console.log("Creating arena ID:", arenaId);

  const arenaPda = pdas.arena(arenaId);
  const arenaVault = pdas.arenaVault(arenaPda);
  const bondVault = pdas.bondVault(arenaPda);

  const tx = await (program.methods as any)
    .createArena(
      new BN(BATTLE_ROYALE_TEMPLATE.entryFee),
      BATTLE_ROYALE_TEMPLATE.maxAgents,
      BATTLE_ROYALE_TEMPLATE.minAgents,
      new BN(BATTLE_ROYALE_TEMPLATE.duration),
      new BN(BATTLE_ROYALE_TEMPLATE.eliminationInterval),
      BATTLE_ROYALE_TEMPLATE.eliminationPercent,
      BATTLE_ROYALE_TEMPLATE.creatorFeeBps,
      BATTLE_ROYALE_TEMPLATE.prizeSplit,
      "up,down,left,right",
      Array.from(BATTLE_ROYALE_TEMPLATE.rulesHash),
      new BN(0),
      new BN(0),
      new BN(0),
      new BN(0) // no bond
    )
    .accounts({
      creator: keypair.publicKey,
      protocol: protocolPda,
      arena: arenaPda,
      usdcMint,
      arenaVault,
      bondVault,
      creatorUsdc: ownerAta.address,
    })
    .rpc();

  console.log("Arena created! tx:", tx);

  // Step 5: Verify arena on-chain
  console.log("\n--- Step 5: Verify Arena ---");
  const arena = await (program.account as any).arena.fetch(arenaPda);
  console.log("Arena ID:", Number(arena.id));
  console.log("Creator:", arena.creator.toBase58());
  console.log("Entry fee:", Number(arena.entryFee) / 1e6, "USDC");
  console.log("Max agents:", arena.maxAgents);
  console.log("State:", JSON.stringify(arena.state));
  console.log("Action schema:", arena.actionSchema);

  console.log("\n=== SUCCESS: Arena created on devnet! ===");
  console.log("Arena PDA:", arenaPda.toBase58());
  console.log(
    "Explorer: https://explorer.solana.com/address/" +
      arenaPda.toBase58() +
      "?cluster=devnet"
  );
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
