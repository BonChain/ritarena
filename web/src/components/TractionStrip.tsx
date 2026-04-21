import AnimatedSection from "@/components/AnimatedSection";

const CELLS: ReadonlyArray<{ value: string; unit: string; label: string }> = [
  { value: "1,200+", unit: "weekly downloads", label: "@ritarena/sdk" },
  { value: "600+", unit: "weekly downloads", label: "@ritarena/ui" },
  { value: "Live", unit: "on Solana devnet", label: "Snake Arena" },
];

export default function TractionStrip() {
  return (
    <section className="pt-2 pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection>
          <p
            className="text-sm uppercase tracking-widest mb-6 text-center"
            style={{
              color: "#9945FF",
              fontFamily: "var(--font-data)",
              fontWeight: 700,
            }}
          >
            Week 1 shipped
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {CELLS.map((cell) => (
              <div
                key={cell.label}
                className="glass-card py-8 px-6 text-center"
              >
                <div
                  className="text-4xl md:text-5xl mb-2"
                  style={{
                    fontFamily: "var(--font-score)",
                    fontWeight: 700,
                    color: "#14F195",
                  }}
                >
                  {cell.value}
                </div>
                <div
                  className="text-base mb-2"
                  style={{
                    color: "#a0a0a0",
                    fontFamily: "var(--font-data)",
                  }}
                >
                  {cell.unit}
                </div>
                <div
                  className="text-sm uppercase"
                  style={{
                    color: "#c0c0c0",
                    fontFamily: "var(--font-data)",
                    letterSpacing: "0.1em",
                    fontWeight: 600,
                  }}
                >
                  {cell.label}
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
