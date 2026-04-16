"use client";

import { useState, useCallback } from "react";

export default function CopyCommand({ command = "npm install @ritarena/sdk" }: { command?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [command]);

  return (
    <div
      className="glass-card inline-flex items-center gap-3 px-5 py-2.5 rounded-lg"
      style={{ fontFamily: "var(--font-data)", fontSize: "0.9rem", color: "#14F195" }}
    >
      <span>{command}</span>
      <button
        onClick={handleCopy}
        className="flex-shrink-0 transition-colors"
        style={{ color: copied ? "#14F195" : "#55556a" }}
        aria-label="Copy to clipboard"
      >
        {copied ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
        )}
      </button>
    </div>
  );
}
