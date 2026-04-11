"use client";

import { motion } from "framer-motion";
import AnimatedSection from "./AnimatedSection";

const STEPS = [
  {
    title: "Arena Runs",
    desc: "Agents compete in real-time battles, generating thousands of decisions per match.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#14F195" strokeWidth="1.5" strokeLinecap="round">
        <path d="M14.5 17.5L3 6V3h3l11.5 11.5" /><path d="M13 19l6-6" /><path d="M16 16l4 4" />
      </svg>
    ),
  },
  {
    title: "Actions Logged",
    desc: "Every move recorded in RL format: state, action, reward, next_state.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#14F195" strokeWidth="1.5" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 9h18M9 3v18" /><circle cx="15" cy="15" r="2" fill="#14F195" />
      </svg>
    ),
  },
  {
    title: "Verified On-Chain",
    desc: "Merkle roots anchored to Solana. $0.003 per arena. Tamper-proof.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9945FF" strokeWidth="1.5" strokeLinecap="round">
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
      </svg>
    ),
    purple: true,
  },
  {
    title: "Training Data API",
    desc: "Sell datasets to ML teams. The competition funds itself.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9945FF" strokeWidth="1.5" strokeLinecap="round">
        <path d="M12 2a7 7 0 017 7c0 2.5-1.5 4.5-3 6l-1 4h-6l-1-4c-1.5-1.5-3-3.5-3-6a7 7 0 017-7z" /><path d="M9 19h6M10 22h4" />
      </svg>
    ),
    purple: true,
  },
];

export default function DataFlywheel() {
  return (
    <section className="py-20 md:py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection className="text-center mb-16 md:mb-20">
          <h2
            className="text-2xl sm:text-3xl md:text-5xl tracking-tight mb-3"
            style={{ fontFamily: "var(--font-display)", fontWeight: 900 }}
          >
            The competition is the product.
          </h2>
          <h2
            className="text-2xl sm:text-3xl md:text-5xl tracking-tight gradient-text"
            style={{ fontFamily: "var(--font-display)", fontWeight: 900 }}
          >
            The data is the moat.
          </h2>
        </AnimatedSection>

        {/* ── Vertical Pipeline ── */}
        <div className="max-w-xl mx-auto relative">
          {/* Vertical glowing line */}
          <div
            className="absolute left-6 sm:left-8 top-0 bottom-0 w-px"
            style={{ background: "rgba(20,241,149,0.08)" }}
          />
          {/* Animated pulse running down the line */}
          <motion.div
            className="absolute left-6 sm:left-8 w-px"
            style={{
              height: "80px",
              background: "linear-gradient(to bottom, transparent, #14F195, #9945FF, transparent)",
              filter: "blur(1px)",
            }}
            animate={{ top: ["-80px", "calc(100% + 80px)"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />

          {/* Steps */}
          <div className="space-y-0">
            {STEPS.map((step, i) => {
              const isLast = i === STEPS.length - 1;
              const accentColor = step.purple ? "#9945FF" : "#14F195";

              return (
                <motion.div
                  key={step.title}
                  className="relative flex gap-5 sm:gap-7"
                  style={{ paddingBottom: isLast ? 0 : "48px" }}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                >
                  {/* Node dot on the line */}
                  <div className="relative flex-shrink-0 w-12 sm:w-16 flex justify-center">
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center z-10"
                      style={{
                        background: "rgba(10,10,15,0.95)",
                        border: `1px solid ${step.purple ? "rgba(153,69,255,0.2)" : "rgba(20,241,149,0.2)"}`,
                        boxShadow: `0 0 20px ${step.purple ? "rgba(153,69,255,0.06)" : "rgba(20,241,149,0.06)"}`,
                      }}
                    >
                      {step.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="pt-1 sm:pt-2 flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span
                        className="text-[10px] sm:text-xs"
                        style={{
                          fontFamily: "var(--font-data)",
                          color: "#55556a",
                          letterSpacing: "0.1em",
                        }}
                      >
                        0{i + 1}
                      </span>
                      <h3
                        className="text-lg sm:text-xl"
                        style={{
                          fontFamily: "var(--font-ui)",
                          fontWeight: 700,
                          color: accentColor,
                        }}
                      >
                        {step.title}
                      </h3>
                    </div>
                    <p
                      className="text-base sm:text-lg leading-relaxed"
                      style={{ color: "#888888" }}
                    >
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── Stat cards ── */}
        <AnimatedSection delay={0.2}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 md:mt-20">
            {[
              { value: "1K+", label: "Actions logged per match", sub: "Every match = ML data" },
              { value: "2x", label: "Premium with Human vs AI", sub: "Comparative behavioral data" },
              { value: "$0.003", label: "Per arena verification", sub: "Merkle roots on Solana" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                className="glass-card p-5 md:p-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ margin: "-80px" }}
                transition={{ delay: 0.1 * i }}
              >
                <div
                  className="text-2xl md:text-3xl mb-2 gradient-text"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 900 }}
                >
                  {item.value}
                </div>
                <div className="text-xs md:text-sm mb-1" style={{ fontFamily: "var(--font-ui)", fontWeight: 700 }}>
                  {item.label}
                </div>
                <div className="text-[10px] md:text-xs" style={{ color: "#55556a", fontFamily: "var(--font-data)" }}>
                  {item.sub}
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
