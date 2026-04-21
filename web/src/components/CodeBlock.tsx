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
        <span className="ml-2 text-[10px] font-[family-name:var(--font-data)]" style={{ color: "#55556a" }}>
          create-arena.ts
        </span>
      </div>
      {/* Code */}
      <pre className="p-5 text-sm leading-7 overflow-x-auto font-[family-name:var(--font-data)]">
        <code>
          <span style={{ color: "#9945FF" }}>import</span>
          {" { RitArena, BATTLE_ROYALE_TEMPLATE } "}
          <span style={{ color: "#9945FF" }}>from</span>
          {" "}
          <span style={{ color: "#14F195" }}>{'"@ritarena/sdk"'}</span>
          {";\n\n"}
          <span style={{ color: "#9945FF" }}>const</span>
          {" sdk = RitArena.fromKeypair(connection, wallet);\n\n"}
          <span style={{ color: "#55556a" }}>{"// Create a battle royale in 10 lines"}</span>
          {"\n"}
          <span style={{ color: "#9945FF" }}>const</span>
          {" { arenaId } = "}
          <span style={{ color: "#9945FF" }}>await</span>
          {" sdk.createArena({\n"}
          {"  ...BATTLE_ROYALE_TEMPLATE,\n"}
          {"  entryFee: "}
          <span style={{ color: "#14F195" }}>5_000_000</span>
          {",       "}
          <span style={{ color: "#55556a" }}>{"// 5 USDC"}</span>
          {"\n  maxAgents: "}
          <span style={{ color: "#14F195" }}>50</span>
          {",\n  creatorFeeBps: "}
          <span style={{ color: "#14F195" }}>500</span>
          {",     "}
          <span style={{ color: "#55556a" }}>{"// you earn 5%"}</span>
          {"\n  prizeSplit: ["}
          <span style={{ color: "#14F195" }}>60</span>
          {", "}
          <span style={{ color: "#14F195" }}>30</span>
          {", "}
          <span style={{ color: "#14F195" }}>10</span>
          {"],\n  actionSchema: "}
          <span style={{ color: "#14F195" }}>{'"up,down,left,right"'}</span>
          {",\n});\n\n"}
          <span style={{ color: "#55556a" }}>{"// Arena is live on Solana. Done."}</span>
        </code>
      </pre>
    </div>
  );
}
