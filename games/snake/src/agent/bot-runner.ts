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
