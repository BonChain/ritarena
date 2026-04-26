import { useGameStore } from '../store/gameStore';

function formatUSDC(microUsdc: number): string {
  const usdc = microUsdc / 1_000_000;
  if (usdc >= 1) {
    return usdc.toFixed(2);
  }
  return usdc.toFixed(3);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function Leaderboard() {
  const gameState = useGameStore((s) => s.gameState);
  const hudMeta = useGameStore((s) => s.hudMeta);

  const players = gameState?.players || [];
  const sorted = [...players].sort((a, b) => b.score - a.score);

  if (sorted.length === 0) {
    return <div class="azw-hud-muted">Waiting for players…</div>;
  }

  const rows = sorted.map((p, i) => {
    const rank = i + 1;
    const crown = rank <= 3 ? ['👑', '🥈', '🥉'][rank - 1] : '';
    const topClass = rank <= 3 ? `top${rank}` : '';
    const shortId = (p.pubkey || p.id || '').toString().slice(0, 6);
    const displayName = p.name || shortId;

    let prizeText = '';
    if (
      rank <= 3 &&
      hudMeta.entryFee &&
      hudMeta.prizeSplit &&
      players.length >= 3
    ) {
      const prizePool = hudMeta.entryFee * players.length;
      const prize = prizePool * (hudMeta.prizeSplit[rank - 1] / 100);
      prizeText = `<span class="azw-hud-prize-amt">${formatUSDC(prize)} USDC</span>`;
    }

    return (
      <div class={`azw-hud-row ${topClass}`} key={p.id}>
        {crown}
        <span class="azw-hud-name">
          {escapeHtml(displayName)}
          {prizeText && <span
            class="azw-hud-prize-amt"
            dangerouslySetInnerHTML={{ __html: prizeText }}
          />}
        </span>
        <span class="azw-hud-score">{Math.floor(p.score)}</span>
      </div>
    );
  });

  return <div class="azw-hud-list">{rows}</div>;
}