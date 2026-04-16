# Snake Game Example — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable slither.io-style snake game example that demonstrates RitArena SDK integration — AI bots compete on a shrinking map with round-based on-chain elimination.

**Architecture:** Three-layer structure: `game/` (pure snake logic), `agent/` (bot strategies), `ritarena_sdk/` (reusable on-chain adapter). Server orchestrates all three, clients spectate via WebSocket. Mock adapter is default, `--devnet` flag for real Solana.

**Tech Stack:** TypeScript, `ws` (WebSocket), vanilla HTML Canvas, `@ritarena/sdk`

---

## File Map

| File | Responsibility |
|------|---------------|
| `examples/snake-game/package.json` | Project config, scripts (`npm start`, `npm start --devnet`) |
| `examples/snake-game/tsconfig.json` | TypeScript config |
| `examples/snake-game/src/game/types.ts` | `Direction`, `Position`, `Snake`, `Food`, `SafeZone`, `GameState`, `TickResult` |
| `examples/snake-game/src/game/constants.ts` | `GRID_SIZE`, `CELL_SIZE`, `TICK_MS`, `ROUND_DURATION_MS`, `SHRINK_PERCENT`, `FOOD_COUNT` |
| `examples/snake-game/src/game/engine.ts` | `GameEngine` class: `tick()`, `spawnFood()`, `shrinkZone()`, collision detection |
| `examples/snake-game/src/agent/strategies.ts` | `greedy`, `cautious`, `aggressive`, `random` strategy functions |
| `examples/snake-game/src/agent/bot-runner.ts` | `BotRunner` class: connects bots to engine, calls `decideMove()` each tick |
| `examples/snake-game/src/agent/README.md` | Guide for agent developers: how to write a custom strategy |
| `examples/snake-game/src/ritarena_sdk/adapter.ts` | `ArenaAdapter` interface + `RoundResult`, `BotIdentity`, `GameAction` types |
| `examples/snake-game/src/ritarena_sdk/mock-adapter.ts` | `MockAdapter` — in-memory, logs to console + emits events for UI |
| `examples/snake-game/src/ritarena_sdk/merkle.ts` | `hashLeaf()`, `computeMerkleRoot()` |
| `examples/snake-game/src/ritarena_sdk/devnet-adapter.ts` | `DevnetAdapter` — real `@ritarena/sdk` calls |
| `examples/snake-game/src/ritarena_sdk/setup-devnet.ts` | Script: airdrop SOL + fund USDC for bot keypairs |
| `examples/snake-game/src/server.ts` | Entry point: parse args, create adapter, run game loop, serve static files + WS |
| `examples/snake-game/src/game/renderer.js` | Client-side Canvas renderer (loaded by index.html) |
| `examples/snake-game/public/index.html` | UI shell: canvas + scoreboard + log panel |
| `examples/snake-game/README.md` | Quick start, architecture, devnet setup, how to extend |

---

### Task 1: Project Scaffolding

**Files:**
- Create: `examples/snake-game/package.json`
- Create: `examples/snake-game/tsconfig.json`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@ritarena/example-snake-game",
  "version": "0.1.0",
  "private": true,
  "description": "Slither.io-style snake game example for RitArena SDK",
  "scripts": {
    "build": "tsc",
    "start": "npx tsx src/server.ts",
    "start:devnet": "npx tsx src/server.ts --devnet",
    "setup:devnet": "npx tsx src/ritarena_sdk/setup-devnet.ts"
  },
  "dependencies": {
    "@ritarena/sdk": "file:../../packages/sdk",
    "ws": "^8.18.0"
  },
  "devDependencies": {
    "@types/ws": "^8.5.14",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "public"]
}
```

- [ ] **Step 3: Install dependencies**

Run: `cd examples/snake-game && npm install`
Expected: `node_modules/` created, `@ritarena/sdk` linked from `../../packages/sdk`

- [ ] **Step 4: Verify TypeScript setup**

Create a temporary `src/test-setup.ts`:
```ts
import { BATTLE_ROYALE_TEMPLATE } from "@ritarena/sdk";
console.log("SDK linked:", BATTLE_ROYALE_TEMPLATE.maxAgents);
```

Run: `cd examples/snake-game && npx tsx src/test-setup.ts`
Expected: `SDK linked: 20`

Then delete `src/test-setup.ts`.

- [ ] **Step 5: Commit**

```bash
git add examples/snake-game/package.json examples/snake-game/tsconfig.json examples/snake-game/package-lock.json
git commit -m "chore: scaffold snake-game example project"
```

---

### Task 2: Game Types and Constants

**Files:**
- Create: `examples/snake-game/src/game/types.ts`
- Create: `examples/snake-game/src/game/constants.ts`

- [ ] **Step 1: Create game types**

```ts
// examples/snake-game/src/game/types.ts

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
```

- [ ] **Step 2: Create game constants**

```ts
// examples/snake-game/src/game/constants.ts

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
```

- [ ] **Step 3: Commit**

```bash
git add examples/snake-game/src/game/types.ts examples/snake-game/src/game/constants.ts
git commit -m "feat(snake): add game types and constants"
```

---

### Task 3: Game Engine

**Files:**
- Create: `examples/snake-game/src/game/engine.ts`

- [ ] **Step 1: Write the GameEngine class**

```ts
// examples/snake-game/src/game/engine.ts

