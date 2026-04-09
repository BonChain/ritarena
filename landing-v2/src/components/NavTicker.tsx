"use client";

import { useEffect, useState, useCallback } from "react";
import { onKill } from "@/lib/kill-events";

interface TickerMsg {
  id: number;
  text: string;
  exiting: boolean;
}

let nextId = 0;

export default function NavTicker() {
  const [messages, setMessages] = useState<TickerMsg[]>([]);

  const handleKill = useCallback((msg: string) => {
    const id = nextId++;
    setMessages((prev) => [...prev.slice(-2), { id, text: msg, exiting: false }]);

    // Start exit animation after 3.5s
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, exiting: true } : m))
      );
    }, 3500);

    // Remove after exit animation
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    return onKill(handleKill);
  }, [handleKill]);

  if (messages.length === 0) return null;

  return (
    <div
      className="fixed top-16 left-0 right-0 z-40 overflow-hidden"
      style={{
        background: "rgba(10, 10, 15, 0.85)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(255, 85, 85, 0.1)",
        height: "28px",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-end gap-4">
        {messages.map((msg) => (
          <span
            key={msg.id}
            className={msg.exiting ? "ticker-exit" : "ticker-enter"}
            style={{
              fontFamily: "var(--font-data)",
              fontSize: "10px",
              color: "#ff5555",
              letterSpacing: "0.05em",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ opacity: 0.5 }}>💀</span>{" "}
            {msg.text}
            <span style={{ color: "#55556a", marginLeft: "8px" }}>just now</span>
          </span>
        ))}
      </div>
    </div>
  );
}
