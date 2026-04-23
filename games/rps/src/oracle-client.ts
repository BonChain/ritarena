import { Connection, Keypair } from "@solana/web3.js";
import { RitArena, BATTLE_ROYALE_TEMPLATE } from "@ritarena/sdk";
import type { CreateArenaConfig } from "@ritarena/sdk";

/**
 * Wraps @ritarena/sdk's RitArena for RPS-specific arena creation.
 * The oracle is a single Keypair that creates arenas, enters bots,
 * starts matches, submits round scores, and finalizes.
 */
export class RpsOracle {
  private sdk: RitArena;

  constructor(connection: Connection, keypair: Keypair) {
    this.sdk = RitArena.fromKeypair(connection, keypair);
  }

  /**
   * Create a new RPS arena with 6-player cap, 0 USDC entry, 3 rounds.
   * eliminationInterval is set to 90s (= duration) so the abandon threshold is
   * 180s — safe for 10s rounds × 3. See spec: docs/superpowers/specs/2026-04-21-arena-2-rps-design.md
   */
  async createRpsArena(): Promise<{ arenaId: string; tx: string }> {
    const config: CreateArenaConfig = {
      ...BATTLE_ROYALE_TEMPLATE,
      entryFee: 0,
      maxAgents: 6,
      minAgents: 2,
      actionSchema: "rock,paper,scissors",
      creatorFeeBps: 0,
      prizeSplit: [100],
      duration: 90,
      eliminationInterval: 90,
    };

    const result = await this.sdk.createArena(config);
    return { arenaId: String(result.arenaId), tx: result.tx };
  }

  /** Expose the underlying SDK for round submission + finalization. */
  get underlying(): RitArena {
    return this.sdk;
  }
}
