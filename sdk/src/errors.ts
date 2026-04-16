// sdk/src/errors.ts

export type ErrorCode =
  | "PROTOCOL_NOT_INITIALIZED"
  | "ARENA_NOT_FOUND"
  | "ARENA_ALREADY_FINISHED"
  | "ARENA_NOT_ACTIVE"
  | "ARENA_NOT_REGISTRATION"
  | "INVALID_PHASE"
  | "INVALID_ROUND"
  | "PROFILE_NOT_FOUND"
  | "INSUFFICIENT_SOL"
  | "INSUFFICIENT_USDC"
  | "NO_USDC_ACCOUNT"
  | "ENTRY_NOT_FOUND"
  | "NOT_ENOUGH_AGENTS"
  | "ROUND_IN_PROGRESS"
  | "WINNER_NOT_FOUND"
  | "WINNERS_MISMATCH";

export class RitArenaError extends Error {
  code: ErrorCode;
  suggestion: string;

  constructor(code: ErrorCode, message: string, suggestion: string) {
    super(message);
    this.name = "RitArenaError";
    this.code = code;
    this.suggestion = suggestion;
  }
}

export function arenaStateLabel(state: Record<string, unknown>): string {
  return Object.keys(state)[0] ?? "unknown";
}
