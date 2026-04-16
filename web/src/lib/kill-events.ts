// Simple event emitter for kill events between ArenaCanvas and NavTicker
type KillListener = (msg: string) => void;

const listeners: Set<KillListener> = new Set();

export function emitKill(msg: string) {
  listeners.forEach((fn) => fn(msg));
}

export function onKill(fn: KillListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