import {
  GRID_SIZE,
  FOOD_COUNT,
  SHRINK_PERCENT,
  ROUND_DURATION_MS,
  INITIAL_SNAKE_LENGTH,
  STRATEGY_COLORS,
} from "./constants.js";
import type {
  Direction,
  Position,
  Snake,
  Food,
  SafeZone,
  GameState,
  TickResult,
  RoundEndResult,
} from "./types.js";

const DIRECTION_DELTA: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITES: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export class GameEngine {
  snakes: Snake[] = [];
  food: Food[] = [];
  safeZone: SafeZone;
  round = 1;
  roundTimer = ROUND_DURATION_MS;
  tickCount = 0;
  gameOver = false;
  winner: string | null = null;
  private roundDeaths: string[] = [];

  constructor() {
    this.safeZone = { minX: 0, minY: 0, maxX: GRID_SIZE - 1, maxY: GRID_SIZE - 1 };
  }

  addSnake(id: string, strategy: string): void {
    const pos = this.findSpawnPosition();
    const body: Position[] = [];
    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
      body.push({ x: pos.x, y: pos.y + i });
    }
    this.snakes.push({
      id,
      body,
      direction: "up",
      alive: true,
      score: 0,
      strategy,
      color: STRATEGY_COLORS[strategy] || "#ffffff",
    });
  }

  private findSpawnPosition(): Position {
    const zone = this.safeZone;
    const margin = 3;
    for (let attempt = 0; attempt < 100; attempt++) {
      const x = zone.minX + margin + Math.floor(Math.random() * (zone.maxX - zone.minX - margin * 2));
      const y = zone.minY + margin + INITIAL_SNAKE_LENGTH + Math.floor(Math.random() * (zone.maxY - zone.minY - margin * 2 - INITIAL_SNAKE_LENGTH));
      const occupied = this.snakes.some((s) =>
        s.body.some((b) => Math.abs(b.x - x) < 3 && Math.abs(b.y - y) < 3)
      );
      if (!occupied) return { x, y };
    }
    return {
      x: zone.minX + margin + Math.floor(Math.random() * (zone.maxX - zone.minX - margin * 2)),
      y: zone.minY + margin + INITIAL_SNAKE_LENGTH,
    };
  }

  setDirection(snakeId: string, dir: Direction): void {
    const snake = this.snakes.find((s) => s.id === snakeId);
    if (!snake || !snake.alive) return;
    if (OPPOSITES[dir] === snake.direction) return;
    snake.direction = dir;
  }

  spawnFood(): void {
    while (this.food.length < FOOD_COUNT) {
      const zone = this.safeZone;
      const pos: Position = {
        x: zone.minX + Math.floor(Math.random() * (zone.maxX - zone.minX + 1)),
        y: zone.minY + Math.floor(Math.random() * (zone.maxY - zone.minY + 1)),
      };
      const onSnake = this.snakes.some((s) =>
        s.alive && s.body.some((b) => b.x === pos.x && b.y === pos.y)
      );
      if (!onSnake) {
        this.food.push({ position: pos });
      }
    }
  }

  tick(deltaMs: number): TickResult {
    if (this.gameOver) return { deaths: [] };

    this.tickCount++;
    this.roundTimer -= deltaMs;

    const aliveSnakes = this.snakes.filter((s) => s.alive);
    for (const snake of aliveSnakes) {
      const head = snake.body[0];
      const delta = DIRECTION_DELTA[snake.direction];
      const newHead: Position = { x: head.x + delta.x, y: head.y + delta.y };
      snake.body.unshift(newHead);
      snake.body.pop();
    }

    for (const snake of aliveSnakes) {
      const head = snake.body[0];
      const foodIndex = this.food.findIndex(
        (f) => f.position.x === head.x && f.position.y === head.y
      );
      if (foodIndex !== -1) {
        this.food.splice(foodIndex, 1);
        snake.score++;
        const tail = snake.body[snake.body.length - 1];
        snake.body.push({ ...tail });
      }
    }

    const deaths: string[] = [];
    for (const snake of aliveSnakes) {
      if (this.isColliding(snake)) {
        snake.alive = false;
        deaths.push(snake.id);
      }
    }

    this.roundDeaths.push(...deaths);
    this.spawnFood();

    const stillAlive = this.snakes.filter((s) => s.alive);
    if (stillAlive.length <= 1) {
      this.gameOver = true;
      if (stillAlive.length === 1) {
        this.winner = stillAlive[0].id;
      } else {
        const sorted = [...this.snakes].sort((a, b) => b.score - a.score);
        this.winner = sorted[0].id;
      }
    }

    return { deaths };
  }

  private isColliding(snake: Snake): boolean {
    const head = snake.body[0];
    const zone = this.safeZone;

    if (head.x < zone.minX || head.x > zone.maxX || head.y < zone.minY || head.y > zone.maxY) {
      return true;
    }

    for (let i = 1; i < snake.body.length; i++) {
      if (snake.body[i].x === head.x && snake.body[i].y === head.y) return true;
    }

    for (const other of this.snakes) {
      if (other.id === snake.id || !other.alive) continue;
      for (const seg of other.body) {
        if (seg.x === head.x && seg.y === head.y) return true;
      }
    }

    return false;
  }

  endRound(): RoundEndResult | null {
    if (this.gameOver) return null;
    if (this.roundTimer > 0) return null;

    const result: RoundEndResult = {
      roundNumber: this.round,
      deaths: [...this.roundDeaths],
      scores: new Map(this.snakes.map((s) => [s.id, s.score])),
    };

    const width = this.safeZone.maxX - this.safeZone.minX;
    const height = this.safeZone.maxY - this.safeZone.minY;
    const shrinkX = Math.floor(width * SHRINK_PERCENT / 2);
    const shrinkY = Math.floor(height * SHRINK_PERCENT / 2);
    this.safeZone.minX += shrinkX;
    this.safeZone.minY += shrinkY;
    this.safeZone.maxX -= shrinkX;
    this.safeZone.maxY -= shrinkY;

    for (const snake of this.snakes.filter((s) => s.alive)) {
      if (this.isColliding(snake)) {
        snake.alive = false;
        result.deaths.push(snake.id);
      }
    }

    this.food = this.food.filter(
      (f) =>
        f.position.x >= this.safeZone.minX &&
        f.position.x <= this.safeZone.maxX &&
        f.position.y >= this.safeZone.minY &&
        f.position.y <= this.safeZone.maxY
    );
    this.spawnFood();

    const stillAlive = this.snakes.filter((s) => s.alive);
    if (stillAlive.length <= 1) {
      this.gameOver = true;
      if (stillAlive.length === 1) {
        this.winner = stillAlive[0].id;
      } else {
        const sorted = [...this.snakes].sort((a, b) => b.score - a.score);
        this.winner = sorted[0].id;
      }
    }

    this.round++;
    this.roundTimer = ROUND_DURATION_MS;
    this.roundDeaths = [];

    return result;
  }

  getState(): GameState {
    return {
      snakes: this.snakes.map((s) => ({ ...s, body: [...s.body] })),
      food: [...this.food],
      safeZone: { ...this.safeZone },
      round: this.round,
      roundTimeLeft: this.roundTimer,
      tickCount: this.tickCount,
      gameOver: this.gameOver,
      winner: this.winner,
    };
  }
}
```

- [ ] **Step 2: Manually test the engine works**

Create a temporary `src/test-engine.ts`:
```ts
import { GameEngine } from "./game/engine.js";

