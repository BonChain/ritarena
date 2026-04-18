import { describe, it, expect } from "vitest";
import { PublicKey } from "@solana/web3.js";
import { pdas, PROGRAM_ID, BATTLE_ROYALE_TEMPLATE } from "../src";

describe("PDA derivation", () => {
  it("derives protocol PDA", () => {
    const pda = pdas.protocol();
    const [expected] = PublicKey.findProgramAddressSync(
      [Buffer.from("protocol")],
      PROGRAM_ID
    );
    expect(pda.equals(expected)).toBe(true);
  });

  it("derives treasury PDA", () => {
    const pda = pdas.treasury();
    const [expected] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury")],
      PROGRAM_ID
    );
    expect(pda.equals(expected)).toBe(true);
  });

  it("derives agent profile PDA", () => {
    const owner = PublicKey.unique();
    const pda = pdas.agentProfile(owner);
    const [expected] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent_profile"), owner.toBuffer()],
      PROGRAM_ID
    );
    expect(pda.equals(expected)).toBe(true);
  });

  it("derives arena PDA with 8-byte LE encoding", () => {
    const arenaId = 42;
    const pda = pdas.arena(arenaId);
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(BigInt(42));
    const [expected] = PublicKey.findProgramAddressSync(
      [Buffer.from("arena"), buf],
      PROGRAM_ID
    );
    expect(pda.equals(expected)).toBe(true);
  });

  it("derives arena entry PDA", () => {
    const arena = PublicKey.unique();
    const profile = PublicKey.unique();
    const pda = pdas.arenaEntry(arena, profile);
    const [expected] = PublicKey.findProgramAddressSync(
      [Buffer.from("arena_entry"), arena.toBuffer(), profile.toBuffer()],
      PROGRAM_ID
    );
    expect(pda.equals(expected)).toBe(true);
  });

  it("derives arena vault PDA", () => {
    const arena = PublicKey.unique();
    const pda = pdas.arenaVault(arena);
    const [expected] = PublicKey.findProgramAddressSync(
      [Buffer.from("arena_vault"), arena.toBuffer()],
      PROGRAM_ID
    );
    expect(pda.equals(expected)).toBe(true);
  });

  it("derives bond vault PDA", () => {
    const arena = PublicKey.unique();
    const pda = pdas.bondVault(arena);
    const [expected] = PublicKey.findProgramAddressSync(
      [Buffer.from("bond_vault"), arena.toBuffer()],
      PROGRAM_ID
    );
    expect(pda.equals(expected)).toBe(true);
  });

  it("testUsdcMintAuthority PDA is deterministic", () => {
    const pda1 = pdas.testUsdcMintAuthority();
    const pda2 = pdas.testUsdcMintAuthority();
    expect(pda1.toBase58()).toBe(pda2.toBase58());
    expect(pda1.toBase58()).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
  });
});

describe("BATTLE_ROYALE_TEMPLATE", () => {
  it("has valid prize split summing to 100", () => {
    const sum = BATTLE_ROYALE_TEMPLATE.prizeSplit.reduce(
      (a: number, b: number) => a + b,
      0
    );
    expect(sum).toBe(100);
  });
});
