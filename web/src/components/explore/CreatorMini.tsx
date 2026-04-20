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
      className="flex items-center gap-2"
      style={{ fontFamily: "var(--font-data)", fontSize: "0.72rem" }}
    >
      <span style={{ color: "#c0c0c0" }}>{name}</span>
      {completed !== null && (
        <span style={{ color: "#55556a" }}>
          {completed} arena{completed === 1 ? "" : "s"} completed
        </span>
      )}
    </div>
  );
}
