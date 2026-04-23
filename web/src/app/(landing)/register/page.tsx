"use client";

import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { RitArena } from "@ritarena/sdk";
import WalletConnectButton from "@/components/WalletConnectButton";
import Link from "next/link";

type Status = "disconnected" | "connected-unregistered" | "registering" | "registered" | "error";

export default function RegisterPage() {
  const { connection } = useConnection();
  const { publicKey, wallet, signTransaction, signAllTransactions } = useWallet();
  const [status, setStatus] = useState<Status>("disconnected");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setStatus("disconnected");
      return;
    }

    (async () => {
      try {
        // readOnly mode — just checking if profile exists.
        const sdk = RitArena.readOnly(connection);
        const existing = await sdk.getProfile(publicKey);
        if (existing) {
          setStatus("registered");
        } else {
          setStatus("connected-unregistered");
          setName(`player_${publicKey.toBase58().slice(0, 6)}`);
        }
      } catch (err) {
        setError(String(err));
        setStatus("error");
      }
    })();
  }, [connection, publicKey]);

  async function handleRegister() {
    if (!publicKey || !wallet || !signTransaction || !signAllTransactions) return;
    setStatus("registering");
    setError(null);
    try {
      const anchorWallet = {
        publicKey,
        signTransaction,
        signAllTransactions,
      };
      const sdk = new RitArena(connection, anchorWallet as never);
      await sdk.registerProfile(name);
      setStatus("registered");
    } catch (err) {
      setError(String(err));
      setStatus("error");
    }
  }

  return (
    <section className="pt-32 pb-16 px-6 min-h-screen">
      <div className="max-w-xl mx-auto">
        <h1
          className="text-4xl md:text-5xl tracking-tight mb-3"
          style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
        >
          Register
        </h1>
        <p className="text-lg mb-8" style={{ color: "#a0a0a0" }}>
          Create your on-chain profile. Free since @ritarena/sdk 0.5.0.
        </p>

        <div className="glass-card p-8">
          {status === "disconnected" && (
            <div>
              <p className="mb-6" style={{ color: "#c0c0c0" }}>
                Connect a wallet to get started.
              </p>
              <WalletConnectButton />
            </div>
          )}

          {status === "connected-unregistered" && (
            <div>
              <label
                className="block text-sm uppercase tracking-widest mb-3"
                style={{ color: "#9945FF", fontFamily: "var(--font-data)" }}
              >
                Display name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={32}
                className="w-full px-4 py-3 rounded-lg mb-6"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#f0f0f0",
                  fontFamily: "var(--font-data)",
                }}
              />
              <button
                onClick={handleRegister}
                disabled={name.length === 0}
                className="cta-shimmer px-6 py-3 rounded-lg text-sm transition-all hover:brightness-110"
                style={{
                  background: "#14F195",
                  color: "#050508",
                  fontFamily: "var(--font-ui)",
                  fontWeight: 700,
                }}
              >
                Create profile →
              </button>
            </div>
          )}

          {status === "registering" && (
            <p style={{ color: "#c0c0c0" }}>Signing transaction…</p>
          )}

          {status === "registered" && (
            <div>
              <p className="text-xl mb-4" style={{ color: "#14F195", fontFamily: "var(--font-display)", fontWeight: 700 }}>
                You&apos;re registered.
              </p>
              <Link
                href="/play"
                className="cta-shimmer inline-block px-6 py-3 rounded-lg text-sm transition-all hover:brightness-110"
                style={{
                  background: "#14F195",
                  color: "#050508",
                  fontFamily: "var(--font-ui)",
                  fontWeight: 700,
                }}
              >
                Play RPS →
              </Link>
            </div>
          )}

          {status === "error" && (
            <p style={{ color: "#ff5577" }}>Error: {error}</p>
          )}
        </div>
      </div>
    </section>
  );
}
