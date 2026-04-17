import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { EliminationEffect } from "../src/components/EliminationEffect";

describe("EliminationEffect", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows overlay when trigger is truthy", () => {
    render(<EliminationEffect agentName="PAPER" trigger={1} />);
    expect(screen.getByText("REKT")).toBeDefined();
    expect(screen.getByText("PAPER")).toBeDefined();
  });

  it("does not show overlay when trigger is falsy", () => {
    render(<EliminationEffect agentName="PAPER" trigger={false} />);
    expect(screen.queryByText("REKT")).toBeNull();
  });

  it("auto-hides after 2 seconds", () => {
    render(<EliminationEffect agentName="PAPER" trigger={1} />);
    expect(screen.getByText("REKT")).toBeDefined();
    act(() => {
      vi.advanceTimersByTime(2001);
    });
    expect(screen.queryByText("REKT")).toBeNull();
  });

  it("variant fade/shatter shows ELIMINATED instead of REKT", () => {
    render(<EliminationEffect agentName="PAPER" trigger={1} variant="fade" />);
    expect(screen.getByText("ELIMINATED")).toBeDefined();
  });
});
