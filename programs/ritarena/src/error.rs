use anchor_lang::prelude::*;

#[error_code]
pub enum RitArenaError {
    #[msg("Name too long (max 32 bytes)")]
    NameTooLong,
    #[msg("Creator fee too high (max 20%)")]
    CreatorFeeTooHigh,
    #[msg("Prize split percentages must sum to 100")]
    InvalidPrizeSplit,
    #[msg("Too many prize slots (max 10)")]
    TooManyPrizeSlots,
    #[msg("Max agents must be >= 2")]
    TooFewMaxAgents,
    #[msg("Max agents exceeds limit")]
    TooManyMaxAgents,
    #[msg("Elimination percent must be 1-99")]
    InvalidEliminationPercent,
    #[msg("Arena is not in Registration state")]
    ArenaNotRegistering,
    #[msg("Arena is full")]
    ArenaFull,
    #[msg("Agent does not meet minimum requirements")]
    RequirementsNotMet,
    #[msg("Arena is not in Active or Eliminating state")]
    ArenaNotActive,
    #[msg("Unauthorized oracle")]
    UnauthorizedOracle,
    #[msg("Round number must increment by 1")]
    InvalidRoundNumber,
    #[msg("Arena is not in Finished state")]
    ArenaNotFinished,
    #[msg("Agent was not a winner")]
    NotAWinner,
    #[msg("Prize already claimed")]
    AlreadyClaimed,
    #[msg("Creator fee already claimed")]
    CreatorFeeAlreadyClaimed,
    #[msg("Stake bond already returned")]
    BondAlreadyReturned,
    #[msg("Arena is not in Abandoned or Cancelled state")]
    ArenaNotRefundable,
    #[msg("Entry already refunded")]
    AlreadyRefunded,
    #[msg("Arena has not timed out yet")]
    ArenaNotTimedOut,
    #[msg("Arena is not in Active or Eliminating state for abandonment")]
    CannotAbandon,
    #[msg("Arithmetic overflow")]
    MathOverflow,
    #[msg("Duration must be > 0")]
    InvalidDuration,
    #[msg("Elimination interval must be > 0")]
    InvalidEliminationInterval,
    #[msg("Action schema too long")]
    ActionSchemaTooLong,
    #[msg("Arena has no stake bond")]
    NoStakeBond,
    #[msg("Min agents not reached before start")]
    MinAgentsNotReached,
    #[msg("Invalid USDC mint (must have 6 decimals)")]
    InvalidUsdcMint,
    #[msg("Treasury account does not match protocol treasury")]
    InvalidTreasury,
    #[msg("Elimination interval out of bounds (10s - 86400s)")]
    EliminationIntervalOutOfBounds,
    #[msg("Duration exceeds maximum (30 days)")]
    DurationTooLong,
    #[msg("Registration period has expired — arena never started")]
    RegistrationExpired,
    #[msg("Caller is not authorized to abandon this arena")]
    UnauthorizedAbandon,
}
