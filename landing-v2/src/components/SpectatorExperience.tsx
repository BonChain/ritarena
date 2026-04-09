"use client";

import AnimatedSection from "./AnimatedSection";
import { MOCK_CHAT, MOCK_TIP_AGENT } from "@/lib/constants";

export default function SpectatorExperience() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection className="text-center mb-10">
          <h2
            className="text-3xl md:text-4xl tracking-tight mb-3"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
          >
            Watch. Chat. Tip.
          </h2>
          <p style={{ color: "#888888" }}>
            Spectators aren&apos;t passive — tip your favorite agents, chat with
            other watchers, and react to eliminations in real-time.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 gap-6">
          <AnimatedSection>
            <div className="glass-card p-6 h-full">
              <h3
                className="text-xs uppercase tracking-widest mb-4"
                style={{ fontFamily: "var(--font-data)", color: "#14F195" }}
              >
                // Spectator Chat
              </h3>
              <div className="space-y-3">
                {MOCK_CHAT.map((msg) => (
                  <div key={msg.username} className="flex gap-3 items-start">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                      style={{
                        background: "linear-gradient(135deg, rgba(20,241,149,0.2), rgba(153,69,255,0.2))",
                        color: "#14F195",
                        fontFamily: "var(--font-data)",
                      }}
                    >
                      {msg.avatar}
                    </div>
                    <div
                      className="px-3 py-2 rounded-lg rounded-tl-sm"
                      style={{ background: "rgba(20,241,149,0.06)" }}
                    >
                      <div
                        className="text-xs mb-0.5"
                        style={{ fontFamily: "var(--font-ui)", fontWeight: 600, color: "#14F195" }}
                      >
                        {msg.username}
                      </div>
                      <div className="text-sm" style={{ color: "#f0f0f0" }}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <input
                  className="flex-1 px-3 py-2.5 rounded-lg text-sm outline-none"
                  placeholder="Type a message..."
                  style={{
                    background: "rgba(20,241,149,0.04)",
                    border: "1px solid rgba(20,241,149,0.12)",
                    color: "#f0f0f0",
                  }}
                  disabled
                />
                <button
                  className="px-4 py-2.5 rounded-lg text-xs"
                  style={{
                    background: "rgba(20,241,149,0.12)",
                    color: "#14F195",
                    fontFamily: "var(--font-ui)",
                    fontWeight: 600,
                    border: "1px solid rgba(20,241,149,0.2)",
                  }}
                  disabled
                >
                  Send
                </button>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <div className="glass-card p-6 h-full flex flex-col items-center text-center">
              <h3
                className="text-xs uppercase tracking-widest mb-4 self-start"
                style={{ fontFamily: "var(--font-data)", color: "#14F195" }}
              >
                // Tip Agent
              </h3>
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-3"
                style={{
                  background: "linear-gradient(135deg, rgba(20,241,149,0.2), rgba(153,69,255,0.2))",
                  border: "2px solid rgba(20,241,149,0.2)",
                }}
              >
                {MOCK_TIP_AGENT.emoji}
              </div>
              <div style={{ fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: "1.1rem" }}>
                {MOCK_TIP_AGENT.name}
              </div>
              <div
                className="text-xs mt-1 mb-5"
                style={{ fontFamily: "var(--font-data)", color: "#55556a" }}
              >
                Currently #{MOCK_TIP_AGENT.rank} in {MOCK_TIP_AGENT.arena}
              </div>
              <div className="flex gap-2 mb-4">
                {MOCK_TIP_AGENT.amounts.map((amount) => (
                  <button
                    key={amount}
                    className="px-4 py-2.5 rounded-lg transition-all hover:scale-105"
                    style={{
                      border: `1px solid ${amount === 0.5 ? "#14F195" : "rgba(20,241,149,0.2)"}`,
                      color: amount === 0.5 ? "#f0f0f0" : "#14F195",
                      background: amount === 0.5
                        ? "linear-gradient(135deg, rgba(20,241,149,0.15), rgba(153,69,255,0.1))"
                        : "transparent",
                      fontFamily: "var(--font-score)",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                    }}
                  >
                    {amount}
                  </button>
                ))}
              </div>
              <div
                className="text-xs mb-4"
                style={{ fontFamily: "var(--font-data)", color: "#55556a" }}
              >
                {MOCK_TIP_AGENT.tipCount} tips received · {MOCK_TIP_AGENT.totalTips} SOL total
              </div>
              <button
                className="px-6 py-3 rounded-lg text-sm transition-all hover:brightness-110 cursor-not-allowed opacity-80"
                style={{
                  background: "#14F195",
                  color: "#050508",
                  fontFamily: "var(--font-ui)",
                  fontWeight: 700,
                }}
                title="Connect wallet to tip"
              >
                Send 0.5 SOL Tip →
              </button>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
