export interface Player {
  id: string;
  name: string;
  score: number;
  alive: boolean;
  rank: number;
  color?: string;
  avatar?: string;
}

export interface GameEvent {
  message: string;
  type: "hype" | "elimination" | "score" | "system";
  timestamp: number;
}

export interface GodPower {
  id: string;
  label: string;
  icon: string;
  cooldown: number;
  cost: number;
}

export interface MatchWinner {
  name: string;
  prize: number;
}

export interface RitArenaTheme {
  accent?: string;
  accentGlow?: string;
  bg?: string;
  bgCard?: string;
  text?: string;
  textMuted?: string;
  border?: string;
  radius?: string;
  font?: string;
  fontMono?: string;
}
