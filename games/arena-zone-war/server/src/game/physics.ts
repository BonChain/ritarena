import { Player } from "./types.js";
import { config } from "../config.js";

export function updatePhysics(player: Player, dt: number) {
  // move
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  // friction
  player.vx *= config.game.player.friction;
  player.vy *= config.game.player.friction;

  // clamp map (อย่า hardcode 20 แล้ว)
  player.x = Math.max(0, Math.min(config.game.map.width, player.x));
  player.y = Math.max(0, Math.min(config.game.map.height, player.y));
}