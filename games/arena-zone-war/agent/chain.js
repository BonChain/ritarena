import fs from "fs";
import path from "path";

import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  MAX_TEST_USDC_PER_CALL,
  REGISTRATION_FEE,
  RitArena,
} from "@ritarena/sdk";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function isLikelyDevnet(rpcUrl) {
  const u = rpcUrl.toLowerCase();
  return u.includes("devnet") || u.includes("localhost") || u.includes("127.0.0.1");
}

function loadOrCreateKeypair(keypairPath) {
  if (!keypairPath) {
    throw new Error("AGENT_KEYPAIR_PATH is not set");
  }

  const dir = path.dirname(keypairPath);
  fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(keypairPath)) {
    const secret = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
    const bytes = Array.isArray(secret) ? secret : Object.values(secret);
    return Keypair.fromSecretKey(new Uint8Array(bytes));
  }

  const keypair = Keypair.generate();
  fs.writeFileSync(
    keypairPath,
    `${JSON.stringify(Array.from(keypair.secretKey))}\n`,
    "utf-8",
  );
  console.log(`[chain] created keypair -> ${keypairPath}`);
  console.log(`[chain] pubkey ${keypair.publicKey.toBase58()}`);

  return keypair;
}

async function ensureSolBalance(connection, pubkey, minLamports, rpcUrl) {
  let balance = 0;
  for (let attempt = 0; attempt < 24; attempt++) {
    try {
      balance = await connection.getBalance(pubkey);
      break;
    } catch (e) {
      if (isRateLimitError(e)) {
        await sleep(5000 * (attempt + 1));
        continue;
      }
      throw e;
    }
  }

  if (balance >= minLamports) {
    return;
  }

  if (!isLikelyDevnet(rpcUrl)) {
    throw new Error(
      `Low SOL balance (${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL). Fund ${pubkey.toBase58()} or use a devnet RPC for auto-airdrop.`,
    );
  }

  const target = minLamports;
  const chunk = Math.min(1 * LAMPORTS_PER_SOL, Math.ceil((target - balance) / 1_000_000) * 1_000_000 || 1 * LAMPORTS_PER_SOL);

  for (let attempt = 1; attempt <= 8 && balance < target; attempt++) {
    try {
      const sig = await connection.requestAirdrop(pubkey, Math.min(chunk, target - balance + 0.05 * LAMPORTS_PER_SOL));
      const latest = await connection.getLatestBlockhash("confirmed");
      await connection.confirmTransaction({ signature: sig, ...latest }, "confirmed");
    } catch (error) {
      console.warn(`[chain] airdrop attempt ${attempt} failed:`, error?.message || error);
      await sleep(1500 * attempt);
      continue;
    }

    balance = await connection.getBalance(pubkey);
    console.log(`[chain] SOL balance ${(balance / LAMPORTS_PER_SOL).toFixed(4)}`);
  }

  if (balance < minLamports) {
    throw new Error(
      `Could not reach minimum SOL after airdrops (${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL). Try again later or fund ${pubkey.toBase58()}.`,
    );
  }
}

function isRateLimitError(error) {
  if (!error) return false;
  const msg = error?.message || String(error);
  return /429|Too Many Requests|fetch failed|ConnectTimeoutError|ECONNREFUSED/i.test(msg);
}

async function registerProfileWithRetry(sdk, name) {
  for (let i = 0; i < 24; i++) {
    try {
      return await sdk.registerProfile(name);
    } catch (e) {
      if (isRateLimitError(e)) {
        const wait = 5000 * (i + 1);
        console.log(`[chain] registerProfile rate-limited, retrying in ${wait}ms...`);
        await sleep(wait);
        continue;
      }
      throw e;
    }
  }
  throw new Error("registerProfile failed after 2 minutes of retries");
}

async function waitForProfile(sdk, pubkey) {
  for (let i = 0; i < 24; i++) {
    const profile = await sdk.getProfile(pubkey);
    if (profile) return profile;
    await sleep(5000 * (i + 1));
  }
  throw new Error("Profile did not propagate after 2 minutes");
}

async function enterArenaWithRetry(sdk, arenaId) {
  for (let i = 0; i < 24; i++) {
    try {
      return await sdk.enterArena(arenaId);
    } catch (e) {
      if (isRateLimitError(e)) {
        const wait = 5000 * (i + 1);
        console.log(`[chain] enterArena rate-limited, retrying in ${wait}ms...`);
        await sleep(wait);
        continue;
      }
      throw e;
    }
  }
  throw new Error(`enterArena ${arenaId} failed after 2 minutes of retries`);
}

async function readUsdcMicroBalance(connection, usdcMint, owner) {
  const ata = await getAssociatedTokenAddress(usdcMint, owner);
  try {
    const acc = await getAccount(connection, ata);
    return Number(acc.amount);
  } catch {
    return 0;
  }
}

