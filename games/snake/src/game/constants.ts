export const GRID_SIZE = 40;          // 40x40 cells
export const CELL_SIZE = 20;          // 20px per cell -> 800x800 canvas
export const TICK_MS = 100;           // server tick every 100ms
export const ROUND_DURATION_MS = 30_000; // 30 seconds per round
export const SHRINK_PERCENT = 0.15;   // shrink 15% per round
export const FOOD_COUNT = 10;         // maintain 10 food items
export const INITIAL_SNAKE_LENGTH = 3;

export const STRATEGY_COLORS: Record<string, string> = {
  greedy: "#22c55e",     // green
  cautious: "#3b82f6",   // blue
  aggressive: "#ef4444", // red
  random: "#9ca3af",     // gray
};

export function botLabel(id: string): string {
  // "greedy-1" -> "G1", "cautious-2" -> "C2", "aggressive-1" -> "A1", "random-1" -> "R1"
  const parts = id.split("-");
  return (parts[0][0].toUpperCase() + (parts[1] || "")).slice(0, 2);
}
