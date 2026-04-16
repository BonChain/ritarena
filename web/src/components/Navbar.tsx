"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { NAV_LINKS } from "@/lib/constants";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const toggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  // CTA: scroll to #waitlist if on home page, otherwise navigate to /#waitlist
  const ctaHref = pathname === "/" ? "#waitlist" : "/#waitlist";

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background:
          scrolled || menuOpen ? "rgba(10, 10, 15, 0.96)" : "transparent",
        backdropFilter: scrolled || menuOpen ? "blur(20px)" : "none",
        borderBottom:
          scrolled || menuOpen
            ? "1px solid rgba(20, 241, 149, 0.08)"
            : "1px solid transparent",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl"
          style={{
            fontFamily: "var(--font-ui)",
            fontWeight: 700,
            letterSpacing: "0.15em",
            color: "#f0f0f0",
          }}
        >
          RITARENA
        </Link>

        {/* Desktop nav */}
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
            href={ctaHref}
            className="cta-shimmer text-sm px-4 py-2 rounded-lg transition-all hover:brightness-110"
            style={{
              background: "#14F195",
              color: "#050508",
              fontFamily: "var(--font-ui)",
              fontWeight: 700,
            }}
          >
            Join the Arena
          </Link>
        </div>

        {/* Mobile hamburger button */}
        <button
          className="md:hidden relative w-8 h-8 flex items-center justify-center"
          onClick={toggleMenu}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          <span
            className="absolute block w-5 h-0.5 rounded-full transition-all duration-300"
            style={{
              background: "#f0f0f0",
              transform: menuOpen
                ? "rotate(45deg)"
                : "translateY(-6px)",
            }}
          />
          <span
            className="absolute block w-5 h-0.5 rounded-full transition-all duration-300"
            style={{
              background: "#f0f0f0",
              opacity: menuOpen ? 0 : 1,
            }}
          />
          <span
            className="absolute block w-5 h-0.5 rounded-full transition-all duration-300"
            style={{
              background: "#f0f0f0",
              transform: menuOpen
                ? "rotate(-45deg)"
                : "translateY(6px)",
            }}
          />
        </button>
      </div>

      {/* Mobile menu dropdown */}
      <div
        className="md:hidden overflow-hidden transition-all duration-300"
        style={{
          maxHeight: menuOpen ? "400px" : "0px",
          opacity: menuOpen ? 1 : 0,
          background: "rgba(10, 10, 15, 0.96)",
        }}
      >
        <div className="px-6 pb-6 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-base py-3 transition-colors"
              style={{
                color: pathname === link.href ? "#14F195" : "#c0c0c0",
                fontFamily: "var(--font-ui)",
                fontWeight: pathname === link.href ? 700 : 600,
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={ctaHref}
            className="cta-shimmer text-sm px-4 py-3 rounded-lg text-center mt-3"
            style={{
              background: "#14F195",
              color: "#050508",
              fontFamily: "var(--font-ui)",
              fontWeight: 700,
            }}
            onClick={() => setMenuOpen(false)}
          >
            Join the Arena
          </Link>
        </div>
      </div>
    </nav>
  );
}
