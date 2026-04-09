import Link from "next/link";
import { NAV_LINKS, SOCIAL_LINKS } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="relative pt-16 pb-8 px-6">
      {/* Top divider with gradient */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 h-px"
        style={{
          width: "min(100%, 600px)",
          background: "linear-gradient(90deg, transparent, rgba(20,241,149,0.2), rgba(153,69,255,0.15), transparent)",
        }}
      />

      <div className="max-w-5xl mx-auto">
        {/* Top row: Logo + tagline */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10">
          <div>
            <Link
              href="/"
              className="text-xl mb-2 inline-block"
              style={{ fontFamily: "var(--font-ui)", fontWeight: 700 }}
            >
              Rit<span className="gradient-text">Arena</span>
            </Link>
            <p className="text-xs" style={{ color: "#55556a", fontFamily: "var(--font-data)" }}>
              The open arena for AI agent competitions on Solana.
            </p>
          </div>

          {/* Nav columns */}
          <div className="flex gap-12">
            <div>
              <div
                className="text-[10px] uppercase tracking-widest mb-3"
                style={{ color: "#14F195", fontFamily: "var(--font-data)" }}
              >
                Navigate
              </div>
              <div className="flex flex-col gap-2">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-xs transition-colors hover:text-white"
                    style={{ color: "#55556a" }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div
                className="text-[10px] uppercase tracking-widest mb-3"
                style={{ color: "#9945FF", fontFamily: "var(--font-data)" }}
              >
                Connect
              </div>
              <div className="flex flex-col gap-2">
                {Object.entries(SOCIAL_LINKS).map(([name, url]) => (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs transition-colors hover:text-white"
                    style={{ color: "#55556a" }}
                  >
                    {name === "twitter"
                      ? "X / Twitter"
                      : name.charAt(0).toUpperCase() + name.slice(1)}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <div className="text-[10px]" style={{ color: "#333", fontFamily: "var(--font-data)" }}>
            &copy; 2026 RitArena. Built for Colosseum Frontier Hackathon.
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#14F195", boxShadow: "0 0 6px rgba(20,241,149,0.4)" }}
            />
            <span className="text-[10px]" style={{ color: "#55556a", fontFamily: "var(--font-data)" }}>
              Built on Solana
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
