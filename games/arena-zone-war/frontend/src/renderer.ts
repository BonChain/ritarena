import * as PIXI from "pixi.js";
import { playHitSound, playDeathSound, playZoneCaptureSound } from "./sounds.js";

export const app = new PIXI.Application();

let GAME_CONFIG: any = null;
let MY_ID: string | null = null;
let mountEl: HTMLElement | null = null;

let previousPlayerHp: Record<string, number> = {};
let previousZoneOwners: Record<string, string | null> = {};

let particles: Array<{
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: number;
  size: number;
}> = [];

let shakeOffset = { x: 0, y: 0 };
let shakeTime = 0;

let crownPulse = 0;

const particleContainer = new PIXI.Container();

/* ================== STORAGE ================== */

const playerGraphics: Record<string, PIXI.Container> = {};
const zoneGraphics: Record<string, PIXI.Container> = {};
const attackGraphics: Record<string, PIXI.Graphics> = {};

/* ================== INIT ================== */

export async function initPixi(container: HTMLElement) {
  mountEl = container;

  await app.init({
    width: 640,
    height: 640,
    backgroundColor: 0x111111,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(2, window.devicePixelRatio || 1),
  });

  const overlay = document.createElement("div");
  overlay.id = "final-seconds-overlay";
  overlay.textContent = "FINAL SECONDS!";
  container.appendChild(overlay);

  app.stage.addChild(particleContainer);
  container.appendChild(app.canvas);
  layoutPixi();
  window.addEventListener("resize", layoutPixi);
}

export function layoutPixi() {
  if (!mountEl) return;

  const w = Math.min(900, Math.max(320, mountEl.clientWidth));
  const h = Math.min(700, Math.max(320, mountEl.clientHeight));

  app.renderer.resize(w, h);
  updateWorldOffset();
}

/* ================== INIT DATA ================== */

let worldWidth = 20;
let worldHeight = 20;
let offsetX = 0;
let offsetY = 0;
let scale = 1;

function updateWorldOffset() {
  scale = Math.min(app.renderer.width / worldWidth, app.renderer.height / worldHeight) * 0.95;
  offsetX = (app.renderer.width - worldWidth * scale) / 2;
  offsetY = (app.renderer.height - worldHeight * scale) / 2;
}

export function setInit(data: any) {
  GAME_CONFIG = data.config;
  MY_ID = data.playerId;
  previousPlayerHp = {};
  previousZoneOwners = {};
  particles = [];

  if (data.config?.map) {
    worldWidth = data.config.map.width;
    worldHeight = data.config.map.height;
  }
  updateWorldOffset();
}

/* ================== UTILS ================== */

function getScale() {
  return scale;
}

const toScreenX = (v: number) => offsetX + v * getScale();
const toScreenY = (v: number) => offsetY + v * getScale();

/* ================== COLORS ================== */

const COLORS = {
  me: 0x00ff88,
  other: 0x00aaff,
  invuln: 0xffffff,
  zoneNeutral: 0x666666,
  hit: 0xff4444,
  death: 0xff6600,
  crown1: 0xffd700,
  crown2: 0xc0c0c0,
  crown3: 0xcd7f32,
};

/* ================== PARTICLES ================== */

function spawnParticles(x: number, y: number, count: number, color: number, speed: number = 100) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const vel = speed * (0.5 + Math.random() * 0.5);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * vel,
      vy: Math.sin(angle) * vel,
      life: 1,
      maxLife: 1,
      color,
      size: 3 + Math.random() * 4,
    });
  }
}

function updateParticles(dt: number) {
  particleContainer.removeChildren();

  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt * 3;
    p.vx *= 0.95;
    p.vy *= 0.95;

    if (p.life <= 0) continue;

    const alpha = Math.max(0, p.life);
    const size = p.size * p.life;

    const g = new PIXI.Graphics();
    g.circle(p.x, p.y, size).fill({ color: p.color, alpha });
    particleContainer.addChild(g);
  }

  particles = particles.filter((p) => p.life > 0);
}

/* ================== SCREEN SHAKE ================== */

function triggerShake(intensity: number, duration: number) {
  shakeTime = duration;
  shakeOffset.x = (Math.random() - 0.5) * intensity * 2;
  shakeOffset.y = (Math.random() - 0.5) * intensity * 2;
}

