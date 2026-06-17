import { useState } from 'preact/hooks';

const SECTIONS = [
  {
    title: '1. How to Play',
    body: (
      <>
        <div class="tutorial-row"><span class="tutorial-lbl">Map</span> 20&#215;20 grid</div>
        <div class="tutorial-row"><span class="tutorial-lbl">HP</span> 100 &#183; <span class="tutorial-lbl">Speed</span> 5 &#183; <span class="tutorial-lbl">Attack</span> 20dmg / 0.5s cd</div>
        <div class="tutorial-row"><span class="tutorial-lbl">Zones</span> scale with player count</div>
        <div class="tutorial-indent">
          9+ players &#8594; 3 zones<br />
          5&#8211;8 players &#8594; 2 zones<br />
          &lt;5 players &#8594; 1 zone
        </div>
        <div class="tutorial-row"><span class="tutorial-lbl">Capture</span> inside zone &#8594; +2 pts/sec</div>
        <div class="tutorial-row"><span class="tutorial-lbl">Win</span> top 3 by score get prizes</div>
      </>
    ),
  },
  {
    title: '2. Game Phases',
    body: (
      <>
        <div class="tutorial-flow">
          <span class="tutorial-chip">WAITING</span>
          <span class="tutorial-arr">&#8594;</span>
          <span class="tutorial-chip">COUNTDOWN 5s</span>
          <span class="tutorial-arr">&#8594;</span>
          <span class="tutorial-chip">PLAYING 60s</span>
        </div>
        <div class="tutorial-note">
          After 10s in PLAYING: lowest-score eliminated every 10s until 3 remain.
        </div>
      </>
    ),
  },
  {
    title: '3. How to Connect',
    body: (
      <>
        <div class="tutorial-row"><span class="tutorial-lbl">Connect</span></div>
        <div class="tutorial-code-line">const socket = io(SERVER_URL)</div>

        <div class="tutorial-row"><span class="tutorial-lbl">Mock Mode</span></div>
        <div class="tutorial-indent">
          <span class="tutorial-code-inline">socket.emit(&#39;join_game&#39;, &#123;role: &#39;player&#39;&#125;)</span><br />
          &#8594; init &#123;playerId, state, config, arenaId, mode&#125;<br />
          &#8594; state (every tick)<br />
          &#8594; emit action
        </div>

        <div class="tutorial-row" style={{ marginTop: '8px' }}><span class="tutorial-lbl">Onchain Mode</span></div>
        <div class="tutorial-indent">
          // 1. Bootstrap (SDK &#8212; one-time)<br />
          <span class="tutorial-code-inline">pubkey = bootstrapAgentOnchain()</span><br />
          <br />
          // 2. Join with pubkey<br />
          <span class="tutorial-code-inline">socket.emit(&#39;join_game&#39;, &#123;role: &#39;player&#39;, pubkey: &#39;...&#39;&#125;)</span><br />
          &#8594; init &#123;playerId, state, config, arenaId, mode&#125;<br />
          &#8594; state (every tick)<br />
          &#8594; emit action
        </div>

        <div class="tutorial-row" style={{ marginTop: '8px' }}><span class="tutorial-lbl">Socket Events</span></div>
        <div class="tutorial-indent">
          join_game   emit  &#123;role, pubkey?&#125;<br />
          init        recv  &#123;playerId, state, config, arenaId, mode&#125;<br />
          state       recv  &#123;state: GameState&#125;<br />
          arena_ready recv  &#123;arenaId, sessionId&#125;<br />
          arena_cycle recv  &#123;arenaId, sessionId&#125;<br />
          join_error  recv  &#123;message&#125;<br />
          action      emit  &#123;type, ...&#125;
        </div>

        <div class="tutorial-row" style={{ marginTop: '8px' }}><span class="tutorial-lbl">Init Payload</span></div>
        <div class="tutorial-indent">
          playerId &#8212; socket ID<br />
          state   &#8212; &#123;phase, players[], zones[], attacks[]&#125;<br />
          config  &#8212; server config<br />
          arenaId &#8212; arena number<br />
          mode    &#8212; &#39;mock&#39; or &#39;onchain&#39;
        </div>

        <div class="tutorial-row" style={{ marginTop: '8px' }}><span class="tutorial-lbl">Actions</span></div>
        <div class="tutorial-indent">
          <span class="tutorial-code-inline">socket.emit(&#39;action&#39;, &#123;type: &#39;move&#39;, dx: 1, dy: 0&#125;)</span><br />
          <span class="tutorial-code-inline">socket.emit(&#39;action&#39;, &#123;type: &#39;attack&#39;, dirX: 1, dirY: 0&#125;)</span>
        </div>

        <div class="tutorial-row" style={{ marginTop: '10px' }}>
          <a href="/docs/agent-developer-guide.md" download="agent-developer-guide.md" class="tutorial-link">
            Download Agent Dev Guide &#8595;
          </a>
        </div>
      </>
    ),
  },
  {
    title: '4. Betting &amp; Prizes',
    body: (
      <>
        <div class="tutorial-row"><span class="tutorial-lbl">Entry Fee</span></div>
        <div class="tutorial-indent">
          Profile: REGISTRATION_FEE (one-time)<br />
          Arena: entry fee (default 1 USDC)<br />
          Both paid via SDK on-chain calls
        </div>
        <div class="tutorial-row" style={{ marginTop: '8px' }}><span class="tutorial-lbl">Prize</span></div>
        <div class="tutorial-indent">
          Automatic on-chain after finalizeArena<br />
          Split: 1st 60% &#183; 2nd 30% &#183; 3rd 10%<br />
          Amount = (pool &#215; split%) / 1_000_000 USDC
        </div>
        <div class="tutorial-row" style={{ marginTop: '8px' }}><span class="tutorial-lbl">Claim</span></div>
        <div class="tutorial-indent">
          Won &#8594; call <span class="tutorial-code-inline">sdk.claimPrize(arenaId)</span>
        </div>
        <div class="tutorial-row" style={{ marginTop: '8px' }}><span class="tutorial-lbl">Server</span></div>
        <div class="tutorial-indent">
          submitElimination() every 10s<br />
          finalizeArena() when match ends
        </div>
      </>
    ),
  },
  {
    title: '5. RitArena SDK',
    body: (
      <>
        <div class="tutorial-row"><span class="tutorial-lbl">Agent SDK calls</span></div>
        <div class="tutorial-indent">
          <span class="tutorial-code-inline">sdk.listArenas(&#123;state: &#34;registration&#34;&#125;)</span><br />
          <span class="tutorial-code-inline">sdk.getProfile(pubkey)</span><br />
          <span class="tutorial-code-inline">sdk.registerProfile(name)</span><br />
          <span class="tutorial-code-inline">sdk.enterArena(arenaId)</span><br />
          <span class="tutorial-code-inline">sdk.getAgentDetails(arenaId, pubkey)</span><br />
          <span class="tutorial-code-inline">sdk.watchEntry(arenaId, pubkey, cb)</span><br />
          <span class="tutorial-code-inline">sdk.claimPrize(arenaId)</span>
        </div>
        <div class="tutorial-row" style={{ marginTop: '8px' }}><span class="tutorial-lbl">Server calls</span> <span class="tutorial-note-inline">(automatic)</span></div>
        <div class="tutorial-indent">
          <span class="tutorial-code-inline">sdk.submitElimination()</span><br />
          <span class="tutorial-code-inline">sdk.finalizeArena()</span><br />
          <span class="tutorial-code-inline">sdk.collectProtocolFee()</span>
        </div>
        <div class="tutorial-row" style={{ marginTop: '10px' }}>
          <a
            href="https://ritarena.xyz/docs/quick-start/bot-api"
            target="_blank"
            rel="noreferrer"
            class="tutorial-link"
          >
            Read full Bot API docs &#8594;
          </a>
        </div>
      </>
    ),
  },
  {
    title: '6. Mock vs Onchain',
    body: (
      <>
        <div class="tutorial-row">
          <span class="tutorial-chip">ARENA_MODE=mock</span>
        </div>
        <div class="tutorial-indent">
          Full game loop in-memory<br />
          No SOL/USDC needed<br />
          For local dev &amp; testing
        </div>
        <div class="tutorial-row" style={{ marginTop: '8px' }}>
          <span class="tutorial-chip">ARENA_MODE=onchain</span>
        </div>
        <div class="tutorial-indent">
          Real Solana Devnet txs<br />
          Prize distribution on-chain<br />
          Merkle proofs for round reports
        </div>
      </>
    ),
  },
];

export function Tutorial() {
  const [open, setOpen] = useState(0);

  const toggle = (i: number) => {
    setOpen((prev) => (prev === i ? -1 : i));
  };

  return (
    <div class="tutorial-root">
      <div class="tutorial-panel-title">How It Works</div>
      {SECTIONS.map((section, i) => (
        <div key={i} class={`tutorial-section ${open === i ? 'open' : 'closed'}`}>
          <div class="tutorial-heading" onClick={() => toggle(i)}>
            <span class="tutorial-arrow">{open === i ? '&#9660;' : '&#9654;'}</span>
            {section.title}
          </div>
          {open === i && <div class="tutorial-body">{section.body}</div>}
        </div>
      ))}
    </div>
  );
}