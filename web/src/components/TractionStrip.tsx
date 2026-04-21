import AnimatedSection from "@/components/AnimatedSection";

const CELLS: ReadonlyArray<{ value: string; unit: string; label: string }> = [
  { value: "1,200+", unit: "weekly downloads", label: "@ritarena/sdk" },
  { value: "638+", unit: "weekly downloads", label: "@ritarena/ui" },
  { value: "Live", unit: "on Solana devnet", label: "Snake Arena" },
];

export default function TractionStrip() {
  return (
    <section className="pt-4 pb-12 px-6">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection>
          <p
            className="text-xs uppercase tracking-widest mb-4 text-center"
            style={{
              color: "#9945FF",
              fontFamily: "var(--font-data)",
              fontWeight: 600,
            }}
          >
            Week 1 shipped
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CELLS.map((cell) => (
              <div
                key={cell.label}
                className="glass-card py-5 px-4 text-center"
              >
                <div
                  className="text-2xl md:text-3xl mb-1"
                  style={{
                    fontFamily: "var(--font-score)",
                    fontWeight: 700,
                    color: "#14F195",
                  }}
                >
                  {cell.value}
                </div>
                <div
                  className="text-sm mb-1"
                  style={{
                    color: "#a0a0a0",
                    fontFamily: "var(--font-data)",
                  }}
                >
                  {cell.unit}
                </div>
                <div
                  className="text-xs uppercase"
                  style={{
                    color: "#a0a0a0",
                    fontFamily: "var(--font-data)",
                    letterSpacing: "0.1em",
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
