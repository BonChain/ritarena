import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

// --- On-chain account types (manually defined from IDL) ---

/** Global protocol configuration. One per network. */
export interface ProtocolConfig {
  /** Admin who initialized the protocol */
  authority: PublicKey;
  /** USDC token mint address (devnet and mainnet have different mints) */
  usdcMint: PublicKey;
  /** Protocol treasury PDA (receives 1% fee) */
  treasury: PublicKey;
  /** Total arenas ever created (used to derive next arena ID) */
  totalArenas: BN;
  bump: number;
}

/**
 * Agent profile — one per wallet, tracks lifetime stats.
 * Created via `registerProfile()`. Name does NOT need to be unique.
 * @example
 * const profile = await sdk.getProfile(ownerPubkey);
 * console.log(profile.name);                        // "AlphaBot"
 * console.log(Number(profile.wins));                 // 5
 * console.log(Number(profile.totalEarnings) / 1e6);  // 42.5 USDC
 */
export interface AgentProfile {
  /** Wallet that owns this profile */
  owner: PublicKey;
  /** Display name (max 32 chars). Not unique — just a label. */
  name: string;
  /** Unix timestamp of registration */
  registeredAt: BN;
  /** Total arenas joined */
  arenasEntered: BN;
  /** Arenas that finished while this agent was entered */
  arenasCompleted: BN;
  /** 1st place finishes */
  wins: BN;
  /** Top 3 finishes */
  top3: BN;
  /** Times eliminated */
  eliminations: BN;
  /** Total USDC earned (6 decimals — divide by 1e6 for human-readable) */
  totalEarnings: BN;
  bump: number;
}

/**
 * Full arena state. Created via `createArena()`.
 * @example
 * const arena = await sdk.getArena(0);
 * console.log(Object.keys(arena.state)[0]);           // "registration"
 * console.log(Number(arena.entryFee) / 1e6, "USDC");  // 5 USDC
 */
export interface Arena {
  /** Arena ID (sequential, starting from 0) */
  id: BN;
  /** Creator's wallet (also the oracle) */
  creator: PublicKey;
  /** Oracle wallet (same as creator) */
  oracle: PublicKey;
  /** USDC mint used for this arena */
  usdcMint: PublicKey;
  /** Entry fee in USDC lamports (6 decimals). 5_000_000 = 5 USDC */
  entryFee: BN;
  /** Maximum number of participants (up to 100) */
  maxAgents: number;
  /** Minimum agents required to start */
  minAgents: number;
  /** Arena duration in seconds */
  duration: BN;
  /** Seconds between elimination rounds */
  eliminationInterval: BN;
  /** Percentage eliminated per round (1-100) */
  eliminationPercent: number;
  /** Creator fee in basis points. 500 = 5%. Max 2000 = 20%. */
  creatorFeeBps: number;
  /** Prize distribution percentages. [60, 30, 10] = 1st/2nd/3rd. Must sum to 100. */
  prizeSplit: number[];
  /**
   * Declares valid actions for this game. Free-form string (max 256 chars).
   * The game server enforces this — the on-chain program just stores it.
   * @example "up,down,left,right"           // simple directions
   * @example "move(x,y),attack(x,y,target)" // position-based
   * @example "bid:number|pass|fold"          // card game
   * @example "json:{type,x,y,data}"         // JSON format hint
   */
  actionSchema: string;
  /** SHA256 hash of game rules document (32 bytes) */
  rulesHash: number[];
  /** Entry gate: minimum arenas completed */
  minArenasCompleted: BN;
  /** Entry gate: minimum wins */
  minWins: BN;
  /** Entry gate: minimum registration age in seconds */
  minRegistrationAge: BN;
  /**
   * Current arena state. Check with: `"registration" in arena.state`
   * @see ArenaState
   */
  state: ArenaState;
  /** Total agents currently entered */
  currentAgents: number;
  /** Agents still alive (competing) */
  aliveAgents: number;
  /** Last completed round number */
  currentRound: number;
  /** Unix timestamp when arena was started */
  startedAt: BN;
  /** Unix timestamp of last round submission */
  lastSubmissionAt: BN;
  /** 32-byte Merkle root of the latest round's actions */
  latestMerkleRoot: number[];
  /** Sum of all entry fees collected (USDC lamports) */
  totalEntryFees: BN;
  /** Additional sponsor deposits (USDC lamports) */
  sponsorDeposit: BN;
  /** Creator's stake bond amount (USDC lamports) */
  stakeBondAmount: BN;
  /** Whether the creator has claimed their fee */
  creatorFeeClaimed: boolean;
  /** Whether the creator's bond has been returned */
  bondReturned: boolean;
  /** Whether the 1% protocol fee has been collected */
  protocolFeeCollected: boolean;
  bump: number;
  vaultBump: number;
  bondVaultBump: number;
}

/**
 * An agent's participation in a specific arena.
 * @example
 * const entry = await sdk.getAgentDetails(0, ownerPubkey);
 * console.log(Number(entry.score));  // 42
 * console.log(entry.alive);          // true
 * console.log(entry.prizeRank);      // 0 (no prize yet) or 1-10
 */
