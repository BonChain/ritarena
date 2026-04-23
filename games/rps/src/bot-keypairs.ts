import { readFileSync } from "node:fs";
import { Keypair } from "@solana/web3.js";
import { RitArena } from "@ritarena/sdk";
import type { Connection } from "@solana/web3.js";
import { BOT_ROSTER } from "./bots/index.js";

/**
 * Loads 5 bot keypairs from the BOT_KEYPAIRS_DIR env var (one JSON file per bot,
 * named <botname>.json — same format as solana-keygen output). Returns them
 * in BOT_ROSTER order.
 */
export function loadBotKeypairs(): Keypair[] {
  const dir = process.env.BOT_KEYPAIRS_DIR;
  if (!dir) {
    throw new Error(
      "BOT_KEYPAIRS_DIR env var must point to a directory containing copycat.json, counter-predictor.json, chaos.json, last-winner.json, rock-head.json"
    );
  }
  return BOT_ROSTER.map((bot) => {
    const filename = bot.name.replace(/^@/, "") + ".json";
    const path = `${dir}/${filename}`;
    const secret = JSON.parse(readFileSync(path, "utf-8")) as number[];
    return Keypair.fromSecretKey(new Uint8Array(secret));
  });
}

/**
 * Ensure each bot has a registered AgentProfile. Idempotent — skips bots
 * whose profiles already exist.
 */
export async function ensureBotProfiles(
  connection: Connection,
  botKeypairs: readonly Keypair[]
): Promise<void> {
  for (let i = 0; i < botKeypairs.length; i++) {
    const bot = BOT_ROSTER[i];
    const kp = botKeypairs[i];
    const sdk = RitArena.fromKeypair(connection, kp);
    const existing = await sdk.getProfile(kp.publicKey);
    if (existing) continue;
    await sdk.registerProfile(bot.name);
  }
}
