import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PhaseTimer } from "../src/components/PhaseTimer";

describe("PhaseTimer", () => {
  it("renders label and time", () => {
    render(<PhaseTimer label="OPEN PHASE" secondsRemaining={4} totalSeconds={7} />);
    expect(screen.getByText("OPEN PHASE")).toBeDefined();
    expect(screen.getByText("4s")).toBeDefined();
  });

  it("shows progress bar proportional to remaining time", () => {
    const { container } = render(
      <PhaseTimer label="BID" secondsRemaining={3} totalSeconds={5} />
    );
    const bar = container.querySelector("[data-testid='progress-bar']");
    expect(bar).toBeDefined();
  });
});
