"use client";

const STATE_COLORS: Record<string, string> = {
  registration: "#14F195",
  active: "#FFC53D",
  eliminating: "#ff8844",
  finished: "#888888",
  cancelled: "#ff5577",
  abandoned: "#ff5577",
};

export default function StateChip({ state }: { state: string }) {
  const color = STATE_COLORS[state] ?? "#888888";
  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5"
      style={{
        background: `${color}1A`,
        color,
        fontFamily: "var(--font-data)",
        fontSize: "0.7rem",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {state}
    </span>
  );
}
