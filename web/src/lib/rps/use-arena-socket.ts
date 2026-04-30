"use client";

import { useEffect, useRef, useState } from "react";
import type { RpsChoice } from "@ritarena/sdk";
import type { MatchPhase, RunningState } from "./match-state";
import { EMPTY_RUNNING } from "./match-state";

type ServerMessage =
  | { type: "round-start"; round: number; deadline: number }
  | { type: "round-result"; round: number; choices: RpsChoice[]; scores: number[]; pubkeys: string[]; tx: string }
  | { type: "match-complete"; finalRanks: { pubkey: string; rank: number; score: number }[]; tx: string }
  | { type: "error"; message: string }
  | { type: "pong" };

const RPS_SERVER_WS =
  process.env.NEXT_PUBLIC_RPS_WS ?? "ws://localhost:3001";

export function useArenaSocket(arenaId: string | null) {
  const [phase, setPhase] = useState<MatchPhase>({ kind: "waiting" });
  const [running, setRunning] = useState<RunningState>(EMPTY_RUNNING);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!arenaId) return;
    const ws = new WebSocket(`${RPS_SERVER_WS}/arenas/${arenaId}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

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
            tx: msg.tx,
          });
          setRunning((prev) => {
            const prevTotals = prev.runningScores && prev.lastPubkeys
              ? new Map(prev.lastPubkeys.map((pk, i) => [pk, prev.runningScores![i]]))
              : new Map<string, number>();
            const nextTotals = msg.pubkeys.map((pk, i) => (prevTotals.get(pk) ?? 0) + msg.scores[i]);
            return {
              lastChoices: [...msg.choices],
              lastPubkeys: [...msg.pubkeys],
              runningScores: nextTotals,
            };
          });
          break;
        case "match-complete":
          setPhase({ kind: "complete", finalRanks: msg.finalRanks, tx: msg.tx });
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

  return { phase, running, submit, connected };
}
