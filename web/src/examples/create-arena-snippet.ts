/**
 * Type-check-only: proves the hero code snippet in CodeBlock.tsx compiles
 * against the shipped @ritarena/sdk surface. Never imported from app code.
 */
import {
  RitArena,
  BATTLE_ROYALE_TEMPLATE,
  type CreateArenaConfig,
} from "@ritarena/sdk";
import type { Connection, Keypair } from "@solana/web3.js";

declare function getConnection(): Connection;
declare function getKeypair(): Keypair;

async function createArenaExample(): Promise<void> {
  const sdk = RitArena.fromKeypair(getConnection(), getKeypair());

  // Create a battle royale in 10 lines
  const { arenaId } = await sdk.createArena({
    ...BATTLE_ROYALE_TEMPLATE,
    entryFee: 5_000_000, //       5 USDC
    maxAgents: 50,
    creatorFeeBps: 500, //        you earn 5%
    prizeSplit: [60, 30, 10],
    actionSchema: "up,down,left,right",
  });
  // Arena is live on Solana. Done.

  void arenaId;
}

// Force the module to reference each import so tsc validates them
void createArenaExample;
const _verifyTemplate: CreateArenaConfig = BATTLE_ROYALE_TEMPLATE;
void _verifyTemplate;
