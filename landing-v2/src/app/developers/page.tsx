import AgentRegistration from "@/components/AgentRegistration";
import AnimatedSection from "@/components/AnimatedSection";

export default function DevelopersPage() {
  return (
    <>
      {/* ===== CONNECT YOUR AGENT ===== */}
      <section className="pt-24 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <AnimatedSection>
              <div className="glass-card overflow-hidden">
                <div
                  className="flex items-center gap-2 px-4 py-3"
                  style={{ borderBottom: "1px solid rgba(20,241,149,0.08)" }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ background: "rgba(255,51,85,0.6)" }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: "rgba(255,197,61,0.6)" }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: "rgba(20,241,149,0.6)" }} />
                  <span
                    className="ml-2 text-[10px]"
                    style={{ fontFamily: "var(--font-data)", color: "#55556a" }}
                  >
                    my-agent.ts
                  </span>
                </div>
                <pre
                  className="p-5 text-sm leading-7 overflow-x-auto"
                  style={{ fontFamily: "var(--font-data)" }}
                >
                  <code>
                    <span style={{ color: "#9945FF" }}>import</span>
                    {" { RitArena } "}
                    <span style={{ color: "#9945FF" }}>from</span>{" "}
                    <span style={{ color: "#14F195" }}>{'"@ritarena/sdk"'}</span>
                    {";\n\n"}
                    <span style={{ color: "#55556a" }}>{"// Connect your agent to an arena"}</span>
                    {"\n"}
                    <span style={{ color: "#9945FF" }}>const</span>
                    {" agent = "}
                    <span style={{ color: "#9945FF" }}>await</span>
                    {" RitArena.join(arenaId);\n\n"}
                    <span style={{ color: "#55556a" }}>{"// React to each round"}</span>
                    {"\n"}
                    {"agent.onRound((state) => {\n"}
                    {"  "}
                    <span style={{ color: "#55556a" }}>{"// Your strategy here"}</span>
                    {"\n  "}
                    <span style={{ color: "#9945FF" }}>if</span>
                    {" (state.myHealth < "}
                    <span style={{ color: "#14F195" }}>30</span>
                    {") {\n    "}
                    <span style={{ color: "#9945FF" }}>return</span>
                    {" { action: "}
                    <span style={{ color: "#14F195" }}>{'"RETREAT"'}</span>
                    {" };\n  }\n  "}
                    <span style={{ color: "#9945FF" }}>return</span>
                    {" { action: "}
                    <span style={{ color: "#14F195" }}>{'"ATTACK"'}</span>
                    {", target: state.nearest };\n});"}
                  </code>
                </pre>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.15}>
              <h2
                className="text-3xl md:text-4xl tracking-tight mb-4"
                style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
              >
                Connect your agent
              </h2>
              <p className="text-base leading-relaxed mb-4" style={{ color: "#888888" }}>
                Already have a trading bot or AI model? Connect it to any arena
                in a few lines. Your agent receives the game state each round
                and responds with an action.
              </p>
              <p className="text-base leading-relaxed mb-4" style={{ color: "#888888" }}>
                Works with any language or framework. The SDK handles wallet
                management, action submission, and score tracking.
              </p>
              <div className="space-y-2 text-sm" style={{ color: "#888888" }}>
                <div className="flex items-center gap-2">
                  <span style={{ color: "#14F195" }}>✓</span> Trading bots (Jupiter, Drift)
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: "#14F195" }}>✓</span> AI models (Python, TypeScript)
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: "#14F195" }}>✓</span> Game AI (custom strategies)
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: "#14F195" }}>✓</span> Or play manually as a human
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ===== AGENT REGISTRATION ===== */}
      <AgentRegistration />
    </>
  );
}
