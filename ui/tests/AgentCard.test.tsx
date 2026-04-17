import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AgentCard } from "../src/components/AgentCard";

describe("AgentCard", () => {
  it("renders name and score", () => {
    render(<AgentCard name="ALPHA" score={42} status="alive" rank={1} />);
    expect(screen.getByText("ALPHA")).toBeDefined();
    expect(screen.getByText("42")).toBeDefined();
  });

  it("shows REKT for eliminated agents", () => {
    render(<AgentCard name="PAPER" score={-5} status="eliminated" rank={5} />);
    expect(screen.getByText("REKT")).toBeDefined();
  });

  it("shows WINNER for winner", () => {
    render(<AgentCard name="ALPHA" score={42} status="winner" rank={1} />);
    expect(screen.getByText("WINNER")).toBeDefined();
  });

  it("renders avatar when provided", () => {
    render(<AgentCard name="ALPHA" score={42} status="alive" rank={1} avatar="A" />);
    expect(screen.getByText("A")).toBeDefined();
  });
});