async function ensureTestUsdc(sdk, connection, usdcMint, owner, minMicro) {
  let balance = await readUsdcMicroBalance(connection, usdcMint, owner);
  if (balance >= minMicro) {
    console.log(`[chain] USDC ok: ${(balance / 1_000_000).toFixed(2)}`);
    return;
  }

  console.log(
    `[chain] minting test USDC (have ${(balance / 1_000_000).toFixed(2)}, need ~${(minMicro / 1_000_000).toFixed(1)})`,
  );

  for (let attempt = 0; attempt < 24; attempt++) {
    balance = await readUsdcMicroBalance(connection, usdcMint, owner);
    if (balance >= minMicro) {
      break;
    }

    const need = minMicro - balance + 2_000_000;
    const chunk = Math.min(Math.max(need, 1), MAX_TEST_USDC_PER_CALL);
    const tx = await sdk.mintTestUsdc(chunk, owner);
    console.log(`[chain] mintTestUsdc +${(chunk / 1_000_000).toFixed(1)} USDC`, typeof tx === "string" ? tx.slice(0, 16) : tx);
  }

  balance = await readUsdcMicroBalance(connection, usdcMint, owner);
  console.log(`[chain] USDC after mint: ${(balance / 1_000_000).toFixed(2)}`);

  if (balance < minMicro) {
    throw new Error(
      `Still low on USDC after minting (${(balance / 1_000_000).toFixed(2)}). Check devnet RPC / protocol mint.`,
    );
  }
}

/**
 * Loads or creates a bot keypair, funds SOL (devnet airdrop) + test USDC, then registers + enters the arena.
 * @returns Base58 public key used with join_game
 */
export async function bootstrapAgentOnchain() {
  const rpcUrl = process.env.RPC_URL || "https://api.devnet.solana.com";
  const arenaId = Number(process.env.ARENA_ID || "0");
  const keypairPath = process.env.AGENT_KEYPAIR_PATH;

  if (!Number.isFinite(arenaId)) {
    throw new Error(`Invalid ARENA_ID: ${process.env.ARENA_ID}`);
  }

  const keypair = loadOrCreateKeypair(keypairPath);
  const connection = new Connection(rpcUrl, "confirmed");

  const minSolLamports = Math.floor(
    Number(process.env.AGENT_MIN_SOL || 0.08) * LAMPORTS_PER_SOL,
  );
  await ensureSolBalance(connection, keypair.publicKey, minSolLamports, rpcUrl);

  const sdk = RitArena.fromKeypair(connection, keypair);
  const protocol = await sdk.getProtocol();
  if (!protocol) {
    throw new Error("RitArena protocol not found on this cluster. Initialize devnet protocol first.");
  }

  const usdcMint = protocol.usdcMint;
  const entryFeeMicro = Number(process.env.AGENT_EXPECTED_ENTRY_FEE_MICRO || 5_000_000);
  const minUsdc = REGISTRATION_FEE + entryFeeMicro + 5_000_000;

  await ensureTestUsdc(sdk, connection, usdcMint, keypair.publicKey, minUsdc);

  const existing = await sdk.getProfile(keypair.publicKey);
  if (!existing) {
    const name = (process.env.AGENT_NAME || keypair.publicKey.toBase58()).slice(0, 32);
    console.log(`[chain] registerProfile ${name}`);
    await registerProfileWithRetry(sdk, name);
    await waitForProfile(sdk, keypair.publicKey);
  }

  console.log(`[chain] enterArena ${arenaId}`);
  await enterArenaWithRetry(sdk, arenaId);

  return {
    pubkey: keypair.publicKey.toBase58(),
    keypair,
    connection,
    sdk,
  };
}

/**
 * Watch an arena entry and auto-claim prize when won.
 * Returns the unsubscribe function.
 */
export async function watchEntryAndClaim(connection, keypair, arenaId) {
  const rpcUrl = process.env.RPC_URL || "https://api.devnet.solana.com";
  const sdk = RitArena.fromKeypair(connection, keypair);

  const unsub = sdk.watchEntry(arenaId, keypair.publicKey, async (entry) => {
    if (entry.prizeRank > 0) {
      console.log(`[chain] Won rank ${entry.prizeRank}! Claiming prize...`);
      try {
        const tx = await sdk.claimPrize(arenaId);
        console.log(`[chain] Prize claimed:`, typeof tx === "string" ? tx.slice(0, 16) : tx);
      } catch (e) {
        console.error(`[chain] Claim failed:`, e?.message || e);
      }
      unsub();
    }
    if (!entry.alive && entry.prizeRank === 0) {
      console.log(`[chain] Eliminated without prize`);
      unsub();
    }
  });

  return unsub;
}

/**
 * Create a new SDK instance from an existing keypair.
 * Used by index.js to get SDK for watchEntryAndClaim.
 */
export function createSdk(connection, keypair) {
  return RitArena.fromKeypair(connection, keypair);
}
