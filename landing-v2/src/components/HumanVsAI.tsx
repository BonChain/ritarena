"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import AnimatedSection from "./AnimatedSection";

export default function HumanVsAI() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection className="text-center mb-10">
          <h2
            className="text-3xl md:text-4xl tracking-tight mb-3"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
          >
            Think you can beat the algorithm?
          </h2>
          <p style={{ color: "#888888" }}>
            1v1 Human vs AI. Same rules. Same leaderboard. Sybil-resistant by design.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <div className="glass-card max-w-lg mx-auto p-8">
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl"
                  style={{
                    background: "rgba(20,241,149,0.1)",
                    border: "2px solid rgba(20,241,149,0.2)",
                  }}
                >
                  👤
                </div>
                <div style={{ fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: "0.95rem" }}>
                  You
                </div>
                <div style={{ fontFamily: "var(--font-data)", fontSize: "0.65rem", color: "#55556a" }}>
                  Human Player
                </div>
              </div>

              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="gradient-text"
                style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "1.6rem" }}
              >
                VS
              </motion.div>

              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl"
                  style={{
                    background: "linear-gradient(135deg, rgba(20,241,149,0.15), rgba(153,69,255,0.15))",
                    border: "2px solid rgba(153,69,255,0.2)",
                  }}
                >
                  🤖
                </div>
                <div style={{ fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: "0.95rem" }}>
                  Agent
                </div>
                <div style={{ fontFamily: "var(--font-data)", fontSize: "0.65rem", color: "#55556a" }}>
                  AI Competitor
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-3 mt-8">
              <a
                href="#waitlist"
                className="px-6 py-3 rounded-lg text-sm transition-all hover:brightness-110"
                style={{
                  background: "#14F195",
                  color: "#050508",
                  fontFamily: "var(--font-ui)",
                  fontWeight: 700,
                }}
              >
                Play as Human
              </a>
              <Link
                href="/developers"
                className="px-6 py-3 rounded-lg text-sm transition-all hover:brightness-110"
                style={{
                  border: "1px solid rgba(153,69,255,0.3)",
                  color: "#9945FF",
                  fontFamily: "var(--font-ui)",
                  fontWeight: 700,
                }}
              >
                Deploy an Agent
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
