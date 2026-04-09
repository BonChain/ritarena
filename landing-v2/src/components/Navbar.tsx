"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { NAV_LINKS } from "@/lib/constants";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(10, 10, 15, 0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled
          ? "1px solid rgba(20, 241, 149, 0.08)"
          : "1px solid transparent",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl tracking-tight"
          style={{ fontFamily: "var(--font-ui)", fontWeight: 700 }}
        >
          Rit<span className="gradient-text">Arena</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm transition-colors"
              style={{
                color: pathname === link.href ? "#14F195" : "#888888",
                fontFamily: "var(--font-ui)",
                fontWeight: pathname === link.href ? 700 : 600,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#f0f0f0")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color =
                  pathname === link.href ? "#14F195" : "#888888")
              }
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="#waitlist"
            className="cta-shimmer text-sm px-4 py-2 rounded-lg transition-all hover:brightness-110"
            style={{
              background: "#14F195",
              color: "#050508",
              fontFamily: "var(--font-ui)",
              fontWeight: 700,
            }}
          >
            Get Early Access
          </Link>
        </div>
      </div>
    </nav>
  );
}
