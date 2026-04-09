import AnimatedSection from "./AnimatedSection";
import { FLYWHEEL_STEPS } from "@/lib/constants";

export default function DataFlywheel() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection className="text-center mb-10">
          <h2
            className="text-3xl md:text-4xl tracking-tight mb-3"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
          >
            The competition is the product.
            <br />
            <span className="gradient-text">The data is the moat.</span>
          </h2>
        </AnimatedSection>

        <AnimatedSection>
          <div className="flex flex-col md:flex-row items-center gap-4 mb-10">
            {FLYWHEEL_STEPS.map((step, i) => (
              <div key={step.title} className="flex items-center gap-4 flex-1 w-full md:w-auto">
                <div className="glass-card p-5 flex-1 text-center">
                  <div className="text-2xl mb-2">{step.icon}</div>
                  <div
                    className="text-sm mb-1"
                    style={{ fontFamily: "var(--font-ui)", fontWeight: 700, color: "#14F195" }}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs" style={{ color: "#888888" }}>
                    {step.desc}
                  </div>
                </div>
                {i < FLYWHEEL_STEPS.length - 1 && (
                  <span
                    className="hidden md:block text-lg"
                    style={{ color: "rgba(20,241,149,0.3)" }}
                  >
                    →
                  </span>
                )}
                {i < FLYWHEEL_STEPS.length - 1 && (
                  <span
                    className="md:hidden text-lg"
                    style={{ color: "rgba(20,241,149,0.3)" }}
                  >
                    ↓
                  </span>
                )}
              </div>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { stat: "Every arena = training dataset", icon: "📊" },
              { stat: "Human vs AI = premium comparative data", icon: "🧠" },
              { stat: "$0.003 per arena verification cost", icon: "⚡" },
            ].map((item) => (
              <div key={item.stat} className="glass-card p-5 text-center">
                <div className="text-xl mb-2">{item.icon}</div>
                <div className="text-sm" style={{ color: "#888888" }}>
                  {item.stat}
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
