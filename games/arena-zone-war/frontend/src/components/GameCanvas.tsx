import { useEffect, useRef } from 'preact/hooks';
import { useGameStore } from '../store/gameStore';
import {
  initPixi,
  layoutPixi,
  render,
  setInit,
} from '../renderer';

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameState = useGameStore((s) => s.gameState);
  const config = useGameStore((s) => s.config);
  const playerId = useGameStore((s) => s.playerId);

  useEffect(() => {
    if (!containerRef.current) return;

    let initialized = false;

    const init = async () => {
      if (initialized || !containerRef.current) return;
      initialized = true;

      await initPixi(containerRef.current);

      const ro = new ResizeObserver(() => {
        layoutPixi();
        const state = useGameStore.getState().gameState;
        if (state) render(state);
      });
      ro.observe(containerRef.current);
    };

    init();

    return () => {
      if (containerRef.current) {
        // cleanup if needed
      }
    };
  }, []);

  useEffect(() => {
    if (config && playerId) {
      setInit({ config, playerId });
    }
  }, [config, playerId]);

  useEffect(() => {
    if (gameState) {
      render(gameState);
    }
  }, [gameState]);

  return (
    <div class="azw-canvas-shell">
      <div class="azw-canvas-inner" ref={containerRef} />
    </div>
  );
}