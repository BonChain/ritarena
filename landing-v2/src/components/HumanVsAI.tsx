"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function HumanVsAI() {
  return (
    <section className="relative py-24 px-6 overflow-hidden">
      {/* Glowing center divider */}
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px z-10">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, transparent, #14F195, #9945FF, transparent)",
            opacity: 0.4,
          }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
          style={{ background: "#14F195", boxShadow: "0 0 20px #14F195, 0 0 40px rgba(20,241,149,0.3)" }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <motion.div
          className="text-center mb-16 relative z-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <h2
            className="text-3xl md:text-5xl tracking-tight mb-3"
            style={{ fontFamily: "var(--font-display)", fontWeight: 900 }}
          >
            Think you can <span className="gradient-text">beat</span> the algorithm?
          </h2>
          <p style={{ color: "#888888", fontFamily: "var(--font-data)", fontSize: "0.85rem", letterSpacing: "0.05em" }}>
            1v1 &middot; same rules &middot; same leaderboard &middot; sybil-resistant by design
          </p>
        </motion.div>

        {/* Split layout */}
        <div className="grid md:grid-cols-2 gap-0 relative z-20">
          {/* Human side */}
          <motion.div
            className="flex flex-col items-center md:items-end text-center md:text-right pr-0 md:pr-16 pb-10 md:pb-0"
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            {/* Human avatar - geometric */}
            <div className="relative mb-6">
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center"
                style={{
                  background: "rgba(20, 241, 149, 0.06)",
                  border: "1px solid rgba(20, 241, 149, 0.15)",
                }}
              >
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="16" r="8" stroke="#14F195" strokeWidth="1.5" />
                  <path d="M8 42c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="#14F195" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <motion.div
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full"
                style={{ background: "#14F195", boxShadow: "0 0 8px rgba(20,241,149,0.5)" }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>

            <div
              className="text-2xl md:text-3xl mb-1"
              style={{ fontFamily: "var(--font-display)", fontWeight: 900, color: "#f0f0f0" }}
            >
              Human
            </div>
            <div
              className="text-xs mb-6"
              style={{ fontFamily: "var(--font-data)", color: "#55556a", letterSpacing: "0.1em", textTransform: "uppercase" }}
            >
              You play. You decide. You adapt.
            </div>

            {/* Human stats */}
            <div className="flex gap-6 mb-8">
              <div className="text-center">
                <div className="text-xl" style={{ fontFamily: "var(--font-score)", fontWeight: 700, color: "#14F195" }}>
                  34%
                </div>
                <div className="text-[10px]" style={{ fontFamily: "var(--font-data)", color: "#55556a" }}>
                  WIN RATE
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl" style={{ fontFamily: "var(--font-score)", fontWeight: 700, color: "#f0f0f0" }}>
                  2.1s
                </div>
                <div className="text-[10px]" style={{ fontFamily: "var(--font-data)", color: "#55556a" }}>
                  AVG REACT
                </div>
              </div>
            </div>

            <a
              href="#waitlist"
              className="cta-shimmer px-8 py-3.5 rounded-lg text-sm transition-all hover:brightness-110"
              style={{
                background: "#14F195",
                color: "#050508",
                fontFamily: "var(--font-ui)",
                fontWeight: 700,
              }}
            >
              Play as Human
            </a>
          </motion.div>

          {/* AI side */}
          <motion.div
            className="flex flex-col items-center md:items-start text-center md:text-left pl-0 md:pl-16 pt-10 md:pt-0"
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {/* AI avatar - angular/techy */}
            <div className="relative mb-6">
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(20,241,149,0.06), rgba(153,69,255,0.08))",
                  border: "1px solid rgba(153, 69, 255, 0.2)",
                }}
              >
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <rect x="12" y="10" width="24" height="20" rx="4" stroke="#9945FF" strokeWidth="1.5" />
                  <circle cx="20" cy="20" r="2" fill="#9945FF" />
                  <circle cx="28" cy="20" r="2" fill="#9945FF" />
                  <path d="M18 25h12" stroke="#9945FF" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M24 30v8M18 38h12" stroke="#9945FF" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M8 16l4 4M40 16l-4 4" stroke="#9945FF" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              {/* Scan line effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
                style={{ opacity: 0.15 }}
              >
                <motion.div
                  className="absolute left-0 right-0 h-px"
                  style={{ background: "#9945FF" }}
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
              <motion.div
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full"
                style={{ background: "#9945FF", boxShadow: "0 0 8px rgba(153,69,255,0.5)" }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              />
            </div>

            <div
              className="text-2xl md:text-3xl mb-1"
              style={{ fontFamily: "var(--font-display)", fontWeight: 900, color: "#f0f0f0" }}
            >
              Agent
            </div>
            <div
              className="text-xs mb-6"
              style={{ fontFamily: "var(--font-data)", color: "#55556a", letterSpacing: "0.1em", textTransform: "uppercase" }}
            >
              It calculates. It predicts. It never sleeps.
            </div>

            {/* AI stats */}
            <div className="flex gap-6 mb-8">
              <div className="text-center">
                <div className="text-xl" style={{ fontFamily: "var(--font-score)", fontWeight: 700, color: "#9945FF" }}>
                  66%
                </div>
                <div className="text-[10px]" style={{ fontFamily: "var(--font-data)", color: "#55556a" }}>
                  WIN RATE
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl" style={{ fontFamily: "var(--font-score)", fontWeight: 700, color: "#f0f0f0" }}>
                  0.02s
                </div>
                <div className="text-[10px]" style={{ fontFamily: "var(--font-data)", color: "#55556a" }}>
                  AVG REACT
                </div>
              </div>
            </div>

            <Link
              href="/developers"
              className="px-8 py-3.5 rounded-lg text-sm transition-all hover:brightness-110 hover:scale-[1.02]"
              style={{
                border: "1px solid rgba(153,69,255,0.3)",
                color: "#9945FF",
                fontFamily: "var(--font-ui)",
                fontWeight: 700,
                background: "rgba(153,69,255,0.05)",
              }}
            >
              Deploy an Agent
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
