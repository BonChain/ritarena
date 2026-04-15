// Client classes
export { RitArena } from "./client";
export { RitArenaReader } from "./reader";

// PDA helpers
export { pdas } from "./pda";

// Constants
export {
  PROGRAM_ID,
  REGISTRATION_FEE,
  PROTOCOL_FEE_BPS,
  MAX_CREATOR_FEE_BPS,
  MAX_AGENTS_PER_ARENA,
  MAX_NAME_LEN,
  MAX_PRIZE_SLOTS,
  MAX_ACTION_SCHEMA_LEN,
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

// Merkle helpers
export { hashLeaf, computeMerkleRoot } from "./merkle";

// IDL
export { IDL } from "./idl";

// Errors
export { RitArenaError, arenaStateLabel } from "./errors";
export type { ErrorCode } from "./errors";
