import { Connection } from "@solana/web3.js";
import { RitArenaReader } from "@ritarena/sdk";

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

let cached: RitArenaReader | null = null;

export function getReader(): RitArenaReader {
  if (cached) return cached;
  const connection = new Connection(RPC_URL, "confirmed");
  cached = new RitArenaReader(connection);
  return cached;
}
