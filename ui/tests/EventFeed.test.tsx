import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventFeed } from "../src/components/EventFeed";

const events = [
  { message: "ALPHA ATE 3 FOOD!", type: "hype" as const, timestamp: 1000 },
  { message: "PAPER ELIMINATED", type: "elimination" as const, timestamp: 2000 },
  { message: "Score update", type: "score" as const, timestamp: 3000 },
];

describe("EventFeed", () => {
  it("renders all events", () => {
    render(<EventFeed events={events} />);
    expect(screen.getByText("ALPHA ATE 3 FOOD!")).toBeDefined();
    expect(screen.getByText("PAPER ELIMINATED")).toBeDefined();
  });

  it("respects maxVisible", () => {
    render(<EventFeed events={events} maxVisible={2} />);
    expect(screen.queryByText("ALPHA ATE 3 FOOD!")).toBeNull();
    expect(screen.getByText("PAPER ELIMINATED")).toBeDefined();
    expect(screen.getByText("Score update")).toBeDefined();
  });
});
