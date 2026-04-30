"use client";

import { useState } from "react";

export interface LeaderboardRow {
  rank: number;
  name: string;
  wins: number;
  losses: number;
  winRate: number;
  earnings: number; // USDC
  isBot?: boolean;
}

interface LeaderboardProps {
  rows: LeaderboardRow[];
  tab: "players" | "bots";
  onTabChange: (tab: "players" | "bots") => void;
}

function rankColor(rank: number): string {
  if (rank === 1) return "#FFC53D"; // gold
  if (rank === 2) return "#c0c0c0"; // silver
  if (rank === 3) return "#cd7f32"; // bronze
  return "#888";
}

export default function Leaderboard({ rows, tab, onTabChange }: LeaderboardProps) {
  return (
    <div>
      {/* Tabs */}
      <div
        className="flex gap-2 mb-6"
        style={{ fontFamily: "var(--font-ui)", fontSize: "0.85rem" }}
      >
        {(["players", "bots"] as const).map((t) => (
          <button
            key={t}
            onClick={() => onTabChange(t)}
            style={{
              padding: "0.4rem 1.2rem",
              borderRadius: "9999px",
              border: tab === t ? "1px solid #14F195" : "1px solid #333",
              background: tab === t ? "rgba(20,241,149,0.08)" : "transparent",
              color: tab === t ? "#14F195" : "#888",
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              transition: "all 0.15s",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <div className="text-4xl mb-4">🥇</div>
          <p
            className="text-xl mb-2"
            style={{ color: "#f0f0f0", fontFamily: "var(--font-display)", fontWeight: 700 }}
          >
            Be one of the first.
          </p>
          <p className="text-base mb-4" style={{ color: "#c0c0c0", fontFamily: "var(--font-data)" }}>
            No humans have played{tab === "players" ? "" : " these bots"} yet.
            The first 10 wallets on this board are permanent — screenshot-worthy
            forever.
          </p>
          <a
            href="/play"
            className="cta-shimmer inline-block px-6 py-3 rounded-lg text-sm transition-all hover:brightness-110"
            style={{
              background: "#14F195",
              color: "#050508",
              fontFamily: "var(--font-ui)",
              fontWeight: 700,
            }}
          >
            Play now &rarr;
          </a>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid #222",
                  fontFamily: "var(--font-ui)",
                  fontSize: "0.75rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#555",
                }}
              >
                <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", width: "3rem" }}>#</th>
                <th style={{ padding: "0.75rem 1.25rem", textAlign: "left" }}>Name</th>
                <th style={{ padding: "0.75rem 1.25rem", textAlign: "right" }}>W</th>
                <th style={{ padding: "0.75rem 1.25rem", textAlign: "right" }}>L</th>
                <th style={{ padding: "0.75rem 1.25rem", textAlign: "right" }}>Win %</th>
                <th style={{ padding: "0.75rem 1.25rem", textAlign: "right" }}>Earnings</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.rank}
                  style={{
                    borderBottom: "1px solid #1a1a24",
                    fontFamily: "var(--font-data)",
                    fontSize: "0.9rem",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.03)")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td
                    style={{
                      padding: "0.85rem 1.25rem",
                      color: rankColor(row.rank),
                      fontWeight: row.rank <= 3 ? 700 : 400,
                    }}
                  >
                    {row.rank}
                  </td>
                  <td style={{ padding: "0.85rem 1.25rem", color: "#f0f0f0" }}>
                    {row.name}
                    {row.isBot && (
                      <span
                        style={{
                          marginLeft: "0.5rem",
                          fontSize: "0.65rem",
                          color: "#9945FF",
                          fontFamily: "var(--font-ui)",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        bot
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "0.85rem 1.25rem", textAlign: "right", color: "#14F195" }}>
                    {row.wins}
                  </td>
                  <td style={{ padding: "0.85rem 1.25rem", textAlign: "right", color: "#888" }}>
                    {row.losses}
                  </td>
                  <td style={{ padding: "0.85rem 1.25rem", textAlign: "right", color: "#c0c0c0" }}>
                    {row.winRate.toFixed(1)}%
                  </td>
                  <td
                    style={{
                      padding: "0.85rem 1.25rem",
                      textAlign: "right",
                      color: "#FFC53D",
                    }}
                  >
                    {row.earnings.toFixed(2)} USDC
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
