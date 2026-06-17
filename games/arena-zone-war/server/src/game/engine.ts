import {
  Attack,
  EngineActionLog,
  EngineRoundReport,
  GamePhase,
  GameState,
  Player,
  PlayerState,
  Zone,
} from "./types.js";

import { updatePhysics } from "./physics.js";
import { config } from "../config.js";

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

const inZone = (player: Player, zone: Zone) => dist(player, zone) <= zone.radius;

const getZoneCount = (playerCount: number) => {
  if (playerCount >= 9) return 3;
  if (playerCount >= 5) return 2;
  return 1;
};

type GameEngineOptions = {
  minPlayers: number;
  maxPlayers: number;
};

export class GameEngine {
  state: GameState;
  readonly minPlayers: number;
  readonly maxPlayers: number;

  private eliminateInterval = 10;
  private eliminateStartTime = 0;
  private eliminatedThisRound: string[] = [];
  private actionLog: EngineActionLog[] = [];
  /** True only after a match ends (top 3). Distinct from lobby WAITING before first match. */
  private matchEnded = false;

  constructor(options?: Partial<GameEngineOptions>) {
    this.minPlayers = options?.minPlayers ?? config.game.minPlayers;
    this.maxPlayers = options?.maxPlayers ?? config.game.maxPlayers;

    this.state = {
      width: config.game.map.width,
      height: config.game.map.height,
      players: [],
      zones: [],
      attacks: [],
      phase: GamePhase.WAITING,
      waitTime: config.game.waitTime,
      roundTime: config.game.roundTime,
      eventTimeInterval: 0,
    };
  }

  update(dt: number) {
    if (this.state.phase === GamePhase.WAITING) {
      this.waiting();
      return;
    }

    if (this.state.phase === GamePhase.COUNTDOWN) {
      this.countdown(dt);
      return;
    }

    this.playing(dt);
  }

  handleMove(player: Player, dx: number, dy: number) {
    const len = Math.hypot(dx, dy) || 1;
    const speed = player.moveSpeed || config.game.player.speed;

    player.vx = (dx / len) * speed;
    player.vy = (dy / len) * speed;
    player.dirX = dx / len;
    player.dirY = dy / len;

    this.actionLog.push({
      type: "move",
      playerId: player.id,
    });
  }

  handleAttack(player: Player) {
    if (player.attackCooldown > 0) return;

    player.attackCooldown = config.game.attack.cooldown;

    this.actionLog.push({
      type: "attack",
      playerId: player.id,
    });

    const speed = 30;
    const len = Math.hypot(player.dirX, player.dirY) || 1;

    const attack: Attack = {
      id: crypto.randomUUID(),
      ownerId: player.id,
      x: player.x,
      y: player.y,
      vx: (player.dirX / len) * speed,
      vy: (player.dirY / len) * speed,
      life: 1,
      damage: config.game.attack.damage,
    };

    this.state.attacks.push(attack);
  }

  consumeRoundReport(): EngineRoundReport {
    const report: EngineRoundReport = {
      eliminatedPlayerIds: this.eliminatedThisRound,
      scores: this.getScores(),
      actions: this.actionLog,
    };

    this.eliminatedThisRound = [];
    this.actionLog = [];

    return report;
  }

  getScores() {
    return this.state.players.map((player) => ({
      playerId: player.id,
      score: Math.floor(player.score),
    }));
  }

  getTop3() {
    return [...this.state.players]
      .sort((left, right) => right.score - left.score)
      .slice(0, 3)
      .map((player, index) => ({
        playerId: player.id,
        rank: index + 1,
      }));
  }

  isFinished() {
    return this.matchEnded;
  }

  private waiting() {
    if (
      this.state.players.length >= this.minPlayers &&
      this.state.players.length <= this.maxPlayers
    ) {
      this.matchEnded = false;
      this.state.phase = GamePhase.COUNTDOWN;
      this.state.waitTime = config.game.waitTime;
    }
  }

  private countdown(dt: number) {
    if (
      this.state.players.length < this.minPlayers ||
      this.state.players.length > this.maxPlayers
    ) {
      this.state.phase = GamePhase.WAITING;
      this.state.waitTime = config.game.waitTime;
      return;
    }

    this.state.waitTime -= dt;
    if (this.state.waitTime <= 0) {
      this.start();
    }
  }

  private playing(dt: number) {
    this.updatePlayers(dt);
    this.updateAttacks(dt);
    this.updateZones(dt);
    this.updateTimer(dt);
  }

  private resetPlayer(player: Player) {
    Object.assign(player, {
      hp: config.game.player.defaultHp,
      x: Math.random() * this.state.width,
      y: Math.random() * this.state.height,
      vx: 0,
      vy: 0,
      state: PlayerState.NORMAL,
      attackCooldown: 0,
      dirX: 1,
      dirY: 0,
      invulnTime: 0,
      stunTime: 0,
    });
  }

