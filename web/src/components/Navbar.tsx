"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { NAV_LINKS, FOR_DEVS_LINKS, SOCIAL_LINKS } from "@/lib/constants";

function truncate(pubkey: string): string {
  return `${pubkey.slice(0, 4)}…${pubkey.slice(-4)}`;
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [forDevsOpen, setForDevsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { publicKey, disconnect, connected } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const forDevsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setForDevsOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (forDevsRef.current && !forDevsRef.current.contains(e.target as Node)) {
        setForDevsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, []);

  const toggleMenu = useCallback(() => setMenuOpen((p) => !p), []);
  const isForDevsActive = pathname === "/creators" || pathname === "/developers";

  function linkStyle(active: boolean) {
    return {
      color: active ? "#14F195" : "#888888",
      fontFamily: "var(--font-ui)",
      fontWeight: active ? 700 : 600,
    } as const;
  }

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
        <div className="hidden md:flex items-center gap-5">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm transition-colors hover:text-white"
              style={linkStyle(
                link.href === "/arena"
                  ? pathname === "/arena" || pathname.startsWith("/explore")
                  : pathname === link.href || pathname.startsWith(`${link.href}/`)
              )}
            >
              {link.label}
            </Link>
          ))}

          {/* For Devs dropdown */}
          <div ref={forDevsRef} className="relative">
            <button
              onClick={() => setForDevsOpen((p) => !p)}
              className="text-sm transition-colors hover:text-white flex items-center gap-1"
              style={linkStyle(isForDevsActive)}
            >
              For Devs
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                style={{
                  transform: forDevsOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}
              >
                <path d="M2 4L5 7L8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {forDevsOpen && (
              <div
                className="absolute top-full right-0 mt-3 w-72 rounded-lg overflow-hidden"
                style={{
                  background: "rgba(10, 10, 15, 0.98)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
                }}
              >
                {FOR_DEVS_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block p-4 transition-colors hover:bg-[rgba(20,241,149,0.04)]"
                    style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}
                  >
                    <div
                      className="text-sm mb-1"
                      style={{ color: "#f0f0f0", fontFamily: "var(--font-ui)", fontWeight: 700 }}
                    >
                      {link.label}
                    </div>
                    <div className="text-xs" style={{ color: "#a0a0a0" }}>
                      {link.description}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* GitHub icon */}
          <a
            href={SOCIAL_LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors"
            style={{ color: "#888888" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#f0f0f0")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#888888")}
            aria-label="GitHub"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 005.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
          </a>

          {/* Signed-in avatar OR signed-out "Sign in" ghost link */}
          {connected && publicKey ? (
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen((p) => !p)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  background: userMenuOpen ? "rgba(20, 241, 149, 0.08)" : "transparent",
                  border: "1px solid rgba(20, 241, 149, 0.25)",
                }}
              >
                <div
                  className="w-6 h-6 rounded-full"
                  style={{
                    background: "linear-gradient(135deg, #14F195 0%, #9945FF 100%)",
                  }}
                />
                <span
                  className="text-xs"
                  style={{
                    color: "#f0f0f0",
                    fontFamily: "var(--font-data)",
                    letterSpacing: "0.05em",
                  }}
                >
                  {truncate(publicKey.toBase58())}
                </span>
              </button>
              {userMenuOpen && (
                <div
                  className="absolute top-full right-0 mt-3 w-56 rounded-lg overflow-hidden"
                  style={{
                    background: "rgba(10, 10, 15, 0.98)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
                  }}
                >
                  <Link
                    href="/leaderboard"
                    className="block px-4 py-3 text-sm transition-colors hover:bg-[rgba(20,241,149,0.04)]"
                    style={{
                      color: "#c0c0c0",
                      fontFamily: "var(--font-ui)",
                      fontWeight: 600,
                      borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                    }}
                  >
                    Leaderboard →
                  </Link>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      disconnect().catch(() => {});
                    }}
                    className="block w-full text-left px-4 py-3 text-sm transition-colors hover:bg-[rgba(255,85,119,0.04)]"
                    style={{
                      color: "#ff5577",
                      fontFamily: "var(--font-ui)",
                      fontWeight: 600,
                    }}
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setWalletModalVisible(true)}
              className="text-sm transition-colors hover:text-white"
              style={{
                color: "#888888",
                fontFamily: "var(--font-ui)",
                fontWeight: 600,
              }}
            >
              Sign in
            </button>
          )}

          {/* Play Now CTA */}
          <Link
            href="/play"
            className="cta-shimmer text-sm px-4 py-2 rounded-lg transition-all hover:brightness-110"
            style={{
              background: "#14F195",
              color: "#050508",
              fontFamily: "var(--font-ui)",
              fontWeight: 700,
            }}
          >
            Play Now →
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden relative w-8 h-8 flex items-center justify-center"
          onClick={toggleMenu}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          <span
            className="absolute block w-5 h-0.5 rounded-full transition-all duration-300"
            style={{
              background: "#f0f0f0",
              transform: menuOpen ? "rotate(45deg)" : "translateY(-6px)",
            }}
          />
          <span
            className="absolute block w-5 h-0.5 rounded-full transition-all duration-300"
            style={{ background: "#f0f0f0", opacity: menuOpen ? 0 : 1 }}
          />
          <span
            className="absolute block w-5 h-0.5 rounded-full transition-all duration-300"
            style={{
              background: "#f0f0f0",
              transform: menuOpen ? "rotate(-45deg)" : "translateY(6px)",
            }}
          />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className="md:hidden overflow-hidden transition-all duration-300"
        style={{
          maxHeight: menuOpen ? "600px" : "0px",
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
                color:
                  (link.href === "/arena"
                    ? pathname === "/arena" || pathname.startsWith("/explore")
                    : pathname === link.href || pathname.startsWith(`${link.href}/`))
                    ? "#14F195"
                    : "#c0c0c0",
                fontFamily: "var(--font-ui)",
                fontWeight: 600,
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              {link.label}
            </Link>
          ))}

          {/* For Devs — mobile: flat section */}
          <div
            className="py-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
          >
            <div
              className="text-xs uppercase mb-2"
              style={{
                color: "#55556a",
                fontFamily: "var(--font-data)",
                letterSpacing: "0.1em",
              }}
            >
              For Devs
            </div>
            {FOR_DEVS_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-2 text-base"
                style={{
                  color: pathname === link.href ? "#14F195" : "#c0c0c0",
                  fontFamily: "var(--font-ui)",
                  fontWeight: 600,
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <a
            href={SOCIAL_LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base py-3"
            style={{
              color: "#c0c0c0",
              fontFamily: "var(--font-ui)",
              fontWeight: 600,
              borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            GitHub ↗
          </a>

          {connected && publicKey ? (
            <>
              <div
                className="text-sm py-3"
                style={{
                  color: "#a0a0a0",
                  fontFamily: "var(--font-data)",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                Signed in: {truncate(publicKey.toBase58())}
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  disconnect().catch(() => {});
                }}
                className="text-base py-3 text-left"
                style={{
                  color: "#ff5577",
                  fontFamily: "var(--font-ui)",
                  fontWeight: 600,
                }}
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setMenuOpen(false);
                setWalletModalVisible(true);
              }}
              className="text-base py-3 text-left"
              style={{
                color: "#c0c0c0",
                fontFamily: "var(--font-ui)",
                fontWeight: 600,
              }}
            >
              Sign in
            </button>
          )}

          <Link
            href="/play"
            className="cta-shimmer text-sm px-4 py-3 rounded-lg text-center mt-3"
            style={{
              background: "#14F195",
              color: "#050508",
              fontFamily: "var(--font-ui)",
              fontWeight: 700,
            }}
          >
            Play Now →
          </Link>
        </div>
      </div>
    </nav>
  );
}
