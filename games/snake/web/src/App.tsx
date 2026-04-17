// games/snake/web/src/App.tsx
import { useEffect, useState, useCallback, useRef } from "react";
import { Leaderboard, PrizePool, EventFeed } from "@ritarena/ui";
import type { Player, GameEvent } from "@ritarena/ui";
import { GameCanvas } from "./components/GameCanvas";
import { GameHeader } from "./components/GameHeader";
import { Controls } from "./components/Controls";
import { MatchOverlay } from "./components/MatchOverlay";
import {
  connectWs,
  type ArenaInfo,
  type ClientMessage,
  type GameState,
  type Phase,
  type ServerMessage,
} from "./lib/ws";
import { BOT_PERSONALITIES, getPersonality } from "./lib/bots";
import { deriveCommentary } from "./lib/commentary";

const WS_URL = `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/`;

export function App() {
  const [phase, setPhase] = useState<Phase>("lobby");
  const [state, setState] = useState<GameState | null>(null);
  const [arenaInfo, setArenaInfo] = useState<ArenaInfo | null>(null);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [mode, setMode] = useState<"mock" | "devnet">("mock");
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  const wsRef = useRef<ReturnType<typeof connectWs> | null>(null);
  const prevStateRef = useRef<GameState | null>(null);

  useEffect(() => {
    const ws = connectWs(WS_URL, (msg: ServerMessage) => {
      switch (msg.type) {
        case "phase":
          setPhase(msg.phase);
          break;
        case "state": {
          const newEvents = deriveCommentary(prevStateRef.current, msg.state, Date.now());
          if (newEvents.length > 0) {
            setEvents((e) => [...e, ...newEvents]);
          }
          prevStateRef.current = msg.state;
          setState(msg.state);
          break;
        }
        case "log":
          setEvents((e) => [
            ...e,
            {
              message: msg.message,
              type:
                msg.kind === "eliminate"
                  ? "elimination"
                  : msg.kind === "finalize"
                    ? "hype"
                    : "system",
              timestamp: Date.now(),
            },
          ]);
          break;
        case "arena-info":
          setArenaInfo({
            arenaId: msg.arenaId,
            entryFee: msg.entryFee,
            prizePool: msg.prizePool,
            prizeSplit: msg.prizeSplit,
            mode: msg.mode,
            botCount: msg.botCount,
            address: msg.address,
            explorerUrl: msg.explorerUrl,
          });
          break;
        case "speed":
          setSpeedMultiplier(msg.multiplier);
          break;
        case "reset":
          setEvents([]);
          setState(null);
          prevStateRef.current = null;
          break;
      }
    });
    wsRef.current = ws;
    return () => ws.close();
  }, []);

  const send = useCallback((msg: ClientMessage) => {
    wsRef.current?.send(msg);
  }, []);

  // Build leaderboard players from game state
  const players: Player[] = (state?.snakes ?? [])
    .map((snake) => {
      const personality = getPersonality(snake.id);
      return {
        id: snake.id,
        name: personality?.name ?? snake.id.toUpperCase(),
        score: snake.score,
        alive: snake.alive,
        rank: 0,
        color: personality?.color,
        avatar: personality?.avatar,
      };
    })
    .sort((a, b) => {
      if (a.alive !== b.alive) return a.alive ? -1 : 1;
      return b.score - a.score;
    })
    .map((p, i) => ({ ...p, rank: i + 1 }));

  const displayPlayers =
    players.length > 0
      ? players
      : BOT_PERSONALITIES.map((b, i) => ({
          id: b.id,
          name: b.name,
          score: 0,
          alive: true,
          rank: i + 1,
          color: b.color,
          avatar: b.avatar,
        }));

  return (
    <div className="snake-layout">
      <div className="snake-header">
        <GameHeader arenaInfo={arenaInfo} phase={phase} />
      </div>

      <div className="snake-canvas-column">
        <GameCanvas state={state} />
      </div>

      <div className="snake-sidebar">
        {arenaInfo && (
          <PrizePool
            total={arenaInfo.prizePool * 1_000_000}
            creatorFeeBps={0}
            protocolFeeBps={100}
            currency="USDC"
          />
        )}
        <Leaderboard players={displayPlayers} maxVisible={8} showEliminated={true} />
        <EventFeed events={events} maxVisible={15} />
      </div>

      <div className="snake-controls">
        <Controls
          phase={phase}
          mode={mode}
          onMode={setMode}
          onSend={send}
          speedMultiplier={speedMultiplier}
        />
      </div>

      {state && <MatchOverlay state={state} arenaInfo={arenaInfo} />}
    </div>
  );
}
