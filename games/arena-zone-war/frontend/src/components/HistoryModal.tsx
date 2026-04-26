import { useGameStore } from '../store/gameStore';
import { formatPrize } from '../utils/format';

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function HistoryModal() {
  const selectedHistoryIndex = useGameStore((s) => s.selectedHistoryIndex);
  const history = useGameStore((s) => s.history);

  if (selectedHistoryIndex === null) return null;

  const entry = history[selectedHistoryIndex];
  if (!entry) return null;

  const top3Rows = entry.top3.map((w) => {
    const crown = w.rank === 1 ? '👑' : w.rank === 2 ? '🥈' : '🥉';
    const name = w.name || w.pubkey.slice(0, 6);
    return (
      <div class="azw-modal-top3-row" key={w.rank}>
        <span class="azw-modal-crown">{crown}</span>
        <span class="azw-modal-name">{escapeHtml(name)}</span>
        <span class="azw-modal-prize">+{formatPrize(w.prizeUsdc)}</span>
      </div>
    );
  });

  const explorerLink = entry.explorerUrl ? (
    <a
      href={entry.explorerUrl}
      target="_blank"
      rel="noreferrer"
      class="azw-explorer-btn"
    >
      🔗 View on Solana Explorer
    </a>
  ) : null;

  const handleOverlayClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      useGameStore.getState().setSelectedHistoryIndex(null);
    }
  };

  return (
    <div class="azw-modal-overlay" onClick={handleOverlayClick}>
      <div class="azw-modal">
        <div class="azw-modal-header">
          <span>Arena #{entry.arenaId}</span>
          <span
            class="azw-modal-close"
            onClick={() => useGameStore.getState().setSelectedHistoryIndex(null)}
          >
            ✕
          </span>
        </div>
        <div class="azw-modal-top3">{top3Rows}</div>
        {explorerLink}
      </div>
    </div>
  );
}