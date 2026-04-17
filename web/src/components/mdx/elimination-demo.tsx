"use client";

import { useState } from "react";
import { EliminationEffect } from "@ritarena/ui";

export function EliminationDemo() {
  const [trigger, setTrigger] = useState(0);
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "200px",
        background: "#0d0d14",
        border: "1px dashed rgba(255,255,255,0.1)",
        borderRadius: "6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <button
        type="button"
        onClick={() => setTrigger((t) => t + 1)}
        style={{
          padding: "8px 16px",
          background: "#14F195",
          color: "#050508",
          border: "none",
          borderRadius: "6px",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Trigger elimination
      </button>
      <EliminationEffect agentName="PAPER" trigger={trigger} variant="rekt" />
    </div>
  );
}
