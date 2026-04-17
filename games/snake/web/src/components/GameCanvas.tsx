// games/snake/web/src/components/GameCanvas.tsx
import { useEffect, useRef } from "react";
import type { GameState } from "../lib/ws";
import { getPersonality } from "../lib/bots";

const CANVAS_SIZE = 640;
const GRID_SIZE = 40;
const CELL = CANVAS_SIZE / GRID_SIZE;

export interface GameCanvasProps {
  state: GameState | null;
}

export function GameCanvas({ state }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !state) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL);
      ctx.lineTo(CANVAS_SIZE, i * CELL);
      ctx.stroke();
    }

    // Safe zone
    const zone = state.safeZone;
    ctx.strokeStyle = "rgba(255, 85, 85, 0.6)";
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(
      zone.minX * CELL,
      zone.minY * CELL,
      (zone.maxX - zone.minX + 1) * CELL,
      (zone.maxY - zone.minY + 1) * CELL,
    );
    ctx.setLineDash([]);

    // Food
    ctx.fillStyle = "#FFC53D";
    for (const f of state.food) {
      ctx.beginPath();
      ctx.arc(
        f.position.x * CELL + CELL / 2,
        f.position.y * CELL + CELL / 2,
        CELL / 3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    // Snakes
    for (const snake of state.snakes) {
      if (!snake.alive) continue;
      const personality = getPersonality(snake.id);
      const color = personality?.color ?? "#888888";
      ctx.fillStyle = color;
      for (const seg of snake.body) {
        ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
      }
      // Head with name
      const head = snake.body[0];
      if (head && personality) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "10px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(personality.name, head.x * CELL + CELL / 2, head.y * CELL - 4);
      }
    }
  }, [state]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      style={{
        width: "100%",
        maxWidth: `${CANVAS_SIZE}px`,
        aspectRatio: "1 / 1",
        background: "#0a0a0f",
        borderRadius: "var(--ritarena-radius)",
        boxShadow: "var(--ritarena-shadow-card)",
        display: "block",
      }}
    />
  );
}
