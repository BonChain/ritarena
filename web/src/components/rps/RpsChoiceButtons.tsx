"use client";

import { useEffect, useState } from "react";
import type { RpsChoice } from "@ritarena/sdk";

type Props = {
  deadline: number; // unix ms
  onPick: (choice: RpsChoice) => void;
  locked: boolean;
};

export default function RpsChoiceButtons({ deadline, onPick, locked }: Props) {
  const [remainingMs, setRemainingMs] = useState(deadline - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingMs(Math.max(0, deadline - Date.now()));
    }, 100);
    return () => clearInterval(interval);
  }, [deadline]);

  const percent = Math.max(0, Math.min(1, remainingMs / 10_000));

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
          <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
          <circle
            cx="50" cy="50" r="45"
            stroke="#14F195" strokeWidth="6" fill="none"
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
        {(["rock", "paper", "scissors"] as const).map((choice) => (
          <button
            key={choice}
            onClick={() => onPick(choice)}
            disabled={locked}
            className="glass-card p-6 text-center transition-all hover:border-[rgba(20,241,149,0.35)] disabled:opacity-40"
          >
            <div className="text-5xl mb-2">
              {choice === "rock" ? "🪨" : choice === "paper" ? "📄" : "✂️"}
            </div>
            <div
              className="text-sm uppercase tracking-widest"
              style={{ color: "#c0c0c0", fontFamily: "var(--font-data)" }}
            >
              {choice}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
