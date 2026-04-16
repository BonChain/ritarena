import type { Direction, GameState, Position } from "../game/types.js";

export type StrategyFn = (myId: string, state: GameState) => Direction;

const ALL_DIRS: Direction[] = ["up", "down", "left", "right"];

const OPPOSITES: Record<Direction, Direction> = {
  up: "down", down: "up", left: "right", right: "left",
};

const DIR_DELTA: Record<Direction, Position> = {
  up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
  left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
};

function nextPos(head: Position, dir: Direction): Position {
  const d = DIR_DELTA[dir];
  return { x: head.x + d.x, y: head.y + d.y };
}

function isSafe(pos: Position, state: GameState, myId: string): boolean {
  const z = state.safeZone;
  if (pos.x < z.minX || pos.x > z.maxX || pos.y < z.minY || pos.y > z.maxY) return false;
  for (const s of state.snakes) {
    if (!s.alive) continue;
    const start = s.id === myId ? 1 : 0;
    for (let i = start; i < s.body.length; i++) {
      if (s.body[i].x === pos.x && s.body[i].y === pos.y) return false;
    }
  }
  return true;
}

function safeDirs(myId: string, state: GameState): Direction[] {
  const me = state.snakes.find((s) => s.id === myId)!;
  return ALL_DIRS
    .filter((d) => OPPOSITES[d] !== me.direction)
    .filter((d) => isSafe(nextPos(me.body[0], d), state, myId));
}

function dist(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function dirToward(head: Position, target: Position, safe: Direction[]): Direction {
  let best = safe[0];
  let bestDist = Infinity;
  for (const d of safe) {
    const p = nextPos(head, d);
    const dd = dist(p, target);
    if (dd < bestDist) { bestDist = dd; best = d; }
  }
  return best;
}

/** Move toward nearest food, basic wall avoidance */
export const greedy: StrategyFn = (myId, state) => {
  const me = state.snakes.find((s) => s.id === myId)!;
  const safe = safeDirs(myId, state);
  if (safe.length === 0) return me.direction;

  if (state.food.length === 0) return safe[0];

  let nearest = state.food[0];
  let nearestDist = dist(me.body[0], nearest.position);
  for (const f of state.food) {
    const d = dist(me.body[0], f.position);
    if (d < nearestDist) { nearestDist = d; nearest = f; }
  }

  return dirToward(me.body[0], nearest.position, safe);
};

/** Avoid other snakes (distance > 3), then seek food */
export const cautious: StrategyFn = (myId, state) => {
  const me = state.snakes.find((s) => s.id === myId)!;
  const safe = safeDirs(myId, state);
  if (safe.length === 0) return me.direction;

  const cautionDirs = safe.filter((d) => {
    const p = nextPos(me.body[0], d);
    return state.snakes.every((s) => {
      if (s.id === myId || !s.alive) return true;
      return dist(p, s.body[0]) > 3;
    });
  });

  const dirs = cautionDirs.length > 0 ? cautionDirs : safe;

  if (state.food.length === 0) return dirs[0];

  let nearest = state.food[0];
  let nearestDist = dist(me.body[0], nearest.position);
  for (const f of state.food) {
    const d = dist(me.body[0], f.position);
    if (d < nearestDist) { nearestDist = d; nearest = f; }
  }

  return dirToward(me.body[0], nearest.position, dirs);
};

/** Move toward nearest snake's head to block it */
export const aggressive: StrategyFn = (myId, state) => {
  const me = state.snakes.find((s) => s.id === myId)!;
  const safe = safeDirs(myId, state);
  if (safe.length === 0) return me.direction;

  const others = state.snakes.filter((s) => s.id !== myId && s.alive);
  if (others.length === 0) return greedy(myId, state);

  let nearest = others[0];
  let nearestDist = dist(me.body[0], nearest.body[0]);
  for (const o of others) {
    const d = dist(me.body[0], o.body[0]);
    if (d < nearestDist) { nearestDist = d; nearest = o; }
  }

  return dirToward(me.body[0], nearest.body[0], safe);
};

/** Pick a random safe direction */
export const random: StrategyFn = (myId, state) => {
  const me = state.snakes.find((s) => s.id === myId)!;
  const safe = safeDirs(myId, state);
  if (safe.length === 0) return me.direction;
  return safe[Math.floor(Math.random() * safe.length)];
};

export const STRATEGIES: Record<string, StrategyFn> = {
  greedy,
  cautious,
  aggressive,
  random,
};
