"use client";

import { ReactNode } from "react";

export default function ExploreEmpty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div
      className="glass-card p-10 text-center"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: "1.25rem",
          color: "#f0f0f0",
        }}
      >
        {title}
      </div>
      <div className="mt-2" style={{ color: "#888888" }}>
        {body}
      </div>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
