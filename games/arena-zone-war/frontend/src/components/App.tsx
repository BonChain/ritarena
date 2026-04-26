import { useEffect } from 'preact/hooks';
import { io } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';
import { HUD } from './HUD';
import { GameCanvas } from './GameCanvas';
import { Tutorial } from './Tutorial';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

const LOCAL_STORAGE_KEY = 'azw_lastState';
const HISTORY_STORAGE_KEY = 'azw_history';

function loadPersistedState(): any {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistState(state: any) {
  if (!state) return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function loadPersistedHistory(): any[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistHistory(history: any[]) {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {}
}

export function App() {
  const setGameState = useGameStore((s) => s.setGameState);
  const setHudMeta = useGameStore((s) => s.setHudMeta);
  const setHistory = useGameStore((s) => s.setHistory);
  const setConfig = useGameStore((s) => s.setConfig);
  const setPlayerId = useGameStore((s) => s.setPlayerId);

  useEffect(() => {
    const persistedState = loadPersistedState();
    const persistedHistory = loadPersistedHistory();

    if (persistedState) {
      setGameState(persistedState);
    }
    if (persistedHistory.length > 0) {
      setHistory(persistedHistory);
    }

    const socket = io(SERVER_URL, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 600,
      reconnectionDelayMax: 8000,
      transports: ["websocket", "polling"],
    });

    console.log(`[CLIENT] Connecting to ${SERVER_URL} with transports: websocket, polling`);

    socket.on('connect', () => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [CONNECT] socket_id=${socket.id} connected to ${SERVER_URL}`);
      setHudMeta({ connected: true, lastError: null });
      socket.emit('join_game', { role: 'spectator' });
    });

    socket.on('disconnect', (reason) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [DISCONNECT] socket_id=${socket.id} reason=${reason}`);
      setHudMeta({ connected: false });
    });

    socket.on('connect_error', (err) => {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] [CONNECT_ERROR] socket_id=${socket.id} error=${err?.message || 'unknown'} url=${SERVER_URL}`);
      console.error(`[${timestamp}] [CONNECT_ERROR] err=${JSON.stringify(err)}`);
      setHudMeta({ connected: false, lastError: err?.message || 'connect_error' });
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [RECONNECT] attempt=${attemptNumber} url=${SERVER_URL}`);
    });

    socket.on('reconnect_failed', () => {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] [RECONNECT_FAILED] url=${SERVER_URL}`);
    });

    socket.on('history', (payload) => {
      if (Array.isArray(payload)) {
        setHistory(payload);
        persistHistory(payload);
      }
    });

    socket.on('init', (payload) => {
      setHudMeta({
        lastError: null,
        arenaId: typeof payload?.arenaId === 'number' ? payload.arenaId : useGameStore.getState().hudMeta.arenaId,
        mode: typeof payload?.mode === 'string' ? payload.mode : useGameStore.getState().hudMeta.mode,
        entryFee: typeof payload?.entryFee === 'number' ? payload.entryFee : undefined,
        prizeSplit: Array.isArray(payload?.prizeSplit) ? payload.prizeSplit : undefined,
      });

      if (typeof payload?.arenaId === 'number') {
        sessionStorage.setItem('azw_arenaId', String(payload.arenaId));
      }
      if (typeof payload?.mode === 'string') {
        sessionStorage.setItem('azw_mode', payload.mode);
      }

      setConfig(payload.config);
      setPlayerId(payload.playerId);
      setGameState(payload.state);
      persistState(payload.state);
    });

    socket.on('state', (payload) => {
      setGameState(payload.state);
      persistState(payload.state);
    });

    socket.on('arena_ready', (payload) => {
      if (typeof payload?.arenaId === 'number') {
        setHudMeta({ arenaId: payload.arenaId });
        sessionStorage.setItem('azw_arenaId', String(payload.arenaId));
      }
      if (typeof payload?.mode === 'string') {
        setHudMeta({ mode: payload.mode });
        sessionStorage.setItem('azw_mode', payload.mode);
      }
    });

    socket.on('arena_cycle', (payload) => {
      if (typeof payload?.arenaId === 'number') {
        setHudMeta({
          arenaId: payload.arenaId,
          lastError: null,
        });
        sessionStorage.setItem('azw_arenaId', String(payload.arenaId));
      }
      if (typeof payload?.mode === 'string') {
        setHudMeta({ mode: payload.mode });
        sessionStorage.setItem('azw_mode', payload.mode);
      }
    });

    socket.on('join_error', (payload) => {
      setHudMeta({ lastError: payload?.message || 'join_error' });
    });

    setHudMeta({ socketId: socket.id ?? null });

    setInterval(() => {
      socket.emit('get_history', 20);
    }, 30000);

    return () => {
      socket.disconnect();
    };
  }, []);

  const hudMeta = useGameStore((s) => s.hudMeta);
  const arenaId = hudMeta.arenaId;
  const mode = hudMeta.mode;

  return (
    <div class="azw-root">
      <div class="azw-topbar">
        <div class="azw-brand">
          <div class="azw-title">Arena Zone War</div>
          <div class="azw-subtitle">Live Solana arena spectator</div>
        </div>
        <div class="azw-status">
          <div class="azw-pill" title="Realtime connection">
            <span class={`azw-dot ${hudMeta.connected ? 'ok' : 'bad'}`} />
            <span>{hudMeta.connected ? 'Live' : 'Offline'}</span>
          </div>
          <div class="azw-pill" title="Active arena id (from server)">
            <span style={{ color: 'var(--muted)' }}>Arena</span>
            <span class="azw-hud-mono" style={{ color: 'var(--text)' }}>
              {typeof arenaId === 'number' ? `#${arenaId}` : arenaId === null ? '—' : String(arenaId ?? '—')}
            </span>
          </div>
          <div class="azw-pill" title="Blockchain mode reported by server">
            <span style={{ color: 'var(--muted)' }}>Mode</span>
            <span style={{ color: 'var(--text)', fontWeight: '650' }}>{mode}</span>
          </div>
        </div>
      </div>

      <div class="azw-layout">
        <aside class="azw-side">
          <Tutorial />
        </aside>

        <div class="azw-center">
          <GameCanvas />
        </div>

        <aside class="azw-side right">
          <HUD />
        </aside>
      </div>

      <div class="azw-footer">
        <div>
          Server: <a href={SERVER_URL} target="_blank" rel="noreferrer">{SERVER_URL}</a>
          · Devnet explorer for txs is linked in your server logs when <span class="azw-hud-mono">ARENA_MODE</span> is on-chain.
        </div>
      </div>
    </div>
  );
}