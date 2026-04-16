// examples/snake-game/src/ritarena_sdk/merkle.ts
// Re-export from SDK v0.3.0 instead of duplicating

import {
  hashLeaf as sdkHashLeaf,
  computeMerkleRoot as sdkComputeMerkleRoot,
} from "@ritarena/sdk";
import type { GameAction } from "./adapter.js";

export function hashLeaf(action: GameAction): Buffer {
  return sdkHashLeaf(action as unknown as Record<string, string | number>);
}

export { sdkComputeMerkleRoot as computeMerkleRoot };
