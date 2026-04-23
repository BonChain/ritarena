import type { WebSocket } from "ws";
import type { RpsChoice } from "@ritarena/sdk";
import type { RpsGameRunner } from "./game-runner.js";

export type ClientMessage =
  | { type: "submit_action"; round: number; choice: RpsChoice }
  | { type: "ping" };

export type ServerMessage =
  | { type: "round-start"; round: number; deadline: number }
  | { type: "round-result"; round: number; choices: RpsChoice[]; scores: number[]; pubkeys: string[] }
  | { type: "match-complete"; finalRanks: { pubkey: string; rank: number; score: number }[] }
  | { type: "error"; message: string }
  | { type: "pong" };

/**
 * Wires a single WS connection to a single game runner. One WS per human
 * per arena.
 */
export function attachSocket(ws: WebSocket, runner: RpsGameRunner): void {
  const send = (msg: ServerMessage) => ws.send(JSON.stringify(msg));

  const onRoundStart = (e: { round: number; deadline: number }) =>
    send({ type: "round-start", ...e });
  const onRoundResult = (e: {
    round: number;
    choices: RpsChoice[];
    scores: number[];
    pubkeys: string[];
  }) => send({ type: "round-result", ...e });
  const onMatchComplete = (e: {
    finalRanks: { pubkey: string; rank: number; score: number }[];
  }) => send({ type: "match-complete", ...e });
  const onError = (e: { message: string }) =>
    send({ type: "error", message: e.message });

  runner.on("round-start", onRoundStart);
  runner.on("round-result", onRoundResult);
  runner.on("match-complete", onMatchComplete);
  runner.on("error", onError);

  ws.on("message", (raw) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(String(raw)) as ClientMessage;
    } catch {
      send({ type: "error", message: "invalid json" });
      return;
    }
    if (msg.type === "submit_action") {
      if (!["rock", "paper", "scissors"].includes(msg.choice)) {
        send({ type: "error", message: "invalid choice" });
        return;
      }
      runner.setHumanChoice(msg.choice);
    } else if (msg.type === "ping") {
      send({ type: "pong" });
    }
  });

  ws.on("close", () => {
    runner.off("round-start", onRoundStart);
    runner.off("round-result", onRoundResult);
    runner.off("match-complete", onMatchComplete);
    runner.off("error", onError);
  });
}
