// games/snake/web/src/lib/commentary.ts
import type { GameState } from "./ws";
import { getPersonality } from "./bots";
import type { GameEvent } from "@ritarena/ui";

/**
 * Derive UI commentary events from game state transitions.
 * Called with (prevState, nextState) — returns new events fired this tick.
 */
export function deriveCommentary(
  prev: GameState | null,
  next: GameState,
  nowMs: number,
): GameEvent[] {
  const events: GameEvent[] = [];

  // Game started
  if (!prev && next.snakes.length > 0) {
    events.push({
      message: `${next.snakes.length} SNAKES ENTER THE ARENA`,
      type: "system",
      timestamp: nowMs,
    });
  }

  if (!prev) return events;

  // Snake eliminated
  for (const snake of next.snakes) {
    const prevSnake = prev.snakes.find((s) => s.id === snake.id);
    if (prevSnake?.alive && !snake.alive) {
      const personality = getPersonality(snake.id);
      events.push({
        message: `${personality?.name ?? snake.id.toUpperCase()} ELIMINATED`,
        type: "elimination",
        timestamp: nowMs,
      });
    }
  }

  // Survivor count milestones
  const prevAlive = prev.snakes.filter((s) => s.alive).length;
  const nextAlive = next.snakes.filter((s) => s.alive).length;
  if (nextAlive < prevAlive) {
    if (nextAlive === 3) {
      events.push({
        message: "ONLY 3 LEFT. FINAL STRETCH.",
        type: "hype",
        timestamp: nowMs + 1,
      });
    } else if (nextAlive === 2) {
      events.push({
        message: "HEADS UP. 1v1 INCOMING.",
        type: "hype",
        timestamp: nowMs + 1,
      });
    } else if (nextAlive === 1) {
      const winner = next.snakes.find((s) => s.alive);
      const personality = winner ? getPersonality(winner.id) : null;
      events.push({
        message: `${personality?.name ?? "WINNER"} TAKES THE POOL`,
        type: "hype",
        timestamp: nowMs + 1,
      });
    }
  }

  // Zone shrink detected (approximate — when safeZone shrinks)
  const prevZoneSize =
    (prev.safeZone.maxX - prev.safeZone.minX) * (prev.safeZone.maxY - prev.safeZone.minY);
  const nextZoneSize =
    (next.safeZone.maxX - next.safeZone.minX) * (next.safeZone.maxY - next.safeZone.minY);
  if (nextZoneSize < prevZoneSize) {
    events.push({
      message: "ZONE SHRINKING. MOVE OR DIE.",
      type: "system",
      timestamp: nowMs,
    });
  }

  return events;
}