const engine = new GameEngine();
engine.addSnake("test-1", "greedy");
engine.addSnake("test-2", "random");
engine.spawnFood();

for (let i = 0; i < 10; i++) {
  const result = engine.tick(100);
  if (result.deaths.length > 0) console.log("Deaths:", result.deaths);
}

const state = engine.getState();
console.log("Snakes alive:", state.snakes.filter(s => s.alive).length);
console.log("Food count:", state.food.length);
console.log("Round:", state.round);
console.log("Engine works!");
```

Run: `cd examples/snake-game && npx tsx src/test-engine.ts`
Expected: Output showing snakes alive, food count, round number, "Engine works!"

Then delete `src/test-engine.ts`.

- [ ] **Step 3: Commit**

```bash
git add examples/snake-game/src/game/engine.ts
git commit -m "feat(snake): add game engine — movement, collision, food, zone shrink"
```

---

### Task 4: Bot Strategies

**Files:**
- Create: `examples/snake-game/src/agent/strategies.ts`
- Create: `examples/snake-game/src/agent/bot-runner.ts`
- Create: `examples/snake-game/src/agent/README.md`

- [ ] **Step 1: Write strategy functions**

```ts
// examples/snake-game/src/agent/strategies.ts

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
```

- [ ] **Step 2: Write BotRunner**

```ts
// examples/snake-game/src/agent/bot-runner.ts

import type { GameEngine } from "../game/engine.js";
import { STRATEGIES, type StrategyFn } from "./strategies.js";

export interface BotConfig {
  id: string;
  strategy: string;
}

export class BotRunner {
  private bots: Array<{ id: string; strategy: StrategyFn }> = [];

  addBot(config: BotConfig): void {
    const strategyFn = STRATEGIES[config.strategy];
    if (!strategyFn) throw new Error(`Unknown strategy: ${config.strategy}`);
    this.bots.push({ id: config.id, strategy: strategyFn });
  }

  update(engine: GameEngine): void {
    const state = engine.getState();
    for (const bot of this.bots) {
      const snake = state.snakes.find((s) => s.id === bot.id);
      if (!snake || !snake.alive) continue;
      const dir = bot.strategy(bot.id, state);
      engine.setDirection(bot.id, dir);
    }
  }
}
```

- [ ] **Step 3: Write agent README**

Create `examples/snake-game/src/agent/README.md` with:
- Interface explanation: `StrategyFn = (myId: string, state: GameState) => Direction`
- `GameState` fields: `snakes`, `food`, `safeZone`, `round`, `roundTimeLeft`
- Step-by-step: write function, add to `STRATEGIES` map, update bot roster in `server.ts`
- Tips: use `safeDirs()`, `dist()`, head is `body[0]`, stay near center in late rounds

- [ ] **Step 4: Commit**

```bash
git add examples/snake-game/src/agent/
git commit -m "feat(snake): add bot strategies — greedy, cautious, aggressive, random"
```

---

### Task 5: ArenaAdapter Interface + MockAdapter

**Files:**
- Create: `examples/snake-game/src/ritarena_sdk/adapter.ts`
- Create: `examples/snake-game/src/ritarena_sdk/merkle.ts`
- Create: `examples/snake-game/src/ritarena_sdk/mock-adapter.ts`

- [ ] **Step 1: Write ArenaAdapter interface**

```ts
// examples/snake-game/src/ritarena_sdk/adapter.ts