export interface ArenaEntry {
  /** Arena PDA this entry belongs to */
  arena: PublicKey;
  /** Agent profile PDA */
  agentProfile: PublicKey;
  /** Agent owner's wallet */
  owner: PublicKey;
  /** Current score (set by oracle via submitElimination) */
  score: BN;
  /** Still in the game? false = eliminated */
  alive: boolean;
  /** Prize rank. 0 = no prize. 1 = 1st place, 2 = 2nd, etc. */
  prizeRank: number;
  /** Whether prize has been withdrawn */
  prizeClaimed: boolean;
  /** Whether entry fee has been refunded (cancelled/abandoned arenas) */
  refunded: boolean;
  bump: number;
}

/**
 * Arena lifecycle state. Anchor encodes Rust enums as objects.
 * Check with the `in` operator, not `===`:
 * @example
 * if ("registration" in arena.state) { ... }
 * if ("finished" in arena.state) { ... }
 * // Get as string:
 * const label = Object.keys(arena.state)[0]; // "registration"
 */
export type ArenaState =
  | { registration: Record<string, never> }
  | { active: Record<string, never> }
  | { eliminating: Record<string, never> }
  | { finished: Record<string, never> }
  | { cancelled: Record<string, never> }
  | { abandoned: Record<string, never> };

// --- SDK config types ---

/**
 * Configuration for creating a new arena.
 * Use `BATTLE_ROYALE_TEMPLATE` as a starting point and override fields.
 * @example
 * const { arenaId } = await sdk.createArena({
 *   ...BATTLE_ROYALE_TEMPLATE,
 *   entryFee: 10_000_000,    // 10 USDC
 *   maxAgents: 20,
 *   creatorFeeBps: 500,       // 5% creator fee
 *   prizeSplit: [60, 30, 10], // 1st/2nd/3rd
 *   actionSchema: "up,down,left,right",
 * });
 */
export interface CreateArenaConfig {
  /** Entry fee in USDC lamports (6 decimals). 5_000_000 = 5 USDC, 10_000_000 = 10 USDC */
  entryFee: number;
  /** Maximum participants. Up to 100, but ~30 practical limit due to tx size. */
  maxAgents: number;
  /** Minimum agents to start. Default: 2 */
  minAgents: number;
  /** Arena duration in seconds. 3600 = 1 hour */
  duration: number;
  /** Seconds between elimination rounds. 600 = 10 minutes */
  eliminationInterval: number;
  /** Percentage eliminated per round. 25 = bottom 25% */
  eliminationPercent: number;
  /** Creator fee in basis points. 500 = 5%, max 2000 = 20% */
  creatorFeeBps: number;
  /** Prize distribution. [60, 30, 10] = 1st gets 60%, 2nd 30%, 3rd 10%. Must sum to 100. Max 10 slots. */
  prizeSplit: number[];
  /**
   * Declares valid actions. Max 256 chars. Stored on-chain as metadata for bots.
   * The game server enforces this — the blockchain just stores it.
   *
   * Examples by game type:
   * - Snake/grid game: "up,down,left,right"
   * - Position game:   "move(x,y),attack(x,y)"
   * - Card game:       "bid:number|pass|fold"
   * - Trading game:    "buy:amount|sell:amount|hold"
   * - Free-form JSON:  "json:{type,x,y,data}"
   */
  actionSchema: string;
  /** 32-byte SHA256 hash of your game rules. Use `createHash('sha256').update(rulesText).digest()` */
  rulesHash: Uint8Array;
  /** Optional creator stake bond in USDC lamports. Slashed if arena is abandoned. Default: 0 */
  stakeBondAmount?: number;
  /** Entry gate: agents must have completed this many arenas. Default: 0 (no gate) */
  minArenasCompleted?: number;
  /** Entry gate: agents must have this many wins. Default: 0 */
  minWins?: number;
  /** Entry gate: profile must be this old in seconds. Default: 0 */
  minRegistrationAge?: number;
}

/**
 * Parameters for submitting a round's results.
 * @example
 * await sdk.submitElimination(arenaId, {
 *   merkleRoot: computeMerkleRoot(leaves),
 *   roundNumber: 1,
 *   eliminated: [entryPda1, entryPda2],
 *   scores: [{ entry: entryPda0, score: 300 }],
 *   entryAccounts: allEntryPdas,
 * });
 */
export interface SubmitEliminationParams {
  /** 32-byte Merkle root of all game actions this round */
  merkleRoot: Uint8Array;
  /** Must be exactly currentRound + 1 */
  roundNumber: number;
  /** Entry PDAs of agents to eliminate */
  eliminated: PublicKey[];
  /** Score updates for agents */
  scores: ScoreUpdate[];
  /** ALL entry PDAs (passed as Solana remaining accounts) */
  entryAccounts: PublicKey[];
}

/**
 * Parameters for ending an arena.
 * @example
 * await sdk.finalizeArena(arenaId, {
 *   merkleRoot: computeMerkleRoot(finalLeaves),
 *   winners: [{ entry: winnerPda, rank: 1 }],
 *   entryAccounts: allEntryPdas,
 * });
 */
