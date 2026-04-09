"use client";

import { motion } from "framer-motion";
import { MOCK_ARENA } from "@/lib/constants";

const C = {
  border: "rgba(255,255,255,0.06)",
  bg: "#08080C",
  dim: "#8888A0",
  muted: "#55556a",
  green: "#00FF88",
  red: "#FF3355",
  gold: "#FFC53D",
};

function AgentRow({
  rank, name, type, score, barWidth, positive, delay,
}: {
  rank: number; name: string; type: "AI" | "Human";
  score: number; barWidth: number; positive: boolean; delay: number;
}) {
  const rankColor = rank === 1 ? C.gold : rank === 2 ? "#c0c0c0" : rank === 3 ? "#cd7f32" : C.muted;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex items-center gap-3 py-2.5"
      style={{ borderBottom: `1px solid ${C.border}` }}
    >
      <span className="w-7 text-center text-sm font-semibold" style={{ color: rankColor }}>{rank}</span>
      <span className="text-sm">{type === "AI" ? "\uD83E\uDD16" : "\uD83D\uDC64"}</span>
      <span className="flex-1 text-sm font-medium">{name}</span>
      <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: C.bg, color: C.muted }}>{type}</span>
      <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: C.bg }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${barWidth}%` }}
          transition={{ delay: delay + 0.2, duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: positive ? C.green : C.red }}
        />
      </div>
      <span
        className="font-[family-name:var(--font-mono)] text-xs font-medium w-14 text-right"
        style={{ color: positive ? C.green : C.red }}
      >
        {positive ? "+" : ""}{score}
      </span>
    </motion.div>
  );
}

export default function ArenaMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.6 }}
      className="glass-card max-w-2xl mx-auto mt-16 overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: C.red }} />
          {MOCK_ARENA.name}
        </div>
        <div className="flex gap-4 text-[10px]" style={{ color: C.muted }}>
          <span>Prize: {MOCK_ARENA.prize}</span>
          <span>Alive: {MOCK_ARENA.alive}/{MOCK_ARENA.total}</span>
          <span className="hidden sm:inline">{"\uD83D\uDC41"} {MOCK_ARENA.watching} watching</span>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="px-5 py-3">
        {MOCK_ARENA.agents.map((a, i) => (
          <AgentRow key={a.name} {...a} delay={0.8 + i * 0.1} />
        ))}

        {/* Danger zone */}
        <div className="mt-3 pt-3" style={{ borderTop: `1px dashed rgba(255,51,85,0.2)` }}>
          <div className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: C.red }}>
            Danger Zone
          </div>
          {MOCK_ARENA.dangerZone.map((a, i) => (
            <AgentRow key={a.name} {...a} delay={1.2 + i * 0.1} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-5 py-2.5 text-[10px]"
        style={{ borderTop: `1px solid ${C.border}`, color: C.muted }}
      >
        <span>Next elimination in {MOCK_ARENA.eliminationIn}</span>
        <span>Created by {MOCK_ARENA.creator} | Creator fee: {MOCK_ARENA.creatorFee}</span>
      </div>
    </motion.div>
  );
}