import type { Keypair } from "@solana/web3.js";
import type { CreateArenaConfig } from "@ritarena/sdk";

export interface GameAction {
  snakeId: string;
  round: number;
  tick: number;
  action: string;
  result: string;
  score: number;
}

export interface BotIdentity {
  botId: string;
  keypair: Keypair;
}

export interface RoundResult {
  roundNumber: number;
  deaths: BotIdentity[];
  scores: Map<string, number>;
  actions: GameAction[];
}

export interface ArenaAdapterEvents {
  onLog: (message: string) => void;
}

export interface ArenaAdapter {
  createArena(config: CreateArenaConfig): Promise<{ arenaId: number; tx: string }>;
  registerProfile(botName: string, keypair: Keypair): Promise<void>;
  enterArena(arenaId: number, keypair: Keypair): Promise<string>;
  startArena(arenaId: number): Promise<void>;
  submitElimination(arenaId: number, round: RoundResult): Promise<void>;
  finalizeArena(arenaId: number, winner: BotIdentity, allBots: BotIdentity[]): Promise<void>;
}
```

- [ ] **Step 2: Write Merkle tree helpers**

```ts
// examples/snake-game/src/ritarena_sdk/merkle.ts

import { createHash } from "crypto";
import type { GameAction } from "./adapter.js";

export function hashLeaf(action: GameAction): Buffer {
  const data = `${action.round}:${action.tick}:${action.snakeId}:${action.action}:${action.result}:${action.score}`;
  return createHash("sha256").update(data).digest();
}

export function computeMerkleRoot(leaves: Buffer[]): Buffer {
  if (leaves.length === 0) return Buffer.alloc(32);
  if (leaves.length === 1) return leaves[0];

  const next: Buffer[] = [];
  for (let i = 0; i < leaves.length; i += 2) {
    const left = leaves[i];
    const right = i + 1 < leaves.length ? leaves[i + 1] : left;
    const combined =
      Buffer.compare(left, right) < 0
        ? Buffer.concat([left, right])
        : Buffer.concat([right, left]);
    next.push(createHash("sha256").update(combined).digest());
  }
  return computeMerkleRoot(next);
}
```

- [ ] **Step 3: Write MockAdapter**

```ts
// examples/snake-game/src/ritarena_sdk/mock-adapter.ts

import { Keypair } from "@solana/web3.js";
import type { CreateArenaConfig } from "@ritarena/sdk";
import type { ArenaAdapter, RoundResult, BotIdentity, ArenaAdapterEvents } from "./adapter.js";
import { hashLeaf, computeMerkleRoot } from "./merkle.js";

export class MockAdapter implements ArenaAdapter {
  private arenaCount = 0;
  private events: ArenaAdapterEvents;

  constructor(events: ArenaAdapterEvents) {
    this.events = events;
  }

  private log(msg: string): void {
    const formatted = `[RitArena] ${msg}`;
    console.log(formatted);
    this.events.onLog(formatted);
  }

  async createArena(config: CreateArenaConfig): Promise<{ arenaId: number; tx: string }> {
    const arenaId = this.arenaCount++;
    const tx = `mock-tx-create-${arenaId}`;
    this.log(`createArena -> arenaId: ${arenaId}, maxAgents: ${config.maxAgents}, prizeSplit: [${config.prizeSplit}]`);
    return { arenaId, tx };
  }

  async registerProfile(botName: string, _keypair: Keypair): Promise<void> {
    this.log(`registerProfile -> "${botName}" registered`);
  }

  async enterArena(arenaId: number, keypair: Keypair): Promise<string> {
    const tx = `mock-tx-enter-${keypair.publicKey.toBase58().slice(0, 8)}`;
    this.log(`enterArena -> ${keypair.publicKey.toBase58().slice(0, 8)}... entered arena ${arenaId}`);
    return tx;
  }

  async startArena(arenaId: number): Promise<void> {
    this.log(`startArena -> arena ${arenaId} now Active`);
  }

  async submitElimination(arenaId: number, round: RoundResult): Promise<void> {
    const leaves = round.actions.map(hashLeaf);
    const root = computeMerkleRoot(leaves);
    const deathNames = round.deaths.map((d) => d.botId).join(", ") || "none";
    const scores = Array.from(round.scores.entries())
      .map(([id, s]) => `${id}:${s}`)
      .join(", ");
    this.log(
      `submitElimination -> round ${round.roundNumber}, eliminated: [${deathNames}], ` +
      `scores: [${scores}], merkle: ${root.toString("hex").slice(0, 12)}...`
    );
  }

  async finalizeArena(arenaId: number, winner: BotIdentity, _allBots: BotIdentity[]): Promise<void> {
    this.log(`finalizeArena -> arena ${arenaId}, winner: ${winner.botId} (rank 1)`);
  }
}
```

- [ ] **Step 4: Verify mock adapter works**

Create `src/test-mock.ts`:
```ts
import { Keypair } from "@solana/web3.js";
import { BATTLE_ROYALE_TEMPLATE } from "@ritarena/sdk";
import { MockAdapter } from "./ritarena_sdk/mock-adapter.js";

