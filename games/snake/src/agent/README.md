# Bot Strategies

This directory contains bot AI strategies for the snake game demo.

## Interface

```ts
type StrategyFn = (myId: string, state: GameState) => Direction;
```

A strategy receives your snake's ID and the full game state, and returns a direction to move: `"up"` | `"down"` | `"left"` | `"right"`.

## GameState Fields

| Field | Type | Description |
|---|---|---|
| `snakes` | `Snake[]` | All snakes. Each has `id`, `body` (positions, head is `body[0]`), `alive`, `score`, `direction` |
| `food` | `Food[]` | Active food items. Each has `position` |
| `safeZone` | `{ minX, maxX, minY, maxY }` | Grid bounds — shrinks over time |
| `round` | `number` | Current round number |
| `roundTimeLeft` | `number` | Milliseconds remaining in the round |

## Built-in Strategies

| Name | Behavior |
|---|---|
| `greedy` | Moves toward the nearest food, avoids walls and bodies |
| `cautious` | Like greedy, but steers away from other snakes' heads (distance > 3) |
| `aggressive` | Hunts the nearest living snake's head, falls back to greedy when alone |
| `random` | Picks a random safe direction each tick |

## Adding a Custom Strategy

1. Write your function in `strategies.ts`:

```ts
export const myStrategy: StrategyFn = (myId, state) => {
  const safe = safeDirs(myId, state);
  if (safe.length === 0) return state.snakes.find(s => s.id === myId)!.direction;
  // your logic here
  return safe[0];
};
```

2. Add it to the `STRATEGIES` map at the bottom of `strategies.ts`:

```ts
export const STRATEGIES: Record<string, StrategyFn> = {
  greedy,
  cautious,
  aggressive,
  random,
  myStrategy,  // add here
};
```

3. Update the bot roster in `server.ts` to use `"myStrategy"` as the strategy name when calling `botRunner.addBot()`.

## Tips

- **`safeDirs(myId, state)`** — returns all directions that won't immediately kill you (not a wall, not a body segment, not the reverse of current direction). Always start here.
- **`dist(a, b)`** — Manhattan distance between two positions. Use for finding nearest food or nearest snake.
- **Head is `body[0]`** — `snake.body[0]` is the head. `body[body.length - 1]` is the tail (safest square to target since it will move away).
- **Stay near center in late rounds** — `safeZone` shrinks as the game progresses. In late rounds, favor moves toward `{ x: (safeZone.minX + safeZone.maxX) / 2, y: (safeZone.minY + safeZone.maxY) / 2 }` to avoid getting cornered by the shrinking boundary.
- **Skip dead snakes** — always check `snake.alive` before using a snake as a target or obstacle.
