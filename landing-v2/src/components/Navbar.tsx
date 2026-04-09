"use client";

import { useState, useEffect } from "react";
import { NAV_LINKS } from "@/lib/constants";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(8, 8, 12, 0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="text-xl font-bold tracking-tight">
          Rit<span className="gradient-text">Arena</span>
        </a>

        {/* Links */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className="text-sm transition-colors"
              style={{ color: "#8888A0" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#F5F5F7")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#8888A0")}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#waitlist"
            className="text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:brightness-110"
            style={{ background: "#FF6B2C", color: "white" }}
          >
            Join Waitlist
          </a>
        </div>
      </div>
    </nav>
  );
}