const adapter = new MockAdapter({ onLog: () => {} });

async function main() {
  const { arenaId } = await adapter.createArena({
    ...BATTLE_ROYALE_TEMPLATE,
    maxAgents: 4,
    prizeSplit: [100],
  });
  const kp = Keypair.generate();
  await adapter.registerProfile("test-bot", kp);
  await adapter.enterArena(arenaId, kp);
  await adapter.startArena(arenaId);
  console.log("Mock adapter works!");
}
main();
```

Run: `cd examples/snake-game && npx tsx src/test-mock.ts`
Expected: Log lines for each call + "Mock adapter works!"

Then delete `src/test-mock.ts`.

- [ ] **Step 5: Commit**

```bash
git add examples/snake-game/src/ritarena_sdk/adapter.ts examples/snake-game/src/ritarena_sdk/merkle.ts examples/snake-game/src/ritarena_sdk/mock-adapter.ts
git commit -m "feat(snake): add ArenaAdapter interface, MockAdapter, and Merkle helpers"
```

---

### Task 6: Server — Game Orchestration

**Files:**
- Create: `examples/snake-game/src/server.ts`

- [ ] **Step 1: Write the server**

```ts
// examples/snake-game/src/server.ts

import { createServer } from "http";
import { readFileSync } from "fs";
import { join, extname } from "path";
import { Keypair } from "@solana/web3.js";
import { BATTLE_ROYALE_TEMPLATE } from "@ritarena/sdk";
import { createHash } from "crypto";
import { WebSocketServer, WebSocket } from "ws";

import { GameEngine } from "./game/engine.js";
import { TICK_MS } from "./game/constants.js";
import { BotRunner, type BotConfig } from "./agent/bot-runner.js";
import { MockAdapter } from "./ritarena_sdk/mock-adapter.js";
import type { ArenaAdapter, BotIdentity, GameAction } from "./ritarena_sdk/adapter.js";

const PORT = 3000;
const useDevnet = process.argv.includes("--devnet");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
};

const BOT_ROSTER: BotConfig[] = [
  { id: "greedy-1", strategy: "greedy" },
  { id: "greedy-2", strategy: "greedy" },
  { id: "cautious-1", strategy: "cautious" },
  { id: "cautious-2", strategy: "cautious" },
  { id: "aggressive-1", strategy: "aggressive" },
  { id: "aggressive-2", strategy: "aggressive" },
  { id: "random-1", strategy: "random" },
  { id: "random-2", strategy: "random" },
];

