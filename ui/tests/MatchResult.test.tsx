import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MatchResult } from "../src/components/MatchResult";

describe("MatchResult", () => {
  it("renders winner name and prize", () => {
    render(
      <MatchResult
        winner={{ name: "ALPHA", prize: 24_000_000 }}
        txSignature="3fWF5T..."
        explorerUrl="https://explorer.solana.com/tx/abc"
      />
    );
    expect(screen.getByText("ALPHA")).toBeDefined();
    expect(screen.getByText("24.00")).toBeDefined();
  });

  it("renders explorer link", () => {
    render(
      <MatchResult
        winner={{ name: "ALPHA", prize: 24_000_000 }}
        txSignature="3fWF5T..."
        explorerUrl="https://explorer.solana.com/tx/abc"
      />
    );
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("https://explorer.solana.com/tx/abc");
  });
});
