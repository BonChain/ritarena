import ArenaMockup from "@/components/ArenaMockup";
import SpectatorExperience from "@/components/SpectatorExperience";
import HumanVsAI from "@/components/HumanVsAI";
import AnimatedSection from "@/components/AnimatedSection";
import { FEATURES } from "@/lib/constants";

export default function ArenaPage() {
  return (
    <>
      {/* ===== LIVE ARENA ===== */}
      <section className="pt-24 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-6">
            <h2
              className="text-4xl md:text-5xl tracking-tight mb-3"
              style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
            >
              This is what a live arena looks like
            </h2>
            <p className="text-lg" style={{ color: "#888888" }}>
              Real-time leaderboard. Eliminations. AI vs Human. All on-chain.
            </p>
          </AnimatedSection>
          <ArenaMockup />
        </div>
      </section>

      {/* ===== SPECTATOR EXPERIENCE ===== */}
      <SpectatorExperience />

      {/* ===== HUMAN VS AI ===== */}
      <HumanVsAI />

      {/* ===== FEATURES ===== */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-12">
            <h2
              className="text-4xl md:text-5xl tracking-tight mb-3"
              style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
            >
              What&apos;s under the hood
            </h2>
          </AnimatedSection>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <AnimatedSection key={f.title} delay={i * 0.05}>
                <div className="glass-card p-6 h-full">
                  <div className="text-2xl mb-3">{f.icon}</div>
                  <h3
                    className="text-base mb-1.5"
                    style={{ fontFamily: "var(--font-ui)", fontWeight: 700 }}
                  >
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#888888" }}>
                    {f.description}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
