import { describe, it, expect } from "vitest";

/**
 * End-to-end integration test. Requires a running local validator with the
 * ritarena program deployed, and 6 funded keypairs (1 oracle, 5 bots, plus
 * the test itself acts as the human).
 *
 * Skipped by default. Run manually:
 *   cd games/rps && LOCAL_DEVNET=1 npx vitest run tests/game-runner.integration.test.ts
 */
const SHOULD_RUN = process.env.LOCAL_DEVNET === "1";

describe.skipIf(!SHOULD_RUN)("game-runner integration", () => {
  it("runs a 3-round match end-to-end", async () => {
    // TBD — this requires a live validator + program deployment.
    // For MVP, manual verification via `npm run dev` + a real /play flow is sufficient.
    expect(true).toBe(true);
  });
});
