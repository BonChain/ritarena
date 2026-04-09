import AnimatedSection from "@/components/AnimatedSection";

export default function AboutPage() {
  return (
    <section className="pt-24 pb-20 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <AnimatedSection>
          <h2
            className="text-3xl md:text-4xl tracking-tight mb-3"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
          >
            Built by
          </h2>
          <p className="text-base leading-relaxed mb-8" style={{ color: "#888888" }}>
            We&apos;re Solana builders who&apos;ve shipped hackathon-winning
            developer tools before.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 gap-5 text-left">
          <AnimatedSection>
            <div className="glass-card p-6">
              <div
                className="text-sm mb-1"
                style={{ fontFamily: "var(--font-ui)", fontWeight: 700 }}
              >
                Tenny
              </div>
              <div
                className="text-xs mb-3"
                style={{ color: "#14F195", fontFamily: "var(--font-ui)", fontWeight: 600 }}
              >
                Smart Contract Lead
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "#888888" }}>
                Anchor/Rust developer. Won hackathon prize on Sui for
                developer lifecycle tooling (Pactda). Built Mushin (AI trading
                behavior tool) on Solana. Full-stack Solana since 2024.
              </p>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <div className="glass-card p-6">
              <div
                className="text-sm mb-1"
                style={{ fontFamily: "var(--font-ui)", fontWeight: 700 }}
              >
                Team
              </div>
              <div
                className="text-xs mb-3"
                style={{ color: "#14F195", fontFamily: "var(--font-ui)", fontWeight: 600 }}
              >
                4 developers
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "#888888" }}>
                1 junior fullstack + up to 3 senior fullstack developers.
                Combined experience in Solana programs, React, TypeScript,
                game servers, and AI integration.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
