"use client";

export type StateFilterValue =
  | "all"
  | "registration"
  | "active"
  | "finished";

const OPTIONS: { value: StateFilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "registration", label: "Registering" },
  { value: "active", label: "Live" },
  { value: "finished", label: "Finished" },
];

export default function StateFilter({
  value,
  onChange,
}: {
  value: StateFilterValue;
  onChange: (v: StateFilterValue) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="px-3 py-1.5 rounded-full transition-all"
            style={{
              background: active ? "rgba(20, 241, 149, 0.12)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${active ? "rgba(20, 241, 149, 0.4)" : "rgba(255,255,255,0.06)"}`,
              color: active ? "#14F195" : "#888888",
              fontFamily: "var(--font-ui)",
              fontWeight: 700,
              fontSize: "0.75rem",
              letterSpacing: "0.05em",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
