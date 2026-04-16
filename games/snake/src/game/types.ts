export type Direction = "up" | "down" | "left" | "right";

export interface Position {
  x: number;
  y: number;
}

export interface Snake {
  id: string;
  body: Position[];        // head is body[0]
  direction: Direction;
  alive: boolean;
  score: number;
  strategy: string;        // e.g., "greedy", "cautious"
  color: string;
}

export interface Food {
  position: Position;
}

export interface SafeZone {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface GameState {
  snakes: Snake[];
  food: Food[];
  safeZone: SafeZone;
  round: number;
  roundTimeLeft: number;    // ms remaining in current round
  tickCount: number;
  gameOver: boolean;
  winner: string | null;    // snake id
}

export interface TickResult {
  deaths: string[];         // snake ids that died this tick
}

export interface RoundEndResult {
  roundNumber: number;
  deaths: string[];         // snake ids that died during this round
  scores: Map<string, number>;
}
