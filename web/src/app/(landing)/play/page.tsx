"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { RitArena } from "@ritarena/sdk";
import WalletConnectButton from "@/components/WalletConnectButton";

const RPS_SERVER = process.env.NEXT_PUBLIC_RPS_HTTP ?? "http://localhost:3001";

export default function PlayPage() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePlay() {
    if (!publicKey || !signTransaction || !signAllTransactions) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Check that the human has a profile.
      const reader = RitArena.readOnly(connection);
      const profile = await reader.getProfile(publicKey);
      if (!profile) {
        router.push("/register");
        return;
      }

      // 2. Ask the game server to create an arena.
      const res = await fetch(`${RPS_SERVER}/arenas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ humanPubkey: publicKey.toBase58() }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { arenaId } = (await res.json()) as { arenaId: string };

      // 3. Human enters the arena.
      const anchorWallet = { publicKey, signTransaction, signAllTransactions };
      const sdk = new RitArena(connection, anchorWallet as never);
      await sdk.enterArena(Number(arenaId));

      // 4. Navigate to the match page.
      router.push(`/play/${arenaId}`);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="pt-32 pb-16 px-6 min-h-screen">
      <div className="max-w-xl mx-auto text-center">
        <h1
          className="text-4xl md:text-5xl tracking-tight mb-3"
          style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
        >
          Rock Paper Scissors <span style={{ color: "#9945FF" }}>vs AI</span>
        </h1>
        <p className="text-lg mb-10" style={{ color: "#a0a0a0" }}>
          You + 5 AI bots, 3 rounds, 10 seconds per round. No entry fee, no prize — just rank.
        </p>

        {!publicKey ? (
          <WalletConnectButton />
        ) : (
          <button
            onClick={handlePlay}
            disabled={loading}
            className="cta-shimmer px-8 py-4 rounded-lg transition-all hover:brightness-110 disabled:opacity-60"
            style={{
              background: "#14F195",
              color: "#050508",
              fontFamily: "var(--font-ui)",
              fontWeight: 700,
              fontSize: "16px",
            }}
          >
            {loading ? "Setting up…" : "Play now →"}
          </button>
        )}

        {error && <p className="mt-6 text-sm" style={{ color: "#ff5577" }}>{error}</p>}
      </div>
    </section>
  );
}
