"use client";

import { GodPowerBar } from "@ritarena/ui";

export function GodPowerDemo() {
  return (
    <GodPowerBar
      powers={[
        { id: "bomb", label: "Bomb Tile", icon: "💣", cooldown: 0, cost: 0.1 },
        { id: "wall", label: "Drop Wall", icon: "🧱", cooldown: 12, cost: 0.05 },
        { id: "freeze", label: "Freeze", icon: "❄️", cooldown: 0, cost: 0.08 },
      ]}
      onUse={(id) => console.log(id)}
    />
  );
}
