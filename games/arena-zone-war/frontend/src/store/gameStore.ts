import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type Player = {
  id: string;
  pubkey?: string;
  name?: string;
  x: number;
  y: number;
  hp: number;
  score: number;
  dirX: number;
  dirY: number;
  invulnTime: number;
  attackCooldown: number;
};

export type Zone = {
  id: string;
  x: number;
  y: number;
  radius: number;
  ownerId: string | null;
  ownerName: string | null;
  captureProgress?: Record<string, number>;
};

export type Attack = {
  id: string;
  x: number;
  y: number;
};

export type GameState = {
  players: Player[];
  zones: Zone[];
  attacks: Attack[];
  width: number;
  height: number;
  phase: 'waiting' | 'countdown' | 'playing' | 'battle';
  roundTime: number;
  waitTime: number;
  eventTimeInterval?: number;
};

export type ArenaHistoryEntry = {
  arenaId: number;
  top3: Array<{
    rank: number;
    pubkey: string;
    name: string | null;
    prizeUsdc: number;
  }>;
  explorerUrl?: string;
};

export type HudMeta = {
  connected: boolean;
  arenaId: number | null;
  mode: string;
  socketId: string | null;
  lastError?: string | null;
  entryFee?: number;
  prizeSplit?: number[];
};

type GameStore = {
  gameState: GameState | null;
  hudMeta: HudMeta;
  history: ArenaHistoryEntry[];
  selectedHistoryIndex: number | null;
  config: any;
  playerId: string | null;

  setGameState: (state: GameState) => void;
  setHudMeta: (meta: Partial<HudMeta>) => void;
  setHistory: (history: ArenaHistoryEntry[]) => void;
  setSelectedHistoryIndex: (index: number | null) => void;
  setConfig: (config: any) => void;
  setPlayerId: (id: string | null) => void;
};

const defaultHudMeta: HudMeta = {
  connected: false,
  arenaId: sessionStorage.getItem("azw_arenaId")
    ? Number(sessionStorage.getItem("azw_arenaId"))
    : null,
  mode: sessionStorage.getItem("azw_mode") || "—",
  socketId: null,
  lastError: null,
  entryFee: undefined,
  prizeSplit: undefined,
};

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set) => ({
    gameState: null,
    hudMeta: defaultHudMeta,
    history: [],
    selectedHistoryIndex: null,
    config: null,
    playerId: null,

    setGameState: (state) =>
      set((s) => {
        if (deepEqual(s.gameState, state)) return s;
        return { gameState: state };
      }),

    setHudMeta: (meta) =>
      set((s) => ({ hudMeta: { ...s.hudMeta, ...meta } })),

    setHistory: (history) => set({ history }),

    setSelectedHistoryIndex: (index) => set({ selectedHistoryIndex: index }),

    setConfig: (config) => set({ config }),

    setPlayerId: (id) => set({ playerId: id }),
  }))
);

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}