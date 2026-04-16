import Link from "next/link";
import { NAV_LINKS } from "@/lib/constants";

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
            className="text-base sm:text-lg"
            style={{
              fontFamily: "var(--font-ui)",
              fontWeight: 700,
              letterSpacing: "0.15em",
              color: "#f0f0f0",
            }}
          >
            RITARENA
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
          <div className="flex gap-3">
            <a href="https://x.com/ritarenaxyz" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:brightness-150" style={{ background: "rgba(255,255,255,0.06)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#888888"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://t.me/+3mDMwbLEnK8zZjA1" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:brightness-150" style={{ background: "rgba(255,255,255,0.06)" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#888888"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </a>
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
