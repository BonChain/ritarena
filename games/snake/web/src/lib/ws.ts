// games/snake/web/src/lib/ws.ts
export type Phase = "lobby" | "setup" | "preflight" | "active" | "finished";

export interface SnakeState {
  id: string;
  body: { x: number; y: number }[];
  direction: "up" | "down" | "left" | "right";
  alive: boolean;
  score: number;
}

export interface GameState {
  snakes: SnakeState[];
  food: { position: { x: number; y: number } }[];
  safeZone: { minX: number; maxX: number; minY: number; maxY: number };
  round: number;
  roundTimeLeft: number;
  tickCount: number;
  gameOver: boolean;
  winner?: string;
}

export interface ArenaInfo {
  arenaId: number;
  entryFee: number;
  prizePool: number;
  prizeSplit: number[];
  mode: "mock" | "devnet";
  botCount: number;
  address?: string;
  explorerUrl?: string;
}

export interface LogEntry {
  message: string;
  kind: "create" | "register" | "enter" | "start" | "eliminate" | "finalize" | "info";
  tx?: string;
  explorerUrl?: string;
}

export type ServerMessage =
  | { type: "phase"; phase: Phase }
  | { type: "state"; state: GameState }
  | { type: "log"; message: string; kind: string; tx?: string; explorerUrl?: string }
  | ({ type: "arena-info" } & ArenaInfo)
  | { type: "preflight"; status: string; checks: { name: string; status: string; detail: string }[] }
  | { type: "speed"; multiplier: number }
  | { type: "reset" };

export type ClientMessage =
  | { type: "start"; mode: "mock" | "devnet"; adminKey?: string }
  | { type: "restart"; adminKey?: string }
  | { type: "speed"; multiplier: number };

export interface WsAdapter {
  send: (msg: ClientMessage) => void;
  close: () => void;
}

export function connectWs(
  url: string,
  onMessage: (msg: ServerMessage) => void,
  onOpen?: () => void,
  onClose?: () => void,
): WsAdapter {
  const ws = new WebSocket(url);

  ws.onopen = () => onOpen?.();
  ws.onclose = () => onClose?.();
  ws.onmessage = (evt) => {
    try {
      const msg = JSON.parse(evt.data) as ServerMessage;
      onMessage(msg);
    } catch {
      // ignore malformed
    }
  };

  return {
    send: (msg) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      }
    },
    close: () => ws.close(),
  };
}
