"use client";

type Props = {
  onClose: () => void;
};

const BOTS = [
  { name: "@copycat", tagline: "Mirrors your last move." },
  { name: "@counter-predictor", tagline: "Counters your top choice." },
  { name: "@chaos", tagline: "Pure randomness." },
  { name: "@last-winner", tagline: "Plays last round's winner." },
  { name: "@rock-head", tagline: "Really likes rock." },
];

export default function RpsHowToPanel({ onClose }: Props) {
  return (
    <div className="glass-card p-5 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div
          className="text-sm uppercase tracking-widest"
          style={{ color: "#9945FF", fontFamily: "var(--font-data)" }}
        >
          How to play
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close how-to panel"
          className="w-7 h-7 flex items-center justify-center rounded text-base transition-colors hover:bg-[rgba(255,255,255,0.06)]"
          style={{ color: "#a0a0a0" }}
        >
          ✕
        </button>
      </div>

      <Section title="Goal">
        <p>
          Score the most points across <strong style={{ color: "#f0f0f0" }}>3 rounds</strong>.
          Highest total wins.
        </p>
      </Section>

      <Section title="Scoring">
        <p className="mb-2">
          Each round you earn{" "}
          <strong style={{ color: "#14F195" }}>+1 point per opponent</strong> your move beats.
        </p>
        <div
          className="flex justify-between gap-2 px-2 py-3 rounded text-center"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <Beats glyph="🪨" word="Rock" beats="✂️" />
          <Beats glyph="📄" word="Paper" beats="🪨" />
          <Beats glyph="✂️" word="Scissors" beats="📄" />
        </div>
      </Section>

      <Section title="The winning move">
        <p className="mb-2">
          With 5 opponents, the move that scores best is the one that beats the{" "}
          <strong style={{ color: "#f0f0f0" }}>most of them</strong>.
        </p>
        <div
          className="rounded p-3 text-xs"
          style={{
            background: "rgba(20,241,149,0.06)",
            borderLeft: "2px solid #14F195",
            color: "#c0c0c0",
          }}
        >
          <div style={{ color: "#14F195", fontWeight: 700, marginBottom: 4 }}>Example</div>
          If 3 opponents play 🪨 and 2 play 📄, choose 📄 — you beat all 3 rocks for{" "}
          <strong style={{ color: "#14F195" }}>+3</strong>, while 🪨 only beats 0 and ✂️ only beats 2.
        </div>
        <p className="mt-3">
          Read the room: each opponent&apos;s last pick is shown next to their name. Patterns show up fast.
        </p>
      </Section>

      <Section title="Your opponents">
        <ul className="space-y-1.5">
          {BOTS.map((b) => (
            <li key={b.name} className="flex items-baseline gap-2 text-xs">
              <span style={{ color: "#14F195", fontFamily: "var(--font-data)", minWidth: 110 }}>
                {b.name}
              </span>
              <span style={{ color: "#a0a0a0" }}>{b.tagline}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="On chain">
        <p>
          Every round and the final result are recorded on Solana devnet. Click the{" "}
          <span style={{ color: "#9945FF" }}>Explorer</span> link after each round to inspect the tx.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 last:mb-0">
      <div
        className="text-xs uppercase tracking-widest mb-2"
        style={{ color: "#9945FF", fontFamily: "var(--font-data)" }}
      >
        {title}
      </div>
      <div className="text-sm leading-relaxed" style={{ color: "#c0c0c0" }}>
        {children}
      </div>
    </div>
  );
}

function Beats({ glyph, word, beats }: { glyph: string; word: string; beats: string }) {
  return (
    <div className="flex flex-col items-center text-xs">
      <div className="text-2xl mb-1">{glyph}</div>
      <div style={{ color: "#f0f0f0", fontWeight: 600 }}>{word}</div>
      <div style={{ color: "#55556a" }}>beats {beats}</div>
    </div>
  );
}
