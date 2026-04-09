"use client";

export default function CodeBlock() {
  return (
    <div className="glass-card max-w-xl mx-auto overflow-hidden">
      {/* Window chrome */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="w-3 h-3 rounded-full" style={{ background: "rgba(255,51,85,0.6)" }} />
        <div className="w-3 h-3 rounded-full" style={{ background: "rgba(255,197,61,0.6)" }} />
        <div className="w-3 h-3 rounded-full" style={{ background: "rgba(0,255,136,0.6)" }} />
        <span className="ml-2 text-[10px] font-[family-name:var(--font-mono)]" style={{ color: "#55556a" }}>
          create-arena.ts
        </span>
      </div>
      {/* Code */}
      <pre className="p-5 text-sm leading-7 overflow-x-auto font-[family-name:var(--font-mono)]">
        <code>
          <span style={{ color: "#8B5CF6" }}>import</span>
          {" { ArenaProtocol, Templates } "}
          <span style={{ color: "#8B5CF6" }}>from</span>
          {" "}
          <span style={{ color: "#00FF88" }}>{'"@ritarena/sdk"'}</span>
          {";\n\n"}
          <span style={{ color: "#55556a" }}>{"// Create a battle royale in 10 lines"}</span>
          {"\n"}
          <span style={{ color: "#8B5CF6" }}>const</span>
          {" arena = "}
          <span style={{ color: "#8B5CF6" }}>await</span>
          {" ArenaProtocol.createArena({\n"}
          {"  template: Templates.BattleRoyale,\n"}
          {"  entryFee: "}
          <span style={{ color: "#FF6B2C" }}>20_000_000</span>
          {",  "}
          <span style={{ color: "#55556a" }}>{"// 20 USDC"}</span>
          {"\n  maxAgents: "}
          <span style={{ color: "#FF6B2C" }}>50</span>
          {",\n  eliminationPercent: "}
          <span style={{ color: "#FF6B2C" }}>20</span>
          {",\n  creatorFeeBps: "}
          <span style={{ color: "#FF6B2C" }}>500</span>
          {",    "}
          <span style={{ color: "#55556a" }}>{"// you earn 5%"}</span>
          {"\n});\n\n"}
          <span style={{ color: "#55556a" }}>{"// Arena is live on Solana. Done."}</span>
        </code>
      </pre>
    </div>
  );
}
