"use client";

import { useEffect, useRef, useState } from "react";
import type { RpsChoice } from "@ritarena/sdk";
import * as sfx from "@/lib/rps/sfx";
import type { RunningState } from "@/lib/rps/match-state";

type BotMeta = { pubkey: string; name: string; tagline: string };

type Props = {
  deadline: number;
  round: number; // 1-indexed for display
  totalRounds: number;
  bots: readonly BotMeta[];
  myPubkey: string;
  myChoiceThisRound: RpsChoice | null;
  running: RunningState;
  locked: boolean;
  onPick: (choice: RpsChoice) => void;
};

const CHOICE_GLYPHS: Record<RpsChoice, string> = { rock: "🪨", paper: "📄", scissors: "✂️" };

export default function RpsContextStrip({
  deadline,
  round,
  totalRounds,
  bots,
  myPubkey,
  myChoiceThisRound,
  running,
  locked,
  onPick,
}: Props) {
  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, deadline - Date.now()));
  const lastTickRef = useRef<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingMs(Math.max(0, deadline - Date.now()));
    }, 100);
    return () => clearInterval(interval);
  }, [deadline]);

  // Countdown ticks at 3, 2, 1 (and a higher final pip on 1).
  useEffect(() => {
    const seconds = Math.ceil(remainingMs / 1000);
    if (seconds <= 3 && seconds > 0 && lastTickRef.current !== seconds) {
      lastTickRef.current = seconds;
      sfx.tick({ final: seconds === 1 });
    }
    if (remainingMs > 3000) lastTickRef.current = null;
  }, [remainingMs]);

  const percent = Math.max(0, Math.min(1, remainingMs / 10_000));

  function handlePick(choice: RpsChoice) {
    sfx.click();
    onPick(choice);
  }

  // Score lookups — running may be null in round 1.
  const scoreFor = (pk: string): number => {
    if (!running.lastPubkeys || !running.runningScores) return 0;
    const i = running.lastPubkeys.indexOf(pk);
    return i >= 0 ? running.runningScores[i] : 0;
  };
  const lastChoiceFor = (pk: string): RpsChoice | null => {
    if (!running.lastPubkeys || !running.lastChoices) return null;
    const i = running.lastPubkeys.indexOf(pk);
    return i >= 0 ? running.lastChoices[i] : null;
  };

  const myLastChoice = lastChoiceFor(myPubkey);
  const myScore = scoreFor(myPubkey);

  return (
    <div className="flex flex-col gap-8">
      {/* Action zone — countdown + buttons */}
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-24 h-24">
          <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
            <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#14F195"
              strokeWidth="6"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - percent)}`}
              style={{ transition: "stroke-dashoffset 0.1s linear" }}
            />
          </svg>
          <div
            className="absolute inset-0 flex items-center justify-center text-2xl"
            style={{ fontFamily: "var(--font-score)", fontWeight: 700, color: "#14F195" }}
          >
            {Math.ceil(remainingMs / 1000)}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 max-w-md w-full">
          {(["rock", "paper", "scissors"] as const).map((choice) => {
            const isMyPick = myChoiceThisRound === choice;
            return (
              <button
                key={choice}
                onClick={() => handlePick(choice)}
                disabled={locked}
                className="glass-card p-6 text-center transition-all hover:border-[rgba(20,241,149,0.35)] disabled:cursor-not-allowed"
                style={
                  isMyPick
                    ? { borderColor: "rgba(20,241,149,0.7)", boxShadow: "0 0 24px rgba(20,241,149,0.25)" }
                    : locked
                      ? { opacity: 0.35 }
                      : undefined
                }
              >
                <div className="text-5xl mb-2">{CHOICE_GLYPHS[choice]}</div>
                <div
                  className="text-sm uppercase tracking-widest"
                  style={{ color: isMyPick ? "#14F195" : "#c0c0c0", fontFamily: "var(--font-data)" }}
                >
                  {choice}
                </div>
              </button>
            );
          })}
        </div>

        <div
          className="text-xs uppercase tracking-widest text-center"
          style={{ color: "#55556a", fontFamily: "var(--font-data)" }}
        >
          {locked
            ? `Round ${round}/${totalRounds} — locked, waiting for opponents…`
            : `Round ${round}/${totalRounds} — score = opponents you beat`}
        </div>
      </div>

      {/* Context grid — opponents + you */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Opponents */}
        <div className="flex flex-col gap-2">
          <div
            className="text-xs uppercase tracking-widest mb-1"
            style={{ color: "#9945FF", fontFamily: "var(--font-data)" }}
          >
            Opponents
          </div>
          {bots.map((b) => {
            const last = lastChoiceFor(b.pubkey);
            const score = scoreFor(b.pubkey);
            return (
              <div key={b.pubkey} className="glass-card p-3 flex items-center gap-3">
                <div className="text-xl">🤖</div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm truncate"
                    style={{ fontFamily: "var(--font-ui)", fontWeight: 700 }}
                  >
                    {b.name}
                  </div>
                  <div className="text-xs truncate" style={{ color: "#a0a0a0" }}>
                    {b.tagline}
                  </div>
                </div>
                <div
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    color: last ? "#f0f0f0" : "#55556a",
                    fontFamily: "var(--font-data)",
                  }}
                  title={last ? `Last pick: ${last}` : "No moves yet"}
                >
                  {last ? CHOICE_GLYPHS[last] : "—"}
                </div>
                <div
                  className="text-sm w-8 text-right"
                  style={{ fontFamily: "var(--font-score)", fontWeight: 700, color: "#14F195" }}
                >
                  {score}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-2">
          <div
            className="text-xs uppercase tracking-widest mb-1"
            style={{ color: "#14F195", fontFamily: "var(--font-data)" }}
          >
            You
          </div>
          <div className="glass-card p-3 flex items-center gap-3" style={{ borderColor: "rgba(20,241,149,0.5)" }}>
            <div className="text-xl">👤</div>
            <div className="flex-1 min-w-0">
              <div
                className="text-sm"
                style={{ color: "#14F195", fontFamily: "var(--font-ui)", fontWeight: 700 }}
              >
                You
              </div>
              <div className="text-xs" style={{ color: "#a0a0a0" }}>
                {myLastChoice
                  ? `Last round: ${myLastChoice} (@copycat will mirror this)`
                  : "First round — make it count"}
              </div>
            </div>
            <div
              className="text-xs px-2 py-1 rounded"
              style={{
                background: "rgba(255,255,255,0.04)",
                color: myLastChoice ? "#f0f0f0" : "#55556a",
                fontFamily: "var(--font-data)",
              }}
            >
              {myLastChoice ? CHOICE_GLYPHS[myLastChoice] : "—"}
            </div>
            <div
              className="text-sm w-8 text-right"
              style={{ fontFamily: "var(--font-score)", fontWeight: 700, color: "#14F195" }}
            >
              {myScore}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
