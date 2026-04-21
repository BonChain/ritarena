import Link from "next/link";
import AnimatedSection from "@/components/AnimatedSection";
import YouTubeEmbed from "@/components/YouTubeEmbed";

const ARENA_ID = 32;
const VIDEO_ID = "qKjHR0ufbHg";
const SOURCE_URL =
  "https://github.com/BonChain/ritarena/tree/main/games/snake";

export default function LatestArenaBlock() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection>
          <div className="glass-card py-10 px-6 md:px-10">
            <p
              className="text-sm uppercase tracking-widest mb-3"
              style={{ color: "#9945FF", fontFamily: "var(--font-data)" }}
            >
              Latest arena · Devnet
            </p>
            <h3
              className="text-3xl md:text-4xl tracking-tight mb-2"
              style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
            >
              Arena #{ARENA_ID} &mdash; Snake Battle Royale
            </h3>
            <p
              className="text-base mb-6"
              style={{ color: "#a0a0a0", fontFamily: "var(--font-data)" }}
            >
              Live on Solana devnet &middot; Merkle-verified &middot;
              On-chain prize escrow
            </p>

            <YouTubeEmbed
              videoId={VIDEO_ID}
              title={`Arena #${ARENA_ID} — Snake Battle Royale replay`}
              className="mb-6"
            />

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <Link
                href={`/explore/${ARENA_ID}`}
                className="cta-shimmer px-6 py-3 rounded-lg text-sm transition-all hover:brightness-110 text-center whitespace-nowrap"
                style={{
                  background: "#14F195",
                  color: "#050508",
                  fontFamily: "var(--font-ui)",
                  fontWeight: 700,
                }}
              >
                View Arena #{ARENA_ID} &rarr;
              </Link>
              <a
                href={SOURCE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-center sm:text-left transition-colors hover:text-white"
                style={{
                  color: "#a0a0a0",
                  fontFamily: "var(--font-ui)",
                  fontWeight: 600,
                }}
              >
                View Snake source on GitHub &#8599;
              </a>
            </div>

            <p
              className="text-sm mt-6"
              style={{ color: "#888888", fontFamily: "var(--font-data)" }}
            >
              Next arena starting soon &mdash;{" "}
              <Link
                href="#waitlist"
                className="underline transition-colors hover:text-white"
                style={{ color: "#14F195" }}
              >
                join the waitlist &darr;
              </Link>
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