  private start() {
    const playerCount = this.state.players.length;

    this.state.zones = this.genZones(
      getZoneCount(playerCount),
      this.state.width,
      this.state.height,
    );
    this.state.roundTime = config.game.roundTime;
    this.state.eventTimeInterval = 0;

    const needToEliminate = Math.max(0, playerCount - 3);
    this.eliminateStartTime = needToEliminate * this.eliminateInterval;

    this.state.players.forEach((player) => {
      player.score = 0;
      this.resetPlayer(player);
    });

    this.state.phase = GamePhase.PLAYING;
  }

  private end() {
    this.matchEnded = true;
    this.state.phase = GamePhase.WAITING;
    this.state.waitTime = config.game.waitTime;
    this.state.attacks = [];
    this.state.zones = [];
  }

  private eliminateOne() {
    if (this.state.players.length <= 3) return;

    let lowestScorePlayer = this.state.players[0];

    for (const player of this.state.players) {
      if (player.score < lowestScorePlayer.score) {
        lowestScorePlayer = player;
      }
    }

    this.eliminatedThisRound.push(lowestScorePlayer.id);
    this.state.players = this.state.players.filter(
      (player) => player.id !== lowestScorePlayer.id,
    );
    this.state.zones = this.genZones(
      getZoneCount(this.state.players.length),
      this.state.width,
      this.state.height,
    );
  }

  private updateAttacks(dt: number) {
    const width = this.state.width;
    const height = this.state.height;

    for (const attack of this.state.attacks) {
      attack.x += attack.vx * dt;
      attack.y += attack.vy * dt;
      attack.life -= dt;

      if (
        attack.x < 0 ||
        attack.x > width ||
        attack.y < 0 ||
        attack.y > height ||
        attack.life <= 0
      ) {
        attack.life = 0;
        continue;
      }

      for (const player of this.state.players) {
        if (player.id === attack.ownerId) continue;
        if (player.invulnTime > 0) continue;

        const dx = player.x - attack.x;
        const dy = player.y - attack.y;
        const distance = Math.hypot(dx, dy);

        if (distance >= config.game.player.radius) {
          continue;
        }

        player.hp -= attack.damage;

        const normalX = dx / (distance || 1);
        const normalY = dy / (distance || 1);
        const force = config.game.attack.knockback;

        player.vx += normalX * force;
        player.vy += normalY * force;
        player.stunTime = config.game.attack.stun;
        player.invulnTime = config.game.attack.invuln;
        player.state = PlayerState.STUNNED;

        this.actionLog.push({
          type: "hit",
          playerId: attack.ownerId,
          targetId: player.id,
          value: attack.damage,
        });

        attack.life = 0;
        break;
      }
    }

    this.state.attacks = this.state.attacks.filter((attack) => attack.life > 0);
  }

  private updatePlayers(dt: number) {
    for (const player of this.state.players) {
      player.attackCooldown = Math.max(0, player.attackCooldown - dt);
      player.invulnTime = Math.max(0, player.invulnTime - dt);

      if (player.state === PlayerState.STUNNED) {
        player.stunTime -= dt;
        if (player.stunTime <= 0) {
          player.state = PlayerState.NORMAL;
        }
      }

      updatePhysics(player, dt);

      if (player.hp <= 0) {
        player.score -= config.game.player.deathPenalty;
        this.resetPlayer(player);
      }
    }
  }

  private updateZones(dt: number) {
    for (const zone of this.state.zones) {
      const insidePlayers = this.state.players.filter((player) => inZone(player, zone));
      const insidePlayerIds = new Set(insidePlayers.map((p) => p.id));

      for (const playerId in zone.captureProgress) {
        if (!insidePlayerIds.has(playerId)) {
          zone.captureProgress[playerId] = 0;
        }
      }

      for (const player of insidePlayers) {
        zone.captureProgress[player.id] = (zone.captureProgress[player.id] || 0) + dt;
      }

      let bestPlayerId: string | null = null;
      let bestProgress = 0;

      for (const player of insidePlayers) {
        const progress = zone.captureProgress[player.id] || 0;
        if (progress > bestProgress) {
          bestProgress = progress;
          bestPlayerId = player.id;
        }
      }

      zone.ownerId = bestPlayerId;
        const owner = this.state.players.find((p) => p.id === bestPlayerId);
        zone.ownerName = owner?.name ?? null;

      if (bestPlayerId && bestProgress > 0) {
        const owner = this.state.players.find((p) => p.id === bestPlayerId);
        if (owner) {
          owner.score += dt * config.game.zone.scoreRate;
        }
      }
    }
  }

  private updateTimer(dt: number) {
    this.state.roundTime -= dt;

    if (this.state.roundTime > this.eliminateStartTime) {
      return;
    }

    this.state.eventTimeInterval += dt;

    if (this.state.eventTimeInterval >= this.eliminateInterval) {
      this.eliminateOne();
      this.state.eventTimeInterval = 0;
    }

    if (this.state.players.length <= 3) {
      this.end();
    }
  }

  private genZones(count: number, width: number, height: number): Zone[] {
    const zones: Zone[] = [];

    while (zones.length < count) {
      zones.push({
        id: crypto.randomUUID(),
        x: Math.random() * width,
        y: Math.random() * height,
        radius: config.game.zone.radius,
        ownerId: null,
        ownerName: null,
        captureProgress: {},
      });
    }

    return zones;
  }
}
