# Homepage Persona Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the homepage from a mixed-audience scroll into a mini pitch deck that routes 3 personas (Creators, Developers, Players) to dedicated sub-pages.

**Architecture:** Single file rewrite of `page.tsx`. No new components — reuse existing `CodeBlock`, `AnimatedSection`, `WaitlistForm`, `ArenaCanvas`, `HeroBackground`. Remove `HumanVsAI` import from homepage (component stays, just not used on `/`).

**Tech Stack:** Next.js (App Router), React, Tailwind CSS, existing component library

**Spec:** `docs/superpowers/specs/2026-04-10-homepage-persona-redesign.md`

---

### Task 1: Rewrite homepage with all 6 sections

**Files:**
- Modify: `landing-v2/src/app/page.tsx` (full rewrite)

- [ ] **Step 1: Read current page.tsx to confirm current state**

The file currently has: Hero, How it Works (3-step), HumanVsAI import, Bottom CTA. We are replacing everything between Hero and Bottom CTA with: Problem, Solution, Portal Cards, Traction Strip.

- [ ] **Step 2: Rewrite page.tsx with all 6 sections**

Replace the entire file content with:

```tsx
import HeroBackground from "@/components/HeroBackground";
import WaitlistForm from "@/components/WaitlistForm";
import ArenaCanvas from "@/components/ArenaCanvas";
import AnimatedSection from "@/components/AnimatedSection";
import CodeBlock from "@/components/CodeBlock";
import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative min-h-screen pt-16 px-6">
        <HeroBackground />

        <div className="max-w-6xl mx-auto pt-12 md:pt-20">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1
                className="text-5xl md:text-6xl lg:text-7xl tracking-tight leading-[1.1] mb-5"
                style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
              >
                AI bots and humans{" "}
                <span style={{ color: "#14F195" }}>fight each other</span>{" "}
                for prize money.
              </h1>

              <p className="text-lg md:text-xl leading-relaxed mb-3" style={{ color: "#888888" }}>
                Build an arena. Deploy a bot &mdash; or play yourself.
                Winner takes the pool.
              </p>
              <p className="text-base leading-relaxed mb-8" style={{ color: "#55556a" }}>
                Think Roblox, but for AI competitions. Built on Solana.
              </p>

              <div className="max-w-sm mb-6" id="waitlist">
                <WaitlistForm ctaText="Start Building" />
              </div>
            </div>

            <div>
              <ArenaCanvas className="h-[350px] md:h-[420px]" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== THE PROBLEM ===== */}
      <section className="py-20 px-6" id="problem">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection className="text-center">
            <p
              className="text-sm uppercase tracking-widest mb-6"
              style={{ color: "#9945FF", fontFamily: "var(--font-data)" }}
            >
              The problem
            </p>
            <h2
              className="text-3xl md:text-5xl tracking-tight mb-4"
              style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
            >
              800 teams built AI agents this year.
              <br />
              <span style={{ color: "#55556a" }}>Zero had a platform to compete on.</span>
            </h2>
            <p className="text-lg md:text-xl leading-relaxed mb-10" style={{ color: "#888888" }}>
              Every team rebuilt the same thing from scratch &mdash;
              escrow, scoring, elimination, prize distribution.
              That&apos;s 4 weeks of infrastructure before the first bot fights.
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {[
                "400 teams at Monad Moltiverse",
                "400 at Colosseum Agent Hackathon",
                "15M+ agent transactions on Solana",
              ].map((stat) => (
                <span
                  key={stat}
                  className="text-sm"
                  style={{ color: "#55556a", fontFamily: "var(--font-data)" }}
                >
                  {stat}
                </span>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ===== THE SOLUTION ===== */}
      <section className="py-20 px-6" id="solution">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-14">
            <p
              className="text-sm uppercase tracking-widest mb-6"
              style={{ color: "#14F195", fontFamily: "var(--font-data)" }}
            >
              The solution
            </p>
            <h2
              className="text-3xl md:text-5xl tracking-tight"
              style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
            >
              10 lines. 5 minutes.
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-10 items-start">
            <AnimatedSection>
              <CodeBlock />
            </AnimatedSection>

            <AnimatedSection delay={0.15}>
              <h3
                className="text-2xl mb-6"
                style={{ fontFamily: "var(--font-ui)", fontWeight: 700 }}
              >
                RitArena handles the hard parts.
              </h3>
              <div className="space-y-4">
                {[
                  {
                    label: "On-chain escrow",
                    desc: "Funds locked in a vault. No rugs.",
                    color: "#14F195",
                  },
                  {
                    label: "Commit-reveal rounds",
                    desc: "No front-running. Every action is hashed before reveal.",
                    color: "#14F195",
                  },
                  {
                    label: "Automatic elimination & prizes",
                    desc: "Bottom performers eliminated. Winners paid out instantly.",
                    color: "#9945FF",
                  },
                  {
                    label: "Creator fees 0-20%",
                    desc: "You build the arena, you earn from every entry.",
                    color: "#9945FF",
                  },
                ].map((item) => (
                  <div key={item.label} className="flex gap-3">
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-2.5 flex-shrink-0"
                      style={{ background: item.color }}
                    />
                    <div>
                      <div
                        className="text-base mb-0.5"
                        style={{ fontFamily: "var(--font-ui)", fontWeight: 700 }}
                      >
                        {item.label}
                      </div>
                      <div className="text-sm" style={{ color: "#888888" }}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ===== PORTAL CARDS ===== */}
      <section className="py-20 px-6" id="for-you">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-14">
            <h2
              className="text-3xl md:text-5xl tracking-tight"
              style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
            >
              Who is RitArena for?
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                title: "Creators",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#14F195" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <path d="M12 8v8M8 12h8" />
                  </svg>
                ),
                desc: "Build arenas. Get instant players \u2014 our agents and viewers find your game. Earn 0\u201320% of every entry fee.",
                cta: "Create Arena",
                href: "/creators",
              },
              {
                title: "Developers",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#14F195" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
                  </svg>
                ),
                desc: "Deploy your agent. Win prize money. Get performance data to improve your AI.",
                cta: "Deploy Agent",
                href: "/developers",
              },
              {
                title: "Players",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#14F195" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="12" cy="8" r="5" />
                    <path d="M3 21c0-4.97 4.03-9 9-9s9 4.03 9 9" />
                  </svg>
                ),
                desc: "Compete or watch. Beat the bots \u2014 or bet on them. Fun. Money. No code needed.",
                cta: "Enter Arena",
                href: "/arena",
              },
            ].map((card, i) => (
              <AnimatedSection key={card.title} delay={i * 0.1}>
                <Link href={card.href} className="block h-full">
                  <div className="glass-card p-7 h-full flex flex-col text-center hover:border-[rgba(20,241,149,0.25)] transition-all">
                    <div className="arena-icon mx-auto mb-5">
                      {card.icon}
                    </div>
                    <h3
                      className="text-2xl mb-3"
                      style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
                    >
                      {card.title}
                    </h3>
                    <p className="text-base leading-relaxed mb-6 flex-1" style={{ color: "#888888" }}>
                      {card.desc}
                    </p>
                    <span
                      className="text-sm"
                      style={{ color: "#14F195", fontFamily: "var(--font-ui)", fontWeight: 700 }}
                    >
                      {card.cta} &rarr;
                    </span>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TRACTION STRIP ===== */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <div
              className="glass-card py-6 px-8 flex flex-wrap justify-center gap-x-10 gap-y-4 text-center"
            >
              {[
                { value: "3", label: "Arenas Planned" },
                { value: "$500", label: "In Prizes" },
                { value: "Apr 20", label: "First Arena" },
                { value: "Open Source", label: "github.com/ritarena" },
              ].map((item) => (
                <div key={item.label}>
                  <div
                    className="text-xl md:text-2xl mb-1"
                    style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "#14F195" }}
                  >
                    {item.value}
                  </div>
                  <div
                    className="text-xs uppercase"
                    style={{ color: "#55556a", fontFamily: "var(--font-data)", letterSpacing: "0.1em" }}
                  >
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ===== BOTTOM CTA ===== */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-lg mx-auto">
          <AnimatedSection>
            <h2
              className="text-4xl md:text-5xl tracking-tight mb-3"
              style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
            >
              The arena is waiting.
            </h2>
            <div
              className="glass-card inline-block px-5 py-2.5 rounded-lg mb-8"
              style={{ fontFamily: "var(--font-data)", fontSize: "0.9rem", color: "#14F195" }}
            >
              npm install @ritarena/sdk
            </div>
            <WaitlistForm id="bottom-waitlist" ctaText="Start Building" />
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 3: Build to verify**

Run: `cd landing-v2 && npm run build`
Expected: All routes compile, 0 errors.

- [ ] **Step 4: Visual check**

Run: `cd landing-v2 && npm run dev`
Open `http://localhost:3000` and verify:
- Hero unchanged from current
- Problem section centered with stats underneath
- Solution section shows CodeBlock left, bullets right
- 3 portal cards link to correct sub-pages
- Traction strip shows 4 stats in a horizontal bar
- Bottom CTA shows npm install badge + waitlist form

- [ ] **Step 5: Commit**

```bash
git add landing-v2/src/app/page.tsx
git commit -m "feat: redesign homepage as mini pitch deck with persona routing

Replaces mixed-audience scroll with: problem statement, SDK solution,
3 persona portal cards, and traction strip. Routes creators, developers,
and players to dedicated sub-pages."
```

---

### Task 2: Move HumanVsAI to /arena sub-page

**Files:**
- Modify: `landing-v2/src/app/arena/page.tsx` (add HumanVsAI import)

- [ ] **Step 1: Read current arena/page.tsx**

Check what's currently on the arena page to determine where HumanVsAI should be inserted.

- [ ] **Step 2: Add HumanVsAI import and component to arena page**

Add at the top of the file:
```tsx
import HumanVsAI from "@/components/HumanVsAI";
```

Add `<HumanVsAI />` at an appropriate position in the page (after the main arena content, before any CTA).

- [ ] **Step 3: Build to verify**

Run: `cd landing-v2 && npm run build`
Expected: All routes compile, 0 errors.

- [ ] **Step 4: Commit**

```bash
git add landing-v2/src/app/arena/page.tsx
git commit -m "feat: move HumanVsAI section to /arena sub-page"
```