async function main() {
  const logs: string[] = [];
  let adapter: ArenaAdapter;

  if (useDevnet) {
    const { DevnetAdapter } = await import("./ritarena_sdk/devnet-adapter.js");
    const fs = await import("fs");
    const path = await import("path");
    const keypairPath = path.join(process.env.HOME || "~", ".config/solana/id.json");
    const secret = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
    const oracleKeypair = Keypair.fromSecretKey(Uint8Array.from(secret));
    adapter = new DevnetAdapter(oracleKeypair, {
      onLog: (msg) => {
        logs.push(msg);
        broadcast({ type: "log", message: msg });
      },
    });
  } else {
    adapter = new MockAdapter({
      onLog: (msg) => {
        logs.push(msg);
        broadcast({ type: "log", message: msg });
      },
    });
  }

  console.log(`Mode: ${useDevnet ? "devnet" : "mock"}`);

  const rulesHash = createHash("sha256")
    .update("snake-game:slither-io-style:shrinking-map")
    .digest();

  const { arenaId } = await adapter.createArena({
    ...BATTLE_ROYALE_TEMPLATE,
    maxAgents: BOT_ROSTER.length,
    minAgents: 2,
    duration: 600,
    eliminationInterval: 700,
    eliminationPercent: 1,
    creatorFeeBps: 0,
    actionSchema: "up,down,left,right",
    prizeSplit: [100],
    rulesHash: new Uint8Array(rulesHash),
  });

  const botIdentities: Map<string, BotIdentity> = new Map();
  for (const bot of BOT_ROSTER) {
    const keypair = Keypair.generate();
    await adapter.registerProfile(bot.id, keypair);
    await adapter.enterArena(arenaId, keypair);
    botIdentities.set(bot.id, { botId: bot.id, keypair });
  }

  await adapter.startArena(arenaId);

  const engine = new GameEngine();
  const botRunner = new BotRunner();

  for (const bot of BOT_ROSTER) {
    engine.addSnake(bot.id, bot.strategy);
    botRunner.addBot(bot);
  }
  engine.spawnFood();

  const clients: Set<WebSocket> = new Set();

  function broadcast(data: object): void {
    const msg = JSON.stringify(data);
    for (const ws of clients) {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    }
  }

  const publicDir = join(import.meta.dirname, "..", "public");
  const rendererPath = join(import.meta.dirname, "game", "renderer.js");

  const server = createServer((req, res) => {
    let filePath: string;
    if (req.url === "/" || req.url === "/index.html") {
      filePath = join(publicDir, "index.html");
    } else if (req.url === "/renderer.js") {
      filePath = rendererPath;
    } else {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    try {
      const content = readFileSync(filePath);
      const ext = extname(filePath);
      res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "text/plain" });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  const wss = new WebSocketServer({ server });
  wss.on("connection", (ws) => {
    clients.add(ws);
    ws.send(JSON.stringify({ type: "state", state: engine.getState() }));
    for (const log of logs) {
      ws.send(JSON.stringify({ type: "log", message: log }));
    }
    ws.on("close", () => clients.delete(ws));
  });

  let roundActions: GameAction[] = [];

  const gameLoop = setInterval(async () => {
    if (engine.gameOver) {
      clearInterval(gameLoop);
      const winnerId = engine.winner!;
      const winnerBot = botIdentities.get(winnerId)!;
      await adapter.finalizeArena(arenaId, winnerBot, Array.from(botIdentities.values()));
      broadcast({ type: "state", state: engine.getState() });
      console.log(`\nGame over! Winner: ${winnerId}`);
      return;
    }

    botRunner.update(engine);

    for (const snake of engine.snakes.filter((s) => s.alive)) {
      roundActions.push({
        snakeId: snake.id,
        round: engine.round,
        tick: engine.tickCount,
        action: snake.direction,
        result: "moved",
        score: snake.score,
      });
    }

    const tickResult = engine.tick(TICK_MS);

    for (const deathId of tickResult.deaths) {
      const snake = engine.snakes.find((s) => s.id === deathId)!;
      roundActions.push({
        snakeId: deathId,
        round: engine.round,
        tick: engine.tickCount,
        action: snake.direction,
        result: "died",
        score: snake.score,
      });
    }

    const roundEnd = engine.endRound();
    if (roundEnd && roundEnd.deaths.length > 0) {
      const deathBots = roundEnd.deaths
        .map((id) => botIdentities.get(id))
        .filter((b): b is BotIdentity => b !== undefined);

      await adapter.submitElimination(arenaId, {
        roundNumber: roundEnd.roundNumber,
        deaths: deathBots,
        scores: roundEnd.scores,
        actions: roundActions,
      });
      roundActions = [];
    } else if (roundEnd) {
      roundActions = [];
    }

    broadcast({ type: "state", state: engine.getState() });
  }, TICK_MS);

  server.listen(PORT, () => {
    console.log(`\nSnake Game running at http://localhost:${PORT}`);
    console.log(`${BOT_ROSTER.length} bots competing, ${useDevnet ? "devnet" : "mock"} mode`);
    console.log("Open the URL in your browser to watch!\n");
  });
}

main().catch(console.error);
```

- [ ] **Step 2: Verify server starts**

Run: `cd examples/snake-game && npx tsx src/server.ts`
Expected: Server starts, prints "Snake Game running at http://localhost:3000". Ctrl+C to stop.

- [ ] **Step 3: Commit**

```bash
git add examples/snake-game/src/server.ts
git commit -m "feat(snake): add game server — orchestrates engine, bots, and RitArena adapter"
```

---

### Task 7: Client UI — HTML + Canvas Renderer

**Files:**
- Create: `examples/snake-game/public/index.html`
- Create: `examples/snake-game/src/game/renderer.js`

- [ ] **Step 1: Write index.html**

Create `examples/snake-game/public/index.html` with:
- Header bar: title "RitArena Snake Game", mode badge (MOCK), status badge (CONNECTING/LIVE)
- Main area: canvas (800x800) on left, sidebar on right with round info + scoreboard
- Bottom: log panel for RitArena SDK calls
- Winner overlay (hidden by default, shown on game over)
- CSS: dark theme (#0a0a0a background), monospace font, #14F195 accent color
- Loads `/renderer.js` script

- [ ] **Step 2: Write client-side renderer**

Create `examples/snake-game/src/game/renderer.js` as an IIFE that:
- Connects to WebSocket at `ws://${location.host}`
- On `state` message: renders canvas (safe zone, food, snakes), updates scoreboard + round info
- On `log` message: appends to log panel using safe DOM methods (createElement + textContent, no innerHTML)
- Canvas rendering: red-tinted danger zone outside safe zone, dashed red border, yellow food circles, colored snakes with eyes on head
- Scoreboard: build each `<li>` using `document.createElement()` and `textContent` for all text content
- Log entries: build each `<div>` using `document.createElement()` and `textContent`
- Winner overlay: set `textContent` on winner name element, add `show` class

All DOM manipulation MUST use safe methods (`createElement`, `textContent`, `appendChild`). Do NOT use `innerHTML` anywhere — all text content comes from the game server and must be treated as untrusted.

- [ ] **Step 3: Test full flow — start server, open browser**

Run: `cd examples/snake-game && npx tsx src/server.ts`

Open `http://localhost:3000` in browser.

Expected:
- Canvas shows 8 snakes moving, eating food
- Scoreboard updates in real-time
- Safe zone shrinks every 30 seconds (red dashed border)
- Log panel shows `[RitArena]` SDK calls
- Game ends with winner overlay when one snake remains

- [ ] **Step 4: Commit**

```bash
git add examples/snake-game/public/index.html examples/snake-game/src/game/renderer.js
git commit -m "feat(snake): add client UI — canvas renderer, scoreboard, RitArena log panel"
```

---

### Task 8: DevnetAdapter

**Files:**
- Create: `examples/snake-game/src/ritarena_sdk/devnet-adapter.ts`
- Create: `examples/snake-game/src/ritarena_sdk/setup-devnet.ts`

- [ ] **Step 1: Write DevnetAdapter**

```ts
// examples/snake-game/src/ritarena_sdk/devnet-adapter.ts

import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  RitArena,
  pdas,
  type CreateArenaConfig,
  type SubmitEliminationParams,
  type FinalizeArenaParams,
} from "@ritarena/sdk";
import type { ArenaAdapter, RoundResult, BotIdentity, ArenaAdapterEvents } from "./adapter.js";
import { hashLeaf, computeMerkleRoot } from "./merkle.js";

const RPC_URL = "https://api.devnet.solana.com";
const EXPLORER_BASE = "https://explorer.solana.com/tx";

export class DevnetAdapter implements ArenaAdapter {
  private connection: Connection;
  private oracleKeypair: Keypair;
  private sdk: RitArena;
  private events: ArenaAdapterEvents;
  // Maps bot public key (base58) to their PDAs
  private botPdas: Map<string, { profilePda: PublicKey; entryPda: PublicKey }> = new Map();
  // Maps botId to public key for score lookups
  private botIdToPublicKey: Map<string, string> = new Map();
  private allEntryPdas: PublicKey[] = [];

  constructor(oracleKeypair: Keypair, events: ArenaAdapterEvents) {
    this.connection = new Connection(RPC_URL, "confirmed");
    this.oracleKeypair = oracleKeypair;
    this.sdk = RitArena.fromKeypair(this.connection, oracleKeypair);
    this.events = events;
  }

  private log(msg: string): void {
    const formatted = `[RitArena] ${msg}`;
    console.log(formatted);
    this.events.onLog(formatted);
  }

  async createArena(config: CreateArenaConfig): Promise<{ arenaId: number; tx: string }> {
    const result = await this.sdk.createArena(config);
    this.log(`createArena -> arenaId: ${result.arenaId}, tx: ${result.tx}`);
    this.log(`  Explorer: ${EXPLORER_BASE}/${result.tx}?cluster=devnet`);
    return result;
  }

  async registerProfile(botName: string, keypair: Keypair): Promise<void> {
    const botSdk = RitArena.fromKeypair(this.connection, keypair);
    const existing = await botSdk.getProfile(keypair.publicKey);
    if (existing) {
      this.log(`registerProfile -> "${botName}" already registered`);
      return;
    }
    const tx = await botSdk.registerProfile(botName);
    this.log(`registerProfile -> "${botName}" registered (tx: ${tx})`);
  }

  async enterArena(arenaId: number, keypair: Keypair): Promise<string> {
    const botSdk = RitArena.fromKeypair(this.connection, keypair);
    const tx = await botSdk.enterArena(arenaId);

    const profilePda = pdas.agentProfile(keypair.publicKey);
    const arenaPda = pdas.arena(arenaId);
    const entryPda = pdas.arenaEntry(arenaPda, profilePda);
    const pubkey58 = keypair.publicKey.toBase58();
    this.botPdas.set(pubkey58, { profilePda, entryPda });
    this.allEntryPdas.push(entryPda);

    this.log(`enterArena -> ${pubkey58.slice(0, 8)}... (tx: ${tx})`);
    return tx;
  }

  // Must be called after enterArena to map botId to public key
  registerBotMapping(botId: string, keypair: Keypair): void {
    this.botIdToPublicKey.set(botId, keypair.publicKey.toBase58());
  }

  async startArena(arenaId: number): Promise<void> {
    const tx = await this.sdk.startArena(arenaId);
    this.log(`startArena -> arena ${arenaId} (tx: ${tx})`);
  }

  async submitElimination(arenaId: number, round: RoundResult): Promise<void> {
    const leaves = round.actions.map(hashLeaf);
    const merkleRoot = computeMerkleRoot(leaves);

    const eliminated = round.deaths.map((d) => {
      const pubkey58 = d.keypair.publicKey.toBase58();
      const pdaInfo = this.botPdas.get(pubkey58);
      if (!pdaInfo) throw new Error(`No entry PDA for bot ${d.botId}`);
      return pdaInfo.entryPda;
    });

    const scores = this.allEntryPdas.map((entryPda) => ({
      entry: entryPda,
      score: 0,
    }));

    const params: SubmitEliminationParams = {
      merkleRoot: new Uint8Array(merkleRoot),
      roundNumber: round.roundNumber,
      eliminated,
      scores,
      entryAccounts: this.allEntryPdas,
    };

    const tx = await this.sdk.submitElimination(arenaId, params);
    this.log(`submitElimination -> round ${round.roundNumber} (tx: ${tx})`);
    this.log(`  Explorer: ${EXPLORER_BASE}/${tx}?cluster=devnet`);
  }

  async finalizeArena(arenaId: number, winner: BotIdentity, _allBots: BotIdentity[]): Promise<void> {
    const pubkey58 = winner.keypair.publicKey.toBase58();
    const winnerPda = this.botPdas.get(pubkey58);
    if (!winnerPda) throw new Error(`No entry PDA for winner ${winner.botId}`);

    const leaves = [Buffer.from(`final:${winner.botId}`)];
    const merkleRoot = computeMerkleRoot(leaves);

    const params: FinalizeArenaParams = {
      merkleRoot: new Uint8Array(merkleRoot),
      winners: [{ entry: winnerPda.entryPda, rank: 1 }],
      entryAccounts: this.allEntryPdas,
    };

    const tx = await this.sdk.finalizeArena(arenaId, params);
    this.log(`finalizeArena -> winner: ${winner.botId} (tx: ${tx})`);
    this.log(`  Explorer: ${EXPLORER_BASE}/${tx}?cluster=devnet`);
  }
}
```

- [ ] **Step 2: Write setup-devnet script**

```ts
// examples/snake-game/src/ritarena_sdk/setup-devnet.ts

import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createHash } from "crypto";
import * as fs from "fs";
import * as path from "path";

const RPC_URL = "https://api.devnet.solana.com";
const BOT_COUNT = 8;
const SOL_PER_BOT = 0.05;

function loadKeypair(): Keypair {
  const keypairPath = path.join(
    process.env.HOME || "~",
    ".config/solana/id.json"
  );
  const secret = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

function deriveBotKeypair(master: Keypair, index: number): Keypair {
  const seed = createHash("sha256")
    .update(Buffer.from(master.secretKey))
    .update(Buffer.from([index]))
    .digest();
  return Keypair.fromSeed(seed.slice(0, 32));
}

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");
  const master = loadKeypair();

  console.log("Master wallet:", master.publicKey.toBase58());
  console.log(`Setting up ${BOT_COUNT} bot keypairs...\n`);

  const balance = await connection.getBalance(master.publicKey);
  const needed = BOT_COUNT * SOL_PER_BOT * LAMPORTS_PER_SOL;
  if (balance < needed) {
    console.log(`Need ${needed / LAMPORTS_PER_SOL} SOL, have ${balance / LAMPORTS_PER_SOL} SOL`);
    console.log("Run: solana airdrop 2");
    process.exit(1);
  }

  for (let i = 0; i < BOT_COUNT; i++) {
    const botKp = deriveBotKeypair(master, i);
    console.log(`Bot ${i}: ${botKp.publicKey.toBase58().slice(0, 12)}...`);

    const botBalance = await connection.getBalance(botKp.publicKey);
    if (botBalance < SOL_PER_BOT * LAMPORTS_PER_SOL) {
      const sig = await connection.requestAirdrop(
        botKp.publicKey,
        SOL_PER_BOT * LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(sig);
      console.log(`  Airdropped ${SOL_PER_BOT} SOL`);
    } else {
      console.log(`  Already has ${botBalance / LAMPORTS_PER_SOL} SOL`);
    }
  }

  console.log("\nSetup complete! Bot keypairs are derived deterministically.");
  console.log("Run: npm run start:devnet");
}

main().catch(console.error);
```

- [ ] **Step 3: Commit**

```bash
git add examples/snake-game/src/ritarena_sdk/devnet-adapter.ts examples/snake-game/src/ritarena_sdk/setup-devnet.ts
git commit -m "feat(snake): add DevnetAdapter and devnet setup script"
```

---

### Task 9: README

**Files:**
- Create: `examples/snake-game/README.md`

- [ ] **Step 1: Write README**

Contents:
- **Quick Start**: `npm install && npm start`, open http://localhost:3000
- **What You'll See**: canvas + scoreboard + RitArena log panel
- **Architecture**: ASCII diagram showing Browser -> Server -> game/ + agent/ + ritarena_sdk/ -> Solana
- **Folder Structure table**: ritarena_sdk/ (game devs, reusable), game/ (game devs, replace), agent/ (agent devs)
- **Game Rules**: 8 bots, 40x40 grid, eat food, die on collision, zone shrinks 15% every 30s, last alive wins
- **Devnet Mode**: setup steps (solana config, airdrop, setup:devnet, start:devnet)
- **How to Write Your Own Bot**: pointer to agent/README.md + quick example
- **How to Adapt for Your Own Game**: keep ritarena_sdk/, replace game/ and agent/, update server.ts

- [ ] **Step 2: Commit**

```bash
git add examples/snake-game/README.md
git commit -m "docs(snake): add README with quick start, architecture, and extension guide"
```

---

### Task 10: End-to-End Test (Mock Mode)

- [ ] **Step 1: Run the full demo in mock mode**

```bash
cd examples/snake-game && npm start
```

Open http://localhost:3000 in a browser.

Verify:
- [ ] 8 snakes appear on canvas with correct colors (green, blue, red, gray)
- [ ] Snakes move, eat food, collide and die
- [ ] Scoreboard shows all bots with live scores
- [ ] Round counter counts down from 30
- [ ] Safe zone shrinks (red dashed border moves inward) at round end
- [ ] RitArena Log Panel shows createArena, registerProfile x8, enterArena x8, startArena
- [ ] submitElimination appears in logs when snakes die at round end
- [ ] Game ends with winner overlay
- [ ] finalizeArena appears in logs with winner name

- [ ] **Step 2: Fix any issues found during testing**

- [ ] **Step 3: Final commit**

```bash
git add -A examples/snake-game/
git commit -m "feat(snake): complete snake game example — runnable demo with RitArena integration"
```
