"use client";

import { useEffect, useRef, useState } from "react";
import type { RpsChoice } from "@ritarena/sdk";
import type { MatchPhase } from "./match-state";

type ServerMessage =
  | { type: "round-start"; round: number; deadline: number }
  | { type: "round-result"; round: number; choices: RpsChoice[]; scores: number[]; pubkeys: string[] }
  | { type: "match-complete"; finalRanks: { pubkey: string; rank: number; score: number }[] }
  | { type: "error"; message: string }
  | { type: "pong" };

const RPS_SERVER_WS =
  process.env.NEXT_PUBLIC_RPS_WS ?? "ws://localhost:3001";

export function useArenaSocket(arenaId: string | null) {
  const [phase, setPhase] = useState<MatchPhase>({ kind: "waiting" });
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!arenaId) return;
    const ws = new WebSocket(`${RPS_SERVER_WS}/arenas/${arenaId}`);
    wsRef.current = ws;

    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data) as ServerMessage;
      switch (msg.type) {
        case "round-start":
          setPhase({ kind: "round-start", round: msg.round, deadline: msg.deadline });
          break;
        case "round-result":
          setPhase({
            kind: "round-resolved",
            round: msg.round,
            choices: msg.choices,
            scores: msg.scores,
            pubkeys: msg.pubkeys,
          });
          break;
        case "match-complete":
          setPhase({ kind: "complete", finalRanks: msg.finalRanks });
          break;
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [arenaId]);

  function submit(choice: RpsChoice, round: number) {
    wsRef.current?.send(JSON.stringify({ type: "submit_action", round, choice }));
  }

  return { phase, submit };
}
