import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GodPowerBar } from "../src/components/GodPowerBar";

const powers = [
  { id: "bomb", label: "Bomb Tile", icon: "💣", cooldown: 0, cost: 0.1 },
  { id: "wall", label: "Drop Wall", icon: "🧱", cooldown: 12, cost: 0.05 },
];

describe("GodPowerBar", () => {
  it("renders all powers", () => {
    render(<GodPowerBar powers={powers} onUse={() => {}} />);
    expect(screen.getByText("💣")).toBeDefined();
    expect(screen.getByText("🧱")).toBeDefined();
  });

  it("calls onUse with power id when clicked", () => {
    const onUse = vi.fn();
    render(<GodPowerBar powers={powers} onUse={onUse} />);
    fireEvent.click(screen.getByText("💣"));
    expect(onUse).toHaveBeenCalledWith("bomb");
  });

  it("disables buttons on cooldown", () => {
    const onUse = vi.fn();
    render(<GodPowerBar powers={powers} onUse={onUse} />);
    fireEvent.click(screen.getByText("🧱"));
    expect(onUse).not.toHaveBeenCalled();
  });

  it("disables all when disabled prop is true", () => {
    const onUse = vi.fn();
    render(<GodPowerBar powers={powers} onUse={onUse} disabled={true} />);
    fireEvent.click(screen.getByText("💣"));
    expect(onUse).not.toHaveBeenCalled();
  });
});
