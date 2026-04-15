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
