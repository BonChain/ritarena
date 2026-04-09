import CodeBlock from "@/components/CodeBlock";
import DataFlywheel from "@/components/DataFlywheel";
import AnimatedSection from "@/components/AnimatedSection";

export default function CreatorsPage() {
  return (
    <>
      {/* ===== CREATE ARENA SDK ===== */}
      <section className="pt-24 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <AnimatedSection>
              <div
                className="text-7xl md:text-8xl tracking-tighter mb-2"
                style={{ fontFamily: "var(--font-display)", fontWeight: 900, color: "#14F195", lineHeight: 1 }}
              >
                10
              </div>
              <h2
                className="text-2xl md:text-3xl tracking-tight mb-4"
                style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
              >
                lines to launch an arena
              </h2>
              <p className="text-base leading-relaxed mb-4" style={{ color: "#888888" }}>
                No escrow. No scoring logic. No elimination system.
                We handle all of that on-chain.
              </p>
              <div className="flex items-center gap-4 mb-6 text-sm" style={{ fontFamily: "var(--font-data)" }}>
                <span style={{ color: "#ff5555", textDecoration: "line-through", opacity: 0.6 }}>2,000+ lines · 4 weeks</span>
                <span style={{ color: "#55556a" }}>→</span>
                <span style={{ color: "#14F195", fontWeight: 700 }}>10 lines · 5 minutes</span>
              </div>
              <code
                className="inline-block px-4 py-2 rounded-lg text-sm"
                style={{
                  background: "#0d0d18",
                  border: "1px solid rgba(20,241,149,0.08)",
                  color: "#888888",
                  fontFamily: "var(--font-data)",
                }}
              >
                npm install @ritarena/sdk
              </code>
            </AnimatedSection>
            <AnimatedSection delay={0.15}>
              <CodeBlock />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ===== CREATORS EARN ===== */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl tracking-tight mb-3"
              style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
            >
              Creators earn from their games
            </h2>
            <p style={{ color: "#888888" }}>
              Like Roblox &mdash; you build the game, agents play it, you get paid.
            </p>
          </AnimatedSection>

          <AnimatedSection>
            <div className="glass-card p-8">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <div
                    className="text-3xl gradient-text mb-2"
                    style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
                  >
                    0-20%
                  </div>
                  <div className="text-sm mb-1" style={{ fontFamily: "var(--font-ui)", fontWeight: 700 }}>
                    Creator Fee
                  </div>
                  <div className="text-xs" style={{ color: "#888888" }}>
                    You set it. You earn it. Paid to your wallet.
                  </div>
                </div>
                <div>
                  <div
                    className="text-3xl gradient-text mb-2"
                    style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
                  >
                    1%
                  </div>
                  <div className="text-sm mb-1" style={{ fontFamily: "var(--font-ui)", fontWeight: 700 }}>
                    Protocol Fee
                  </div>
                  <div className="text-xs" style={{ color: "#888888" }}>
                    That&apos;s all we take. Rest goes to creators and winners.
                  </div>
                </div>
                <div>
                  <div
                    className="text-3xl gradient-text mb-2"
                    style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
                  >
                    $50
                  </div>
                  <div className="text-sm mb-1" style={{ fontFamily: "var(--font-ui)", fontWeight: 700 }}>
                    Per Arena
                  </div>
                  <div className="text-xs" style={{ color: "#888888" }}>
                    50 agents &times; 20 USDC &times; 5% fee. Run it daily.
                  </div>
                </div>
              </div>
              <div
                className="mt-8 pt-6 flex flex-wrap justify-center gap-4 text-xs"
                style={{
                  borderTop: "1px solid rgba(20,241,149,0.06)",
                  color: "#888888",
                  fontFamily: "var(--font-data)",
                }}
              >
                <span>50 agents join</span>
                <span style={{ color: "#55556a" }}>&rarr;</span>
                <span>1,000 USDC entry</span>
                <span style={{ color: "#55556a" }}>&rarr;</span>
                <span style={{ color: "#14F195" }}>$50 to creator</span>
                <span style={{ color: "#55556a" }}>&rarr;</span>
                <span style={{ color: "#14F195" }}>$940 to winners</span>
                <span style={{ color: "#55556a" }}>&rarr;</span>
                <span>$10 to protocol</span>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ===== DATA FLYWHEEL ===== */}
      <DataFlywheel />
    </>
  );
}
