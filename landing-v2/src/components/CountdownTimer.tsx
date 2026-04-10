"use client";

import { useState, useEffect } from "react";

const TARGET_DATE = new Date("2026-04-20T12:00:00Z");

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (timeLeft.total <= 0) {
    return (
      <span
        className="text-sm uppercase tracking-widest"
        style={{ color: "#14F195", fontFamily: "var(--font-data)" }}
      >
        Arena is LIVE
      </span>
    );
  }

  return (
    <div className="flex gap-4 justify-center">
      {[
        { value: timeLeft.days, label: "Days" },
        { value: timeLeft.hours, label: "Hrs" },
        { value: timeLeft.minutes, label: "Min" },
        { value: timeLeft.seconds, label: "Sec" },
      ].map((unit) => (
        <div key={unit.label} className="text-center">
          <div
            className="text-3xl md:text-4xl tabular-nums"
            style={{
              fontFamily: "var(--font-score)",
              fontWeight: 700,
              color: "#14F195",
            }}
          >
            {String(unit.value).padStart(2, "0")}
          </div>
          <div
            className="text-[10px] uppercase mt-1"
            style={{
              color: "#55556a",
              fontFamily: "var(--font-data)",
              letterSpacing: "0.1em",
            }}
          >
            {unit.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function getTimeLeft() {
  const now = Date.now();
  const total = TARGET_DATE.getTime() - now;
  if (total <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    total,
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
}
