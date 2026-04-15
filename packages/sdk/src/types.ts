import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

// --- On-chain account types (manually defined from IDL) ---

export interface ProtocolConfig {
  authority: PublicKey;
  usdcMint: PublicKey;
  treasury: PublicKey;
  totalArenas: BN;
  bump: number;
}

export interface AgentProfile {
  owner: PublicKey;
  name: string;
  registeredAt: BN;
  arenasEntered: BN;
  arenasCompleted: BN;
  wins: BN;
  top3: BN;
  eliminations: BN;
  totalEarnings: BN;
  bump: number;
}

export interface Arena {
  id: BN;
  creator: PublicKey;
  oracle: PublicKey;
  usdcMint: PublicKey;
  entryFee: BN;
  maxAgents: number;
  minAgents: number;
  duration: BN;
  eliminationInterval: BN;
  eliminationPercent: number;
  creatorFeeBps: number;
  prizeSplit: number[];
  actionSchema: string;
  rulesHash: number[];
  minArenasCompleted: BN;
  minWins: BN;
  minRegistrationAge: BN;
  state: ArenaState;
  currentAgents: number;
  aliveAgents: number;
  currentRound: number;
  startedAt: BN;
  lastSubmissionAt: BN;
  latestMerkleRoot: number[];
  totalEntryFees: BN;
  sponsorDeposit: BN;
  stakeBondAmount: BN;
  creatorFeeClaimed: boolean;
  bondReturned: boolean;
  protocolFeeCollected: boolean;
  bump: number;
  vaultBump: number;
  bondVaultBump: number;
}

export interface ArenaEntry {
  arena: PublicKey;
  agentProfile: PublicKey;
  owner: PublicKey;
  score: BN;
  alive: boolean;
  prizeRank: number;
  prizeClaimed: boolean;
  refunded: boolean;
  bump: number;
}

export type ArenaState =
  | { registration: Record<string, never> }
  | { active: Record<string, never> }
  | { eliminating: Record<string, never> }
  | { finished: Record<string, never> }
  | { cancelled: Record<string, never> }
  | { abandoned: Record<string, never> };

// --- SDK config types ---

export interface CreateArenaConfig {
  entryFee: number;
  maxAgents: number;
  minAgents: number;
  duration: number;
  eliminationInterval: number;
  eliminationPercent: number;
  creatorFeeBps: number;
  prizeSplit: number[];
  actionSchema: string;
  rulesHash: Uint8Array;
  stakeBondAmount?: number;
  minArenasCompleted?: number;
  minWins?: number;
  minRegistrationAge?: number;
}

export interface SubmitEliminationParams {
  merkleRoot: Uint8Array;
  roundNumber: number;
  eliminated: PublicKey[];
  scores: ScoreUpdate[];
  entryAccounts: PublicKey[];
}

export interface FinalizeArenaParams {
  merkleRoot: Uint8Array;
  winners: PrizeAssignment[];
  entryAccounts: PublicKey[];
}

export interface ScoreUpdate {
  entry: PublicKey;
  score: number;
}

export interface PrizeAssignment {
  entry: PublicKey;
  rank: number;
}

export const BATTLE_ROYALE_TEMPLATE: CreateArenaConfig = {
  entryFee: 5_000_000,
  maxAgents: 20,
  minAgents: 2,
  duration: 3600,
  eliminationInterval: 600,
  eliminationPercent: 25,
  creatorFeeBps: 500,
  prizeSplit: [60, 30, 10],
  actionSchema: "move,attack,defend",
  rulesHash: new Uint8Array(32),
  stakeBondAmount: 0,
  minArenasCompleted: 0,
  minWins: 0,
  minRegistrationAge: 0,
};

// --- GameServer types ---

export interface GameServerConfig {
  entryFee: number;
  maxAgents: number;
  minAgents?: number;
  prizeSplit: number[];
  actionSchema: string;
  duration?: number;
  eliminationInterval?: number;
  creatorFeeBps?: number;
  stakeBondAmount?: number;
  retryAttempts?: number;
  retryBaseDelay?: number;
  mock?: boolean;
}

export interface GameAction {
  snakeId: string;
  round: number;
  tick: number;
  action: string;
  result: string;
  score: number;
}

export interface RoundReport {
  confirmed: boolean;
  tx?: string;
  round: number;
}

export interface ArenaInfo {
  arenaId: number;
  entryFee: number;
  prizePool: number;
  prizeSplit: number[];
  currentRound: number;
  phase: string;
  arenaPda: string;
  explorerUrl?: string;
}

export interface ArenaFilter {
  state?: "registration" | "active" | "finished";
  maxEntryFee?: number;
  creator?: PublicKey;
}
