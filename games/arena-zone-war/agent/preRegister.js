import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Connection, Keypair } from "@solana/web3.js";
import {
  MAX_TEST_USDC_PER_CALL,
  REGISTRATION_FEE,
  RitArena,
} from "@ritarena/sdk";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const isRateLimitError = (error) => {
  if (!error) return false;
  const msg = error?.message || String(error);
  return /429|Too Many Requests|fetch failed|ConnectTimeoutError|ECONNREFUSED/i.test(msg);
};

async function registerProfileWithRetry(sdk, name) {
  for (let i = 0; i < 24; i++) {
    try {
      return await sdk.registerProfile(name);
    } catch (e) {
      if (isRateLimitError(e)) {
        const wait = 5000 * (i + 1);
        console.log(`[preReg] registerProfile rate-limited, retrying in ${wait}ms...`);
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

async function ensureSolBalance(connection, pubkey, minLamports) {
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
    console.log(`[preReg] SOL balance ok: ${(balance / 1e9).toFixed(4)}`);
    return;
  }

  const target = minLamports;
  const chunk = Math.min(1e9, Math.ceil((target - balance) / 1e6) * 1e6 || 1e9);

  for (let attempt = 1; attempt <= 8 && balance < target; attempt++) {
    try {
      const sig = await connection.requestAirdrop(pubkey, Math.min(chunk, target - balance + 0.05 * 1e9));
      const latest = await connection.getLatestBlockhash("confirmed");
      await connection.confirmTransaction({ signature: sig, ...latest }, "confirmed");
    } catch (error) {
      console.warn(`[preReg] airdrop attempt ${attempt} failed:`, error?.message || error);
      await sleep(1500 * attempt);
      continue;
    }

    balance = await connection.getBalance(pubkey);
    console.log(`[preReg] SOL airdropped, balance: ${(balance / 1e9).toFixed(4)}`);
  }

  if (balance < minLamports) {
    throw new Error(
      `Could not reach minimum SOL after airdrops (${(balance / 1e9).toFixed(4)} SOL).`,
    );
  }
}

async function getUsdcBalance(connection, usdcMint, owner) {
  try {
    const { getAssociatedTokenAddress, getAccount } = await import("@solana/spl-token");
    const ata = await getAssociatedTokenAddress(usdcMint, owner);
    const acc = await getAccount(connection, ata);
    return Number(acc.amount);
  } catch {
    return 0;
  }
}

async function ensureTestUsdc(sdk, connection, usdcMint, owner, minMicro) {
  let balance = await getUsdcBalance(connection, usdcMint, owner);
  if (balance >= minMicro) {
    console.log(`[preReg] USDC balance ok: ${(balance / 1e6).toFixed(2)}`);
    return;
  }

  console.log(`[preReg] minting test USDC (have ${(balance / 1e6).toFixed(2)}, need ~${(minMicro / 1e6).toFixed(1)})`);

  for (let attempt = 0; attempt < 24; attempt++) {
    balance = await getUsdcBalance(connection, usdcMint, owner);
    if (balance >= minMicro) break;

    const need = minMicro - balance + 2_000_000;
    const chunk = Math.min(Math.max(need, 1), MAX_TEST_USDC_PER_CALL);
    try {
      const tx = await sdk.mintTestUsdc(chunk, owner);
      console.log(`[preReg] mintTestUsdc +${(chunk / 1e6).toFixed(1)} USDC`, typeof tx === "string" ? tx.slice(0, 16) : tx);
    } catch (e) {
      if (isRateLimitError(e)) {
        await sleep(5000 * (attempt + 1));
        continue;
      }
      throw e;
    }
  }

  balance = await getUsdcBalance(connection, usdcMint, owner);
  console.log(`[preReg] USDC after mint: ${(balance / 1e6).toFixed(2)}`);

  if (balance < minMicro) {
    throw new Error(`Still low on USDC after minting (${(balance / 1e6).toFixed(2)}).`);
  }
}

async function registerBot(index) {
  const agentDir = path.dirname(fileURLToPath(import.meta.url));
  const keypairPath = path.join(agentDir, "bots", `bot-${index}.json`);
  const rpcUrl = process.env.RPC_URL || "https://api.devnet.solana.com";

  if (!fs.existsSync(keypairPath)) {
    console.log(`[preReg] bot-${index}: keypair not found at ${keypairPath}, skipping`);
    return;
  }

  const secret = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  const keypair = Keypair.fromSecretKey(new Uint8Array(secret));
  const connection = new Connection(rpcUrl, "confirmed");
  const sdk = RitArena.fromKeypair(connection, keypair);

  console.log(`[preReg] bot-${index}: checking profile for ${keypair.publicKey.toBase58()}`);

  const existing = await sdk.getProfile(keypair.publicKey);
  if (existing) {
    console.log(`[preReg] bot-${index}: profile already exists (${existing.name}), skipping registration`);
    return;
  }

  console.log(`[preReg] bot-${index}: no profile, registering...`);

  const minSolLamports = Math.floor(Number(process.env.AGENT_MIN_SOL || 0.08) * 1e9);
  await ensureSolBalance(connection, keypair.publicKey, minSolLamports);

  const protocol = await sdk.getProtocol();
  if (!protocol) {
    throw new Error(`[preReg] bot-${index}: RitArena protocol not found on this cluster.`);
  }

  const entryFeeMicro = Number(process.env.AGENT_EXPECTED_ENTRY_FEE_MICRO || 5_000_000);
  const minUsdc = REGISTRATION_FEE + entryFeeMicro + 5_000_000;
  await ensureTestUsdc(sdk, connection, protocol.usdcMint, keypair.publicKey, minUsdc);

  const name = `bot-${index}`;
  await registerProfileWithRetry(sdk, name);
  await waitForProfile(sdk, keypair.publicKey);
  console.log(`[preReg] bot-${index}: registered and confirmed on-chain`);
}

async function main() {
  const count = Number(process.env.AGENT_COUNT || 5);
  console.log(`[preReg] Starting pre-registration for ${count} bots...`);

  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(
      registerBot(i).catch((err) => {
        console.error(`[preReg] bot-${i} failed:`, err?.message || err);
      }),
    );
  }

  await Promise.all(promises);
  console.log("[preReg] Done.");
}

main().catch((err) => {
  console.error("[preReg] fatal:", err);
  process.exit(0);
});