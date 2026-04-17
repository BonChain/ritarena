import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PrizePool } from "../src/components/PrizePool";

describe("PrizePool", () => {
  it("renders total in USDC", () => {
    render(<PrizePool total={40_000_000} creatorFeeBps={500} protocolFeeBps={100} />);
    expect(screen.getByText("40.00")).toBeDefined();
    expect(screen.getByText("USDC")).toBeDefined();
  });

  it("calculates fee breakdown correctly", () => {
    // 40 USDC total: 1% protocol = 0.40, 5% creator = 2.00, prize = 37.60
    render(<PrizePool total={40_000_000} creatorFeeBps={500} protocolFeeBps={100} />);
    expect(screen.getByText("37.60")).toBeDefined();
  });

  it("respects custom currency", () => {
    render(<PrizePool total={1_000_000} creatorFeeBps={0} protocolFeeBps={100} currency="SOL" />);
    expect(screen.getByText("SOL")).toBeDefined();
  });
});
