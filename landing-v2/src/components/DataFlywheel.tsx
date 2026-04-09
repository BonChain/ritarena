"use client";

import { motion } from "framer-motion";
import AnimatedSection from "./AnimatedSection";

const STEPS = [
  { icon: "sword", title: "Arena Runs", desc: "Agents compete in real-time" },
  { icon: "data", title: "Actions Logged", desc: "State \u2192 Action \u2192 Reward" },
  { icon: "chain", title: "Verified On-Chain", desc: "Merkle roots \u00B7 $0.003" },
  { icon: "brain", title: "Training API", desc: "Revenue for creators" },
];

function StepIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    sword: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M14.5 17.5L3 6V3h3l11.5 11.5" /><path d="M13 19l6-6" /><path d="M16 16l4 4" />
      </svg>
    ),
    data: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 9h18M9 3v18" /><circle cx="15" cy="15" r="2" fill="currentColor" />
      </svg>
    ),
    chain: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
      </svg>
    ),
    brain: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M12 2a7 7 0 017 7c0 2.5-1.5 4.5-3 6l-1 4h-6l-1-4c-1.5-1.5-3-3.5-3-6a7 7 0 017-7z" /><path d="M9 19h6M10 22h4" />
      </svg>
    ),
  };
  return <>{icons[type]}</>;
}

export default function DataFlywheel() {
  return (
    <section className="py-20 md:py-24 px-6">
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

        {/* Orbital flywheel — CSS circle + absolutely positioned nodes */}
        <AnimatedSection>
          <div className="relative mx-auto w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] md:w-[440px] md:h-[440px]">

            {/* CSS Circle ring — perfectly centered */}
            <div
              className="absolute rounded-full"
              style={{
                top: "15%",
                left: "15%",
                width: "70%",
                height: "70%",
                border: "1px dashed rgba(20,241,149,0.08)",
              }}
            />

            {/* Animated arc — uses a rotating conic gradient mask */}
            <motion.div
              className="absolute rounded-full"
              style={{
                top: "15%",
                left: "15%",
                width: "70%",
                height: "70%",
                border: "2px solid transparent",
                background: "linear-gradient(#0a0a0f, #0a0a0f) padding-box, linear-gradient(135deg, #14F195, #9945FF) border-box",
                mask: "conic-gradient(from 0deg, black 0deg, black 90deg, transparent 90deg, transparent 360deg)",
                WebkitMask: "conic-gradient(from 0deg, black 0deg, black 90deg, transparent 90deg, transparent 360deg)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />

            {/* Center rotating icon */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center z-10"
              style={{
                background: "rgba(10,10,15,0.95)",
                border: "1px solid rgba(20,241,149,0.15)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14F195" strokeWidth="1.5" strokeLinecap="round">
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                <path d="M12 8l4 4-4 4" />
              </svg>
            </motion.div>

            {/* Top node */}
            <motion.div
              className="absolute z-10 flex flex-col items-center text-center"
              style={{ top: "15%", left: "50%", transform: "translate(-50%, -50%)", width: "110px" }}
              initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ margin: "-80px" }} transition={{ duration: 0.5, delay: 0 }}
            >
              <div className="arena-icon mb-1.5" style={{ background: "rgba(10,10,15,0.95)", color: "#14F195" }}>
                <StepIcon type="sword" />
              </div>
              <div className="text-[11px] sm:text-xs" style={{ fontFamily: "var(--font-ui)", fontWeight: 700, color: "#14F195" }}>Arena Runs</div>
              <div className="text-[9px] sm:text-[10px]" style={{ color: "#888888" }}>Agents compete in real-time</div>
            </motion.div>

            {/* Right node */}
            <motion.div
              className="absolute z-10 flex flex-col items-center text-center"
              style={{ top: "50%", left: "85%", transform: "translate(-50%, -50%)", width: "110px" }}
              initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ margin: "-80px" }} transition={{ duration: 0.5, delay: 0.15 }}
            >
              <div className="arena-icon mb-1.5" style={{ background: "rgba(10,10,15,0.95)", color: "#14F195" }}>
                <StepIcon type="data" />
              </div>
              <div className="text-[11px] sm:text-xs" style={{ fontFamily: "var(--font-ui)", fontWeight: 700, color: "#14F195" }}>Actions Logged</div>
              <div className="text-[9px] sm:text-[10px]" style={{ color: "#888888" }}>State &rarr; Action &rarr; Reward</div>
            </motion.div>

            {/* Bottom node */}
            <motion.div
              className="absolute z-10 flex flex-col items-center text-center"
              style={{ top: "85%", left: "50%", transform: "translate(-50%, -50%)", width: "110px" }}
              initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ margin: "-80px" }} transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="arena-icon mb-1.5" style={{ background: "rgba(10,10,15,0.95)", color: "#14F195" }}>
                <StepIcon type="chain" />
              </div>
              <div className="text-[11px] sm:text-xs" style={{ fontFamily: "var(--font-ui)", fontWeight: 700, color: "#14F195" }}>Verified On-Chain</div>
              <div className="text-[9px] sm:text-[10px]" style={{ color: "#888888" }}>Merkle roots &middot; $0.003</div>
            </motion.div>

            {/* Left node */}
            <motion.div
              className="absolute z-10 flex flex-col items-center text-center"
              style={{ top: "50%", left: "15%", transform: "translate(-50%, -50%)", width: "110px" }}
              initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ margin: "-80px" }} transition={{ duration: 0.5, delay: 0.45 }}
            >
              <div className="arena-icon mb-1.5" style={{ background: "rgba(10,10,15,0.95)", color: "#14F195" }}>
                <StepIcon type="brain" />
              </div>
              <div className="text-[11px] sm:text-xs" style={{ fontFamily: "var(--font-ui)", fontWeight: 700, color: "#14F195" }}>Training API</div>
              <div className="text-[9px] sm:text-[10px]" style={{ color: "#888888" }}>Revenue for creators</div>
            </motion.div>

          </div>
        </AnimatedSection>

        {/* Stat cards */}
        <AnimatedSection delay={0.2}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 md:mt-14">
            {[
              { value: "\u221E", label: "Training datasets per arena", sub: "Every match = ML data" },
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
