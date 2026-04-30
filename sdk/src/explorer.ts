import { PublicKey } from "@solana/web3.js";

export type SolanaCluster = "devnet" | "mainnet-beta";

export function txExplorerUrl(
  tx: string,
  cluster: SolanaCluster = "devnet"
): string {
  return `https://explorer.solana.com/tx/${tx}?cluster=${cluster}`;
}

export function addressExplorerUrl(
  address: string | PublicKey,
  cluster: SolanaCluster = "devnet"
): string {
  const addr = typeof address === "string" ? address : address.toBase58();
  return `https://explorer.solana.com/address/${addr}?cluster=${cluster}`;
}
