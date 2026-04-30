// Client classes
export { RitArena } from "./client";
export { RitArenaReader } from "./reader";

// PDA helpers
export { pdas } from "./pda";

// Constants
export {
  PROGRAM_ID,
  PROTOCOL_FEE_BPS,
  MAX_CREATOR_FEE_BPS,
  MAX_AGENTS_PER_ARENA,
  MAX_NAME_LEN,
  MAX_PRIZE_SLOTS,
  MAX_ACTION_SCHEMA_LEN,
  MAX_TEST_USDC_PER_CALL,
} from "./constants";

// Types
export type {
  Arena,
  AgentProfile,
  ArenaEntry,
  ProtocolConfig,
  ArenaState,
  CreateArenaConfig,
  SubmitEliminationParams,
  FinalizeArenaParams,
  ScoreUpdate,
  PrizeAssignment,
  GameServerConfig,
  GameAction,
  RoundReport,
  ArenaInfo,
  ArenaFilter,
} from "./types";

export { BATTLE_ROYALE_TEMPLATE } from "./types";

// GameServer
export { GameServer } from "./game-server";
export type { LogEntry } from "./game-server";

// Explorer URL helpers
export { txExplorerUrl, addressExplorerUrl } from "./explorer";
export type { SolanaCluster } from "./explorer";

// Merkle helpers
export { hashLeaf, computeMerkleRoot } from "./merkle";

// IDL
export { IDL } from "./idl";

// Errors
export { RitArenaError, arenaStateLabel } from "./errors";
export type { ErrorCode } from "./errors";

// RPS helpers
export { resolveRpsRound } from "./rps";
export type { RpsChoice } from "./rps";
