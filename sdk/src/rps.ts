/**
 * Rock Paper Scissors resolver for N-player arenas. Each player's score is
 * the number of opponents they beat in pairwise comparison.
 */

export type RpsChoice = "rock" | "paper" | "scissors";

const BEATS: Record<RpsChoice, RpsChoice> = {
  rock: "scissors",
  paper: "rock",
  scissors: "paper",
};

/**
 * Resolve one RPS round among N players.
 * Returns an array of scores aligned with the input: score[i] = number of
 * other players that player i beats this round. A tie (same choice) is 0.
 */
export function resolveRpsRound(choices: readonly RpsChoice[]): number[] {
  const scores = new Array<number>(choices.length).fill(0);
  for (let i = 0; i < choices.length; i++) {
    for (let j = 0; j < choices.length; j++) {
      if (i === j) continue;
      if (BEATS[choices[i]] === choices[j]) {
        scores[i] += 1;
      }
    }
  }
  return scores;
}
