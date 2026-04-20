"use client";

import type { AgentProfile } from "@ritarena/sdk";
import { PublicKey } from "@solana/web3.js";
import { shortPubkey } from "@/lib/explorer/format";

export default function CreatorMini({
  creator,
  profile,
}: {
  creator: PublicKey;
  profile: AgentProfile | null;
}) {
  const name = profile?.name?.trim() || shortPubkey(creator);
  const completed = profile ? Number(profile.arenasCompleted) : null;
  return (
    <div
      className="flex flex-wrap items-baseline gap-x-2"
      style={{ fontFamily: "var(--font-data)", fontSize: "0.95rem" }}
    >
      <a
        href={`https://explorer.solana.com/address/${creator.toBase58()}?cluster=devnet`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "#f0f0f0", fontWeight: 600 }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#14F195")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#f0f0f0")}
      >
        {name} ↗
      </a>
      {completed !== null && (
        <span style={{ color: "#a0a0a0", fontSize: "0.85rem" }}>
          · {completed} arena{completed === 1 ? "" : "s"} completed
        </span>
      )}
    </div>
  );
}
