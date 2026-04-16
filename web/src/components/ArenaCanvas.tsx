"use client";

import { useEffect, useRef, useState } from "react";
import { emitKill } from "@/lib/kill-events";

interface Agent {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  health: number;
  maxHealth: number;
  color: string;
  name: string;
  type: "AI" | "Human";
  alive: boolean;
  score: number;
  attackTimer: number;
  flashTimer: number;
}

const AGENT_NAMES = [
  "AlphaBot", "Flanker", "Hunter", "Camper", "Berserker",
  "Sniper", "Tank", "Scout", "Healer", "Ghost",
  "Striker", "Viper", "Shadow", "Blaze", "Frost",
];

const COLORS = [
  "#14F195", "#9945FF", "#00CED1", "#ff5555", "#FFC53D",
  "#FF69B4", "#7FFF00", "#00CED1", "#40E0D0", "#FF4500",
  "#DA70D6", "#14F195", "#9945FF", "#6495ED", "#32CD32",
];

function createAgent(i: number, gridW: number, gridH: number): Agent {
  return {
    x: Math.random() * gridW,
    y: Math.random() * gridH,
    targetX: Math.random() * gridW,
    targetY: Math.random() * gridH,
    health: 100,
    maxHealth: 100,
    color: COLORS[i % COLORS.length],
    name: AGENT_NAMES[i % AGENT_NAMES.length],
    type: i < 12 ? "AI" : "Human",
    alive: true,
    score: 0,
    attackTimer: 0,
    flashTimer: 0,
  };
}

export default function ArenaCanvas({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const agentsRef = useRef<Agent[]>([]);
  const [kills, setKills] = useState<string[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
    };
    resize();
    window.addEventListener("resize", resize);

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    // Init agents
    agentsRef.current = Array.from({ length: 15 }, (_, i) => createAgent(i, w, h));

    let frame = 0;

    const loop = () => {
      frame++;
      const agents = agentsRef.current;
      const aliveAgents = agents.filter((a) => a.alive);

      ctx.clearRect(0, 0, w, h);

      // Draw grid
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 0.5;
      const gridSize = 40;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Update & draw agents
      for (const agent of agents) {
        if (!agent.alive) continue;

        // Move toward target
        const dx = agent.targetX - agent.x;
        const dy = agent.targetY - agent.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 2) {
          agent.x += (dx / dist) * 1.2;
          agent.y += (dy / dist) * 1.2;
        } else {
          // New target
          agent.targetX = Math.random() * w;
          agent.targetY = Math.random() * h;
        }

        // Attack nearby enemies
        agent.attackTimer--;
        if (agent.attackTimer <= 0) {
          for (const other of aliveAgents) {
            if (other === agent) continue;
            const adx = other.x - agent.x;
            const ady = other.y - agent.y;
            const adist = Math.sqrt(adx * adx + ady * ady);
            if (adist < 50) {
              const dmg = 5 + Math.random() * 10;
              other.health -= dmg;
              other.flashTimer = 8;
              agent.attackTimer = 20 + Math.random() * 30;

              // Draw attack line
              ctx.strokeStyle = agent.color;
              ctx.lineWidth = 1.5;
              ctx.globalAlpha = 0.6;
              ctx.beginPath();
              ctx.moveTo(agent.x, agent.y);
              ctx.lineTo(other.x, other.y);
              ctx.stroke();
              ctx.globalAlpha = 1;

              // Kill
              if (other.health <= 0) {
                other.alive = false;
                agent.score += 10;

                // Explosion particles
                for (let p = 0; p < 8; p++) {
                  const angle = (p / 8) * Math.PI * 2;
                  const px = other.x + Math.cos(angle) * 15;
                  const py = other.y + Math.sin(angle) * 15;
                  ctx.fillStyle = other.color;
                  ctx.globalAlpha = 0.5;
                  ctx.beginPath();
                  ctx.arc(px, py, 2, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.globalAlpha = 1;
                }

                const killMsg = `${agent.name} eliminated ${other.name}`;
                emitKill(killMsg);
                setKills((prev) => {
                  return [killMsg, ...prev].slice(0, 4);
                });
              }
              break;
            }
          }
        }

        // Flash when hit
        agent.flashTimer = Math.max(0, agent.flashTimer - 1);

        // Draw agent body
        const radius = 6;
        ctx.beginPath();
        ctx.arc(agent.x, agent.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = agent.flashTimer > 0 ? "#FFFFFF" : agent.color;
        ctx.fill();

        // Draw health bar
        const barW = 20;
        const barH = 3;
        const healthPct = agent.health / agent.maxHealth;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(agent.x - barW / 2, agent.y - radius - 8, barW, barH);
        ctx.fillStyle = healthPct > 0.5 ? "#00FF88" : healthPct > 0.25 ? "#FFC53D" : "#FF3355";
        ctx.fillRect(agent.x - barW / 2, agent.y - radius - 8, barW * healthPct, barH);

        // Draw name (occasional)
        if (frame % 120 < 60) {
          ctx.font = "9px monospace";
          ctx.fillStyle = "rgba(255,255,255,0.4)";
          ctx.textAlign = "center";
          ctx.fillText(agent.name, agent.x, agent.y + radius + 14);
        }
      }

      // Respawn if too few alive (keep the simulation going)
      if (aliveAgents.length < 5) {
        const deadAgents = agents.filter((a) => !a.alive);
        for (const dead of deadAgents.slice(0, 5)) {
          dead.alive = true;
          dead.health = dead.maxHealth;
          dead.x = Math.random() * w;
          dead.y = Math.random() * h;
          dead.targetX = Math.random() * w;
          dead.targetY = Math.random() * h;
          dead.score = 0;
        }
      }

      requestAnimationFrame(loop);
    };

    const animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-2xl"
        style={{ background: "rgba(10,10,15,0.8)" }}
      />
      {/* Kill feed overlay */}
      <div className="absolute top-3 right-3 space-y-1">
        {kills.map((msg, i) => (
          <div
            key={`${msg}-${i}`}
            className="text-[10px] px-2 py-1 rounded font-[family-name:var(--font-mono)]"
            style={{
              background: "rgba(0,0,0,0.6)",
              color: i === 0 ? "#ff5555" : "rgba(255,255,255,0.4)",
              opacity: 1 - i * 0.2,
            }}
          >
            {msg}
          </div>
        ))}
      </div>
      {/* Live badge */}
      <div
        className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold"
        style={{ background: "rgba(0,0,0,0.6)", color: "#F5F5F7" }}
      >
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#14F195" }} />
        LIVE ARENA
      </div>
    </div>
  );
}
