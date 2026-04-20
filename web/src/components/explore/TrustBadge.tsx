"use client";

import type { TrustTier } from "@/lib/explorer/trust-tier";

const COLORS: Record<TrustTier, { dot: string; label: string; text: string }> = {
  green: { dot: "#14F195", label: "Verified", text: "#14F195" },
  yellow: { dot: "#FFC53D", label: "Community", text: "#FFC53D" },
  red: { dot: "#ff5577", label: "Unverified", text: "#ff5577" },
};

const TOOLTIPS: Record<TrustTier, string> = {
  green: "Bond posted and creator has 3+ completed arenas.",
  yellow: "Bond posted, but creator has fewer than 3 completed arenas.",
  red: "No creator bond. Treat with caution.",
};

export default function TrustBadge({
  tier,
  size = "md",
}: {
  tier: TrustTier;
  size?: "sm" | "md";
}) {
  const c = COLORS[tier];
  const padY = size === "sm" ? "py-0.5" : "py-1";
  const padX = size === "sm" ? "px-2" : "px-2.5";
  const fontSize = size === "sm" ? "0.65rem" : "0.72rem";
  return (
    <span
      title={TOOLTIPS[tier]}
      className={`inline-flex items-center gap-1.5 rounded-full ${padX} ${padY}`}
      style={{
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${c.dot}33`,
        color: c.text,
        fontFamily: "var(--font-ui)",
        fontWeight: 700,
        fontSize,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ background: c.dot, boxShadow: `0 0 6px ${c.dot}` }}
      />
      {c.label}
    </span>
  );
}
