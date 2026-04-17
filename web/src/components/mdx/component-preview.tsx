"use client";

import { useState } from "react";
import type { ReactNode } from "react";

export interface ComponentPreviewProps {
  children: ReactNode;
  code: string;
  language?: string;
}

export function ComponentPreview({
  children,
  code,
  language = "tsx",
}: ComponentPreviewProps) {
  const [tab, setTab] = useState<"preview" | "code">("preview");

  return (
    <div
      style={{
        marginTop: "1rem",
        marginBottom: "1rem",
        borderRadius: "0.5rem",
        border: "1px solid rgba(255,255,255,0.1)",
        overflow: "hidden",
        background: "#0d0d14",
      }}
    >
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <button
          type="button"
          onClick={() => setTab("preview")}
          style={{
            padding: "0.5rem 1rem",
            background: "transparent",
            border: "none",
            borderBottom: tab === "preview" ? "2px solid #14F195" : "2px solid transparent",
            color: tab === "preview" ? "#f0f0f0" : "#888",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: 600,
            fontFamily: "var(--font-sans, system-ui)",
          }}
        >
          Preview
        </button>
        <button
          type="button"
          onClick={() => setTab("code")}
          style={{
            padding: "0.5rem 1rem",
            background: "transparent",
            border: "none",
            borderBottom: tab === "code" ? "2px solid #14F195" : "2px solid transparent",
            color: tab === "code" ? "#f0f0f0" : "#888",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: 600,
            fontFamily: "var(--font-sans, system-ui)",
          }}
        >
          Code
        </button>
      </div>

      {tab === "preview" ? (
        <div
          style={{
            padding: "2rem 1.5rem",
            minHeight: "120px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "radial-gradient(ellipse at top, #12121c 0%, #0d0d14 100%)",
          }}
        >
          <div style={{ width: "100%", maxWidth: "500px" }}>
            {children}
          </div>
        </div>
      ) : (
        <pre
          style={{
            margin: 0,
            padding: "1rem",
            overflow: "auto",
            fontSize: "0.8rem",
            lineHeight: 1.5,
            color: "#e0e0e0",
            fontFamily: "ui-monospace, monospace",
            background: "#0a0a10",
          }}
        >
          <code>{code.trim()}</code>
        </pre>
      )}
    </div>
  );
}
