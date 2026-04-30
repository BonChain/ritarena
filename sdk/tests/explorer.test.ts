import { describe, it, expect } from "vitest";
import { PublicKey } from "@solana/web3.js";
import { txExplorerUrl, addressExplorerUrl } from "../src/explorer";

describe("explorer URL helpers", () => {
  const sig = "5xK9wQbZJ8vGq2pT3rN7sM4aH1uL6yD2cF8eW9oP1nB7aX4zV5kR3sQ6tY8mU2cJ";
  const pkStr = "4LnRy1gUEX38CdNyY3VyNShdvcAGjWDmc5qVUF5bMEW9";

  it("txExplorerUrl defaults to devnet", () => {
    expect(txExplorerUrl(sig)).toBe(
      `https://explorer.solana.com/tx/${sig}?cluster=devnet`
    );
  });

  it("txExplorerUrl supports mainnet-beta", () => {
    expect(txExplorerUrl(sig, "mainnet-beta")).toBe(
      `https://explorer.solana.com/tx/${sig}?cluster=mainnet-beta`
    );
  });

  it("addressExplorerUrl accepts a string", () => {
    expect(addressExplorerUrl(pkStr)).toBe(
      `https://explorer.solana.com/address/${pkStr}?cluster=devnet`
    );
  });

  it("addressExplorerUrl accepts a PublicKey and serializes via toBase58", () => {
    const pk = new PublicKey(pkStr);
    expect(addressExplorerUrl(pk, "mainnet-beta")).toBe(
      `https://explorer.solana.com/address/${pkStr}?cluster=mainnet-beta`
    );
  });
});
