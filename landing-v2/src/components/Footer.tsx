import Link from "next/link";
import { NAV_LINKS, SOCIAL_LINKS } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="px-6 pt-10 pb-6">
      {/* Gradient divider */}
      <div
        className="max-w-5xl mx-auto h-px mb-8"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(20,241,149,0.15), rgba(153,69,255,0.1), transparent)",
        }}
      />

      <div className="max-w-5xl mx-auto">
        {/* Main row */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 mb-6">
          {/* Logo */}
          <Link
            href="/"
            className="text-lg sm:text-xl"
            style={{ fontFamily: "var(--font-ui)", fontWeight: 700 }}
          >
            Rit<span className="gradient-text">Arena</span>
          </Link>

          {/* Nav links */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm transition-colors hover:text-white"
                style={{ color: "#888888" }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Social */}
          <div className="flex gap-5">
            {Object.entries(SOCIAL_LINKS).map(([name, url]) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm transition-colors hover:text-white"
                style={{ color: "#888888" }}
              >
                {name === "twitter"
                  ? "X"
                  : name.charAt(0).toUpperCase() + name.slice(1)}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <span className="text-xs" style={{ color: "#55556a", fontFamily: "var(--font-data)" }}>
            &copy; 2026 RitArena &middot; Colosseum Frontier Hackathon
          </span>
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#14F195", boxShadow: "0 0 6px rgba(20,241,149,0.4)" }}
            />
            <span className="text-xs" style={{ color: "#55556a", fontFamily: "var(--font-data)" }}>
              Built on Solana
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
