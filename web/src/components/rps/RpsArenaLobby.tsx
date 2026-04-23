"use client";

type Player = {
  pubkey: string;
  name: string;
  tagline?: string;
  isBot: boolean;
  isHuman?: boolean;
};

export default function RpsArenaLobby({ players }: { players: Player[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {players.map((p) => (
        <div
          key={p.pubkey}
          className="glass-card p-4 text-center"
          style={p.isHuman ? { borderColor: "rgba(20,241,149,0.5)" } : undefined}
        >
          <div className="text-2xl mb-2">{p.isBot ? "🤖" : "👤"}</div>
          <div
            className="text-base mb-1"
            style={{
              color: p.isHuman ? "#14F195" : "#f0f0f0",
              fontFamily: "var(--font-ui)",
              fontWeight: 700,
            }}
          >
            {p.name}
          </div>
          {p.tagline && (
            <div className="text-xs leading-tight" style={{ color: "#a0a0a0" }}>
              {p.tagline}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