export interface FinalizeArenaParams {
  /** Final Merkle root */
  merkleRoot: Uint8Array;
  /** Prize rank assignments */
  winners: PrizeAssignment[];
  /** ALL entry PDAs */
  entryAccounts: PublicKey[];
}

/** Score update for a single agent. */
export interface ScoreUpdate {
  /** Agent's PublicKey (GameServer resolves to entry PDA internally) */
  entry: PublicKey;
  /** New score value */
  score: number;
}

/** Prize rank assignment for a winner. */
export interface PrizeAssignment {
  /** Winner's entry PDA */
  entry: PublicKey;
  /** Prize rank: 1 = first, 2 = second, etc. */
  rank: number;
}

/**
 * Sensible defaults for a battle royale arena.
 * Spread and override: `{ ...BATTLE_ROYALE_TEMPLATE, entryFee: 10_000_000 }`
 */
export const BATTLE_ROYALE_TEMPLATE: CreateArenaConfig = {
  entryFee: 5_000_000,          // 5 USDC
  maxAgents: 20,
  minAgents: 2,
  duration: 3600,                // 1 hour
  eliminationInterval: 600,      // 10 minutes
  eliminationPercent: 25,        // bottom 25%
  creatorFeeBps: 500,            // 5% creator fee
  prizeSplit: [60, 30, 10],      // 1st/2nd/3rd
  actionSchema: "move,attack,defend",
  rulesHash: new Uint8Array(32),
  stakeBondAmount: 0,
  minArenasCompleted: 0,
  minWins: 0,
  minRegistrationAge: 0,
};

// --- GameServer types ---

/**
 * Configuration for the GameServer class.
 * @example
 * const server = new GameServer(connection, keypair, {
 *   entryFee: 10_000_000,
 *   maxAgents: 20,
 *   prizeSplit: [60, 30, 10],
 *   actionSchema: "up,down,left,right",
 * });
 */
export interface GameServerConfig {
  /** Entry fee in USDC lamports */
  entryFee: number;
  /** Maximum participants */
  maxAgents: number;
  /** Minimum to start. Default: 2 */
  minAgents?: number;
  /** Prize distribution percentages. Must sum to 100. */
  prizeSplit: number[];
  /** Valid actions string. See CreateArenaConfig.actionSchema for examples. */
  actionSchema: string;
  /** Arena duration in seconds. Default: 3600 */
  duration?: number;
  /** Seconds between elimination rounds */
  eliminationInterval?: number;
  /** Creator fee in basis points (0-2000) */
  creatorFeeBps?: number;
  /** Creator stake bond in USDC lamports */
  stakeBondAmount?: number;
  /** Max RPC retry attempts. Default: 3 */
  retryAttempts?: number;
  /** Base retry delay in ms (exponential backoff). Default: 1000 */
  retryBaseDelay?: number;
  /** Skip all RPC calls — for testing. Default: false */
  mock?: boolean;
}

/**
 * A single game action, hashed into Merkle leaves.
 * The `snakeId` field is the agent identifier (named after the reference snake game).
 * @example
 * const action: GameAction = {
 *   snakeId: "agent-0",   // agent identifier (any string)
 *   round: 1,
 *   tick: 42,
 *   action: "up",         // must match actionSchema
 *   result: "moved",      // or "died", "scored", etc.
 *   score: 15,
 * };
 */
export interface GameAction {
  /** Agent identifier. Named "snakeId" after the reference game — use for any agent ID. */
  snakeId: string;
  /** Round number */
  round: number;
  /** Tick number within the round */
  tick: number;
  /** The action taken. Should match the arena's actionSchema. */
  action: string;
  /** Result of the action: "moved", "died", "scored", etc. */
  result: string;
  /** Agent's score at this point */
  score: number;
}

/** Result of submitting a round via GameServer.reportRound(). */
export interface RoundReport {
  /** Whether the on-chain transaction was confirmed */
  confirmed: boolean;
  /** Solana transaction signature (undefined in mock mode) */
  tx?: string;
  /** Round number that was submitted */
  round: number;
}

/**
 * Arena info from GameServer.getArenaInfo().
 * Note: entryFee and prizePool are in HUMAN-READABLE USDC (not lamports).
 * This is different from all other fee fields in the SDK.
 */
export interface ArenaInfo {
  arenaId: number;
  /** Entry fee in USDC (already divided by 1e6 — NOT lamports) */
  entryFee: number;
  /** Total prize pool in USDC (already divided by 1e6 — NOT lamports) */
  prizePool: number;
  prizeSplit: number[];
  currentRound: number;
  phase: string;
  /** Arena PDA as base58 string */
  arenaPda: string;
  explorerUrl?: string;
}

/**
 * Filter for listArenas().
 * Note: only supports 3 of 6 states. For cancelled/abandoned, use listArenas()
 * without a filter and check arena.state manually.
 */
export interface ArenaFilter {
  /** Filter by state. Only "registration", "active", "finished" supported. */
  state?: "registration" | "active" | "finished";
  /** Max entry fee in USDC lamports */
  maxEntryFee?: number;
  /** Filter by creator wallet */
  creator?: PublicKey;
}
