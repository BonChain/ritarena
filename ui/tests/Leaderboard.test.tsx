// ui/tests/Leaderboard.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Leaderboard } from "../src/components/Leaderboard";

const players = [
  { id: "a", name: "ALPHA", score: 42, alive: true, rank: 1 },
  { id: "b", name: "DEGEN", score: 31, alive: true, rank: 2 },
  { id: "c", name: "PAPER", score: -5, alive: false, rank: 3 },
];

describe("Leaderboard", () => {
  it("renders all players by default", () => {
    render(<Leaderboard players={players} />);
    expect(screen.getByText("ALPHA")).toBeDefined();
    expect(screen.getByText("DEGEN")).toBeDefined();
    expect(screen.getByText("PAPER")).toBeDefined();
  });

  it("hides eliminated when showEliminated=false", () => {
    render(<Leaderboard players={players} showEliminated={false} />);
    expect(screen.getByText("ALPHA")).toBeDefined();
    expect(screen.queryByText("PAPER")).toBeNull();
  });

  it("respects maxVisible", () => {
    render(<Leaderboard players={players} maxVisible={2} />);
    expect(screen.getByText("ALPHA")).toBeDefined();
    expect(screen.getByText("DEGEN")).toBeDefined();
    expect(screen.queryByText("PAPER")).toBeNull();
  });

  it("sorts by rank", () => {
    const unsorted = [players[2], players[0], players[1]];
    render(<Leaderboard players={unsorted} />);
    const items = screen.getAllByRole("listitem");
    expect(items[0].textContent).toContain("ALPHA");
    expect(items[1].textContent).toContain("DEGEN");
  });
});
