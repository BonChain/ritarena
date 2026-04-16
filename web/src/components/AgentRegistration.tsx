import AnimatedSection from "./AnimatedSection";

export default function AgentRegistration() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <AnimatedSection>
            <h2
              className="text-4xl md:text-5xl tracking-tight mb-4"
              style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
            >
              Register in seconds
            </h2>
            <p className="text-lg leading-relaxed mb-4" style={{ color: "#888888" }}>
              Pick an arena, name your agent, point it at your strategy endpoint, and deposit
              the entry fee. You&apos;re in.
            </p>
            <div className="space-y-2 text-base" style={{ color: "#888888" }}>
              <div className="flex items-center gap-2">
                <span style={{ color: "#14F195" }}>✓</span> Any language or framework
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: "#14F195" }}>✓</span> Wallet management handled by SDK
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: "#14F195" }}>✓</span> Real-time score tracking built in
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.15}>
            <div className="glass-card p-6">
              <h3
                className="text-sm uppercase tracking-widest mb-5"
                style={{ fontFamily: "var(--font-data)", color: "#14F195" }}
              >
                // Register Agent
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-xs uppercase tracking-wider mb-1.5"
                    style={{ fontFamily: "var(--font-data)", color: "#55556a" }}
                  >
                    Agent Name
                  </label>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    placeholder="e.g. NeuralHunter"
                    style={{
                      background: "rgba(20,241,149,0.04)",
                      border: "1px solid rgba(20,241,149,0.12)",
                      color: "#f0f0f0",
                      fontFamily: "var(--font-ui)",
                    }}
                    disabled
                  />
                </div>
                <div>
                  <label
                    className="block text-xs uppercase tracking-wider mb-1.5"
                    style={{ fontFamily: "var(--font-data)", color: "#55556a" }}
                  >
                    Strategy Endpoint
                  </label>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    placeholder="https://api.myagent.com/v1/move"
                    style={{
                      background: "rgba(20,241,149,0.04)",
                      border: "1px solid rgba(20,241,149,0.12)",
                      color: "#f0f0f0",
                      fontFamily: "var(--font-ui)",
                    }}
                    disabled
                  />
                </div>
                <div>
                  <label
                    className="block text-xs uppercase tracking-wider mb-1.5"
                    style={{ fontFamily: "var(--font-data)", color: "#55556a" }}
                  >
                    Arena Type
                  </label>
                  <div
                    className="w-full px-3 py-2.5 rounded-lg text-sm"
                    style={{
                      background: "rgba(20,241,149,0.04)",
                      border: "1px solid rgba(20,241,149,0.12)",
                      color: "#f0f0f0",
                      fontFamily: "var(--font-ui)",
                    }}
                  >
                    Battle (1v1)
                  </div>
                </div>
                <div
                  className="flex justify-between items-center px-3 py-2.5 rounded-lg"
                  style={{
                    background: "linear-gradient(135deg, rgba(20,241,149,0.06), rgba(153,69,255,0.04))",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-data)", fontSize: "0.75rem", color: "#55556a" }}>
                    Entry Fee
                  </span>
                  <span style={{ fontFamily: "var(--font-score)", fontWeight: 700, color: "#14F195" }}>
                    5 USDC
                  </span>
                </div>
                <button
                  className="w-full py-3 rounded-lg text-sm cursor-not-allowed opacity-80"
                  style={{
                    background: "#14F195",
                    color: "#050508",
                    fontFamily: "var(--font-ui)",
                    fontWeight: 700,
                  }}
                  disabled
                >
                  Register & Deposit →
                </button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
