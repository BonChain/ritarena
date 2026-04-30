"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { RitArena } from "@ritarena/sdk";
import WalletConnectButton from "@/components/WalletConnectButton";
import { createAndEnterArena } from "@/lib/rps/start-match";
import { usePlayerStats } from "@/lib/rps/player-stats";

const STEP_COPY = {
  creating: "Creating arena…",
  entering: "Approve entry transaction…",
} as const;

type RestingStatus = "loading-profile" | "unregistered" | "ready";

export default function PlayPage() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const router = useRouter();
  const { stats } = usePlayerStats(publicKey);

  const [resting, setResting] = useState<RestingStatus>("loading-profile");
  const [inFlight, setInFlight] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Synchronous lock — setState is async, so a fast double-click can fire two
  // concurrent handlers before `inFlight` is committed.
  const firingRef = useRef(false);

  useEffect(() => {
    if (!publicKey) {
      setResting("loading-profile");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const reader = RitArena.readOnly(connection);
        const profile = await reader.getProfile(publicKey);
        if (cancelled) return;
        if (profile) {
          setResting("ready");
        } else {
          setResting("unregistered");
          setName(`player_${publicKey.toBase58().slice(0, 6)}`);
        }
      } catch (err) {
        if (cancelled) return;
        setError(String(err));
        setResting("ready");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connection, publicKey]);

  async function startMatch() {
    if (!publicKey || !signTransaction || !signAllTransactions) {
      throw new Error("Wallet not ready");
    }
    const { arenaId } = await createAndEnterArena({
      connection,
      wallet: { publicKey, signTransaction, signAllTransactions },
      onStep: (step) => setInFlight(STEP_COPY[step]),
    });
    router.push(`/play/${arenaId}`);
  }

  async function handlePlay() {
    if (firingRef.current) return;
    firingRef.current = true;
    setError(null);
    try {
      await startMatch();
    } catch (err) {
      setError(String(err));
      setInFlight(null);
    } finally {
      firingRef.current = false;
    }
  }

  async function handleRegisterAndPlay() {
    if (firingRef.current) return;
    if (!publicKey || !signTransaction || !signAllTransactions) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    firingRef.current = true;
    setError(null);
    try {
      setInFlight("Approve registration transaction…");
      const anchorWallet = { publicKey, signTransaction, signAllTransactions };
      const sdk = new RitArena(connection, anchorWallet as never);
      await sdk.registerProfile(trimmed);
      setResting("ready");
      await startMatch();
    } catch (err) {
      setError(String(err));
      setInFlight(null);
    } finally {
      firingRef.current = false;
    }
  }

  const showStats = !!publicKey && stats.matchesPlayed > 0 && !inFlight;

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

        {inFlight ? (
          <div className="glass-card p-8 flex flex-col items-center gap-4">
            <Spinner />
            <div
              className="text-sm uppercase tracking-widest"
              style={{ color: "#14F195", fontFamily: "var(--font-data)" }}
            >
              {inFlight}
            </div>
          </div>
        ) : !publicKey ? (
          <div className="flex flex-col items-center gap-3">
            <WalletConnectButton />
            <p className="text-xs" style={{ color: "#55556a", fontFamily: "var(--font-data)" }}>
              Devnet only. No real funds at risk.
            </p>
          </div>
        ) : resting === "loading-profile" ? (
          <Spinner />
        ) : resting === "unregistered" ? (
          <div className="glass-card p-6 text-left">
            <label
              className="block text-xs uppercase tracking-widest mb-2"
              style={{ color: "#9945FF", fontFamily: "var(--font-data)" }}
            >
              Pick a display name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={32}
              className="w-full px-4 py-3 rounded-lg mb-4"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#f0f0f0",
                fontFamily: "var(--font-data)",
              }}
            />
            <button
              type="button"
              onClick={handleRegisterAndPlay}
              disabled={name.trim().length === 0}
              className="cta-shimmer w-full px-8 py-4 rounded-lg transition-all hover:brightness-110 disabled:opacity-50"
              style={{
                background: "#14F195",
                color: "#050508",
                fontFamily: "var(--font-ui)",
                fontWeight: 700,
                fontSize: "16px",
              }}
            >
              Register &amp; play →
            </button>
            <p
              className="text-xs mt-3 text-center"
              style={{ color: "#55556a", fontFamily: "var(--font-data)" }}
            >
              You&apos;ll sign two devnet transactions: profile + entry.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={handlePlay}
            className="cta-shimmer px-8 py-4 rounded-lg transition-all hover:brightness-110"
            style={{
              background: "#14F195",
              color: "#050508",
              fontFamily: "var(--font-ui)",
              fontWeight: 700,
              fontSize: "16px",
            }}
          >
            Play now →
          </button>
        )}

        {showStats && (
          <div className="glass-card p-4 mt-6 grid grid-cols-3 gap-3 text-center">
            <Stat label="Win streak" value={stats.currentStreak} sub={`best ${stats.bestStreak}`} />
            <Stat label="High score" value={`${stats.bestScore}/15`} />
            <Stat
              label="Win rate"
              value={`${Math.round((stats.matchesWon / stats.matchesPlayed) * 100)}%`}
              sub={`${stats.matchesWon}/${stats.matchesPlayed}`}
            />
          </div>
        )}

        {error && (
          <p className="mt-6 text-sm" style={{ color: "#ff5577" }}>
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div>
      <div
        className="text-xs uppercase tracking-widest mb-1"
        style={{ color: "#9945FF", fontFamily: "var(--font-data)" }}
      >
        {label}
      </div>
      <div
        className="text-xl"
        style={{ fontFamily: "var(--font-score)", fontWeight: 700, color: "#14F195" }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-xs mt-0.5" style={{ color: "#55556a", fontFamily: "var(--font-data)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div className="relative w-10 h-10 mx-auto">
      <div
        className="absolute inset-0 rounded-full border-2"
        style={{
          borderColor: "rgba(20,241,149,0.15)",
          borderTopColor: "#14F195",
          animation: "spin 0.9s linear infinite",
        }}
      />
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
