export enum GamePhase {
  WAITING = "waiting",
  COUNTDOWN = "countdown",
  PLAYING = "playing",
}

export enum PlayerState {
  NORMAL = "normal",
  STUNNED = "stunned",
}

export enum ClientRole {
  AGENT = "agent",
  PLAYER = "player",
  SPECTATOR = "spectator",
}

export type ClientConnection = {
  id: string;
  role: ClientRole;
  playerId?: string;
  pubkey?: string;
};

export type Player = {
  id: string;
  pubkey: string;
  name?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  state: PlayerState;
  stunTime: number;
  invulnTime: number;
  maxHp: number;
  moveSpeed: number;
  attackCooldownMax: number;
  bulletSpeed: number;
  bulletSize: number;
  knockbackOut: number;
  knockbackIn: number;
  attackCooldown: number;
  dirX: number;
  dirY: number;
  score: number;
  upgradePoints: number;
  upgradeLevel: number;
};

export type Attack = {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  damage: number;
};

export type Zone = {
  id: string;
  x: number;
  y: number;
  radius: number;
  ownerId: string | null;
  ownerName: string | null;
  captureProgress: Record<string, number>;
};

export type GameState = {
  players: Player[];
  zones: Zone[];
  width: number;
  height: number;
  phase: GamePhase;
  attacks: Attack[];
  waitTime: number;
  roundTime: number;
  eventTimeInterval: number;
};

export type ActionMessage =
  | { type: "move"; dx: number; dy: number }
  | { type: "attack"; dirX?: number; dirY?: number };

export type EngineActionLog = {
  type: "move" | "attack" | "hit";
  playerId: string;
  targetId?: string;
  value?: number;
};

export type EngineRoundReport = {
  eliminatedPlayerIds: string[];
  scores: Array<{
    playerId: string;
    score: number;
  }>;
  actions: EngineActionLog[];
};
