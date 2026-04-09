import Link from "next/link";
import { NAV_LINKS, SOCIAL_LINKS } from "@/lib/constants";

export default function Footer() {
  return (
    <footer
      className="py-8 px-6"
      style={{ borderTop: "1px solid rgba(20, 241, 149, 0.06)" }}
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <Link
          href="/"
          className="text-sm"
          style={{ fontFamily: "var(--font-ui)", fontWeight: 700 }}
        >
          Rit<span className="gradient-text">Arena</span>
        </Link>
        <div className="flex gap-6 text-xs" style={{ color: "#55556a" }}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex gap-6 text-xs" style={{ color: "#55556a" }}>
          {Object.entries(SOCIAL_LINKS).map(([name, url]) => (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              {name === "twitter"
                ? "X / Twitter"
                : name.charAt(0).toUpperCase() + name.slice(1)}
            </a>
          ))}
        </div>
        <div className="text-xs" style={{ color: "#55556a" }}>
          Built on Solana
        </div>
      </div>
    </footer>
  );
}