function applyShake() {
  if (shakeTime > 0) {
    app.stage.x = shakeOffset.x;
    app.stage.y = shakeOffset.y;
    shakeTime -= 0.016;
    if (shakeTime <= 0) {
      shakeOffset.x = 0;
      shakeOffset.y = 0;
      app.stage.x = 0;
      app.stage.y = 0;
    }
  }
}

/* ================== RENDER ================== */

export function render(state: any) {
  if (!state || !app.stage) return;

  const scale = getScale();
  crownPulse += 0.03;
  const crownScale = 1 + Math.sin(crownPulse) * 0.1;

  const sorted = [...state.players].sort((a: any, b: any) => b.score - a.score);
  const top3Ids = new Set(sorted.slice(0, 3).map((p: any) => p.id));

  /* ================== ZONES ================== */

  for (const z of state.zones) {
    let c = zoneGraphics[z.id];

    if (!c) {
      c = new PIXI.Container();
      app.stage.addChild(c);
      zoneGraphics[z.id] = c;
    }

    c.removeChildren();

    const ownerColor = z.ownerId ? hashColor(z.ownerId) : COLORS.zoneNeutral;

    const x = toScreenX(z.x);
    const y = toScreenY(z.y);
    const r = z.radius * scale;

    c.addChild(
      new PIXI.Graphics()
        .circle(x, y, r)
        .stroke({ width: 2, color: ownerColor })
        .fill({ color: ownerColor, alpha: 0.2 })
    );

    const displayOwnerName = z.ownerName ?? (z.ownerId ? z.ownerId.slice(0, 4) : null);
    if (displayOwnerName) {
      const text = new PIXI.Text({
        text: displayOwnerName,
        style: { fill: ownerColor, fontSize: 12 },
      });
      text.anchor.set(0.5);
      text.x = x;
      text.y = y;
      c.addChild(text);
    }

    if (z.ownerId !== previousZoneOwners[z.id] && previousZoneOwners[z.id] !== undefined && z.ownerId) {
      playZoneCaptureSound();
    }
    previousZoneOwners[z.id] = z.ownerId;
  }

  /* ================== ATTACKS ================== */

  if (state.attacks) {
    for (const a of state.attacks) {
      let g = attackGraphics[a.id];

      if (!g) {
        g = new PIXI.Graphics();
        attackGraphics[a.id] = g;
        app.stage.addChild(g);
      }

      const x = toScreenX(a.x);
      const y = toScreenY(a.y);
      const size = Math.max(3, scale * 0.25);

      g.clear();
      g.circle(x, y, size).fill({ color: 0xffcc00, alpha: 0.85 });
      g.circle(x, y, size * 1.8).stroke({ width: 1, color: 0xffcc00, alpha: 0.3 });
    }
  }

  /* ================== PLAYERS ================== */

  for (const p of state.players) {
    let c = playerGraphics[p.id];

    if (!c) {
      c = new PIXI.Container();
      app.stage.addChild(c);
      playerGraphics[p.id] = c;
    }

    c.removeChildren();

    const x = toScreenX(p.x);
    const y = toScreenY(p.y);
    const radius = (GAME_CONFIG?.player?.radius ?? 0.5) * scale;
    const color = p.id === MY_ID ? COLORS.me : COLORS.other;

    if (previousPlayerHp[p.id] !== undefined && previousPlayerHp[p.id] > 0 && p.hp <= 0) {
      spawnParticles(x, y, 18, COLORS.death, 120);
      triggerShake(4, 0.2);
      playDeathSound();
    } else if (previousPlayerHp[p.id] !== undefined && previousPlayerHp[p.id] > p.hp) {
      spawnParticles(x, y, 10, COLORS.hit, 80);
      playHitSound();
    }
    previousPlayerHp[p.id] = p.hp;

    /* ================== BODY ================== */
    c.addChild(
      new PIXI.Graphics()
        .circle(x, y, radius)
        .fill({ color: p.invulnTime > 0 ? COLORS.invuln : color })
    );

    /* ================== NAME ================== */
    const displayName = p.name || (p.pubkey || p.id || "").toString().slice(0, 6);
    const nameText = new PIXI.Text({
      text: displayName,
      style: { fontSize: 10, fill: 0xffffff, align: "center" },
    });
    nameText.anchor.set(0.5, 0);
    nameText.x = x;
    nameText.y = y + radius + 3;
    c.addChild(nameText);

    /* ================== CROWN ================== */
    if (top3Ids.has(p.id)) {
      const rank = sorted.findIndex((s: any) => s.id === p.id);
      let crownEmoji = "👑";
      if (rank === 1) {
        crownEmoji = "🥈";
      } else if (rank === 2) {
        crownEmoji = "🥉";
      }

      const crownText = new PIXI.Text({
        text: crownEmoji,
        style: { fontSize: 14 },
      });
      crownText.anchor.set(0.5, 1);
      crownText.x = x;
      crownText.y = y - radius - 16;
      crownText.scale.set(crownScale);
      c.addChild(crownText);
    }

    /* ================== HP HUD ================== */

    const maxHp = GAME_CONFIG?.player?.defaultHp ?? 100;
    const hpRatio = Math.max(0, Math.min(1, p.hp / maxHp));
    const barWidth = 30;
    const barHeight = 4;
    const barX = x - barWidth / 2;
    const barY = y - radius - 12;

    c.addChild(
      new PIXI.Graphics()
        .roundRect(barX, barY, barWidth, barHeight, 2)
        .fill({ color: 0x222222, alpha: 0.8 })
    );

    c.addChild(
      new PIXI.Graphics()
        .roundRect(barX, barY, barWidth * hpRatio, barHeight, 2)
        .fill({
          color: hpRatio > 0.6 ? 0x00ff88 : hpRatio > 0.3 ? 0xffff00 : 0xff3333,
        })
    );

    c.addChild(
      new PIXI.Graphics()
        .roundRect(barX, barY, barWidth, barHeight, 2)
        .stroke({ width: 1, color: 0xffffff, alpha: 0.4 })
    );

    /* ================== DIRECTION ================== */

    c.addChild(
      new PIXI.Graphics()
        .moveTo(x, y)
        .lineTo(x + p.dirX * scale, y + p.dirY * scale)
        .stroke({ width: 2, color: 0xffffff })
    );

    /* ================== COOLDOWN ================== */

    const cooldownMax = GAME_CONFIG?.attack?.cooldown ?? 1;
    const ratio = 1 - Math.min(p.attackCooldown / cooldownMax, 1);
    const cw = 20;
    const ch = 3;

    c.addChild(
      new PIXI.Graphics()
        .rect(x - cw / 2, y - 20, cw, ch)
        .fill({ color: 0x333333, alpha: 0.5 })
    );

    c.addChild(
      new PIXI.Graphics()
        .rect(x - cw / 2, y - 20, cw * ratio, ch)
        .fill({
          color: ratio > 0.8 ? 0x00ff88 : ratio > 0.3 ? 0xffff00 : 0xff3333,
        })
    );

    /* READY PULSE */
    if (p.attackCooldown < 0.05 && p.attackCooldown > 0) {
      c.addChild(
        new PIXI.Graphics()
          .circle(x, y, radius * 2)
          .stroke({ width: 2, color: 0xffffff })
      );
    }
  }

  updateParticles(0.016);
  applyShake();

  /* ================== FINAL SECONDS OVERLAY ================== */
  const overlay = document.getElementById("final-seconds-overlay");
  if (overlay) {
    if (state.phase === "battle" && state.roundTime <= 10) {
      overlay.classList.add("visible");
      if (state.roundTime <= 5) {
        overlay.textContent = "⚠️ FINAL SECONDS! ⚠️";
      } else {
        overlay.textContent = "FINAL SECONDS!";
      }
    } else {
      overlay.classList.remove("visible");
    }
  }

  /* ================== CLEANUP ================== */

  for (const id in zoneGraphics) {
    if (!state.zones.find((z: any) => z.id === id)) {
      app.stage.removeChild(zoneGraphics[id]);
      delete zoneGraphics[id];
    }
  }

  for (const id in playerGraphics) {
    if (!state.players.find((p: any) => p.id === id)) {
      app.stage.removeChild(playerGraphics[id]);
      delete playerGraphics[id];
      delete previousPlayerHp[id];
    }
  }

  for (const id in attackGraphics) {
    if (!state.attacks?.find((a: any) => a.id === id)) {
      app.stage.removeChild(attackGraphics[id]);
      delete attackGraphics[id];
    }
  }
}

/* ================== COLOR HASH ================== */

function hashColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (hash & 0xffffff) | 0x555555;
}
