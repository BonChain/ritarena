import Link from "next/link";

export default function ArenaNotFound() {
  return (
    <section className="pt-32 pb-16 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h1
          className="text-3xl md:text-4xl mb-3"
          style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
        >
          Arena not found
        </h1>
        <p className="mb-8" style={{ color: "#888888" }}>
          That arena ID doesn&apos;t exist on devnet.
        </p>
        <Link
          href="/explore"
          className="cta-shimmer inline-block px-5 py-2 rounded-lg"
          style={{
            background: "#14F195",
            color: "#050508",
            fontFamily: "var(--font-ui)",
            fontWeight: 700,
          }}
        >
          Back to Explorer
        </Link>
      </div>
    </section>
  );
}
