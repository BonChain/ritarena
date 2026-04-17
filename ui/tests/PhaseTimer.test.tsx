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
    const bar = container.querySelector("[data-testid='progress-bar']") as HTMLElement;
    expect(bar).not.toBeNull();
    expect(bar.style.width).toBe("60%");
    expect(bar.getAttribute("role")).toBe("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("3");
    expect(bar.getAttribute("aria-valuemax")).toBe("5");
  });

  it("renders 0% width when totalSeconds is 0", () => {
    const { container } = render(
      <PhaseTimer label="X" secondsRemaining={5} totalSeconds={0} />
    );
    const bar = container.querySelector("[data-testid='progress-bar']") as HTMLElement;
    expect(bar.style.width).toBe("0%");
  });

  it("shows urgent style at zero seconds", () => {
    render(<PhaseTimer label="END" secondsRemaining={0} totalSeconds={10} />);
    expect(screen.getByText("0s")).toBeDefined();
  });
});
