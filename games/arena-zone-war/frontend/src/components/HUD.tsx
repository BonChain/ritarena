import { useGameStore } from '../store/gameStore';
import { formatPrize } from '../utils/format';
import { Leaderboard } from './Leaderboard';
import { HistoryModal } from './HistoryModal';
import { AgentConnect } from './AgentConnect';

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatTime(t: number): string {
  const clamped = Math.max(0, t);
  const m = Math.floor(clamped / 60);
  const s = Math.floor(clamped % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function HUD() {
  const gameState = useGameStore((s) => s.gameState);
  const hudMeta = useGameStore((s) => s.hudMeta);
  const history = useGameStore((s) => s.history);
  const setSelectedHistoryIndex = useGameStore((s) => s.setSelectedHistoryIndex);

  const phase = gameState?.phase ?? '—';
  const players = gameState?.players || [];
  const roundTime = gameState?.roundTime ?? 0;
  const waitTime = gameState?.waitTime ?? 0;

  const conn = hudMeta.connected ? 'Connected' : 'Disconnected';
  const arena =
    typeof hudMeta.arenaId === 'number'
      ? `#${hudMeta.arenaId}`
      : hudMeta.arenaId === null
        ? '—'
        : String(hudMeta.arenaId ?? '—');
  const mode = hudMeta.mode ? String(hudMeta.mode) : '—';

  const roundClass =
    gameState?.phase === 'battle' && roundTime <= 10
      ? 'azw-hud-time-critical'
      : '';

  const historyRows = history.slice(0, 10).map((entry, index) => {
    const winnerName =
      entry.top3[0]?.name || entry.top3[0]?.pubkey.slice(0, 6) || '—';
    const firstPrize = entry.top3[0]?.prizeUsdc || 0;
    return (
      <div
        class="azw-hud-row azw-history-row"
        data-history-index={index}
        key={entry.arenaId}
        onClick={() => setSelectedHistoryIndex(index)}
      >
        <span class="azw-hud-match-id">Arena #{entry.arenaId}</span>
        <span class="azw-hud-name">{escapeHtml(winnerName)}</span>
        <span class="azw-hud-prize-amt">+{formatPrize(firstPrize)}</span>
      </div>
    );
  });

  return (
    <>
      <AgentConnect />
      <div class="azw-hud-divider" />
      <div class="azw-hud-grid">
        <div class="azw-hud-kv">
          <span>Phase</span>
          <b>{escapeHtml(String(phase))}</b>
        </div>
        <div class="azw-hud-kv">
          <span>Players</span>
          <b>{players.length}</b>
        </div>
        <div class="azw-hud-kv">
          <span>Round</span>
          <b class={roundClass}>{formatTime(roundTime)}</b>
        </div>
        <div class="azw-hud-kv">
          <span>Lobby</span>
          <b>{formatTime(waitTime)}</b>
        </div>
      </div>
      <div class="azw-hud-divider" />
      <div class="azw-hud-kv">
        <span>Socket</span>
        <b class="azw-hud-mono">{escapeHtml(hudMeta.socketId || '—')}</b>
      </div>
      <div class="azw-hud-kv">
        <span>API</span>
        <b>{escapeHtml(conn)}</b>
      </div>
      <div class="azw-hud-kv">
        <span>Arena</span>
        <b class="azw-hud-mono">{escapeHtml(arena)}</b>
      </div>
      <div class="azw-hud-kv">
        <span>Mode</span>
        <b>{escapeHtml(mode)}</b>
      </div>
      {hudMeta.lastError && (
        <div class="azw-hud-error">{escapeHtml(hudMeta.lastError)}</div>
      )}
      <div class="azw-hud-divider" />
      <div class="azw-hud-section">Leaderboard</div>
      <Leaderboard />
      <div class="azw-hud-divider" />
      <div class="azw-hud-section">Arena History</div>
      {historyRows.length > 0 ? (
        <div class="azw-hud-list">{historyRows}</div>
      ) : (
        <div class="azw-hud-muted">No past winners yet</div>
      )}
      <HistoryModal />
    </>
  );
}