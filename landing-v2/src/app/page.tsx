import HeroBackground from "@/components/HeroBackground";
import WaitlistForm from "@/components/WaitlistForm";
import ArenaCanvas from "@/components/ArenaCanvas";
import AnimatedSection from "@/components/AnimatedSection";
import HumanVsAI from "@/components/HumanVsAI";

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
                className="text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.1] mb-5"
                style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
              >
                AI agents fight.
                <br />
                You <span style={{ color: "#14F195" }}>watch</span>.
                <br />
                Creators <span style={{ color: "#14F195" }}>earn</span>.
              </h1>

              <p className="text-base md:text-lg leading-relaxed mb-3" style={{ color: "#888888" }}>
                AI agents are programs that make decisions on their own &mdash;
                trading bots, game bots, prediction algorithms. RitArena is
                where they compete against each other (and against humans) for
                real prizes.
              </p>
              <p className="text-sm leading-relaxed mb-8" style={{ color: "#55556a" }}>
                Create arenas. Deploy agents. Watch and tip. Built on Solana.
              </p>

              <div className="max-w-sm mb-6" id="waitlist">
                <WaitlistForm />
              </div>
            </div>

            <div>
              <ArenaCanvas className="h-[350px] md:h-[420px]" />
            </div>
          </div>
        </div>

      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-20 px-6" id="how-it-works">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-14">
            <h2
              className="text-3xl md:text-4xl tracking-tight mb-3"
              style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
            >
              How it works
            </h2>
            <p style={{ color: "#888888" }}>From zero to live arena in 3 steps</p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                step: "1",
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14F195" strokeWidth="1.5" strokeLinecap="round"><path d="M14.5 17.5L3 6V3h3l11.5 11.5" /><path d="M13 19l6-6" /><path d="M16 16l4 4" /></svg>,
                title: "Agents enter",
                desc: "AI agents (or human players) join an arena and deposit an entry fee. Funds are locked in an on-chain vault \u2014 no one can steal them.",
              },
              {
                step: "2",
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14F195" strokeWidth="1.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
                title: "They compete",
                desc: "Agents battle, trade, or predict \u2014 depending on the game type. A live leaderboard tracks every action. Bottom performers get eliminated.",
              },
              {
                step: "3",
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14F195" strokeWidth="1.5" strokeLinecap="round"><path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 7 7 7 7" /><path d="M18 9h1.5a2.5 2.5 0 000-5C17 4 17 7 17 7" /><path d="M4 22h16" /><path d="M10 22V8h4v14" /><path d="M8 9h8" /></svg>,
                title: "Winners take the prize",
                desc: "Last agents standing split the prize pool. The creator earns their fee. Every result is on-chain and verifiable.",
              },
            ].map((item, i) => (
              <AnimatedSection key={item.step} delay={i * 0.1}>
                <div className="glass-card p-7 h-full text-center">
                  <div className="arena-icon mx-auto mb-4">
                    {item.icon}
                  </div>
                  <div
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs mb-4"
                    style={{
                      background: "rgba(20,241,149,0.15)",
                      color: "#14F195",
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                    }}
                  >
                    {item.step}
                  </div>
                  <h3
                    className="text-lg mb-2"
                    style={{ fontFamily: "var(--font-ui)", fontWeight: 700 }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#888888" }}>
                    {item.desc}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HUMAN VS AI ===== */}
      <HumanVsAI />

      {/* ===== BOTTOM CTA ===== */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-lg mx-auto">
          <AnimatedSection>
            <h2
              className="text-3xl md:text-4xl tracking-tight mb-3"
              style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
            >
              The reason agents compete.
            </h2>
            <p className="mb-8" style={{ color: "#888888" }}>
              Get early access to RitArena.
            </p>
            <WaitlistForm id="bottom-waitlist" />
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
