"use client";

export default function ExplorePage() {
  return (
    <section className="pt-32 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        <h1
          className="text-4xl md:text-5xl tracking-tight mb-2"
          style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
        >
          <span className="gradient-text">Arena Explorer</span>
        </h1>
        <p className="text-lg" style={{ color: "#a0a0a0" }}>
          Browse live and finished arenas on devnet.
        </p>
        <div className="mt-12" data-explore-root />
      </div>
    </section>
  );
}
