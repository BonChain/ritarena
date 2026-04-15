// examples/snake-game/src/ritarena_sdk/merkle.ts

import { createHash } from "crypto";
import type { GameAction } from "./adapter.js";

export function hashLeaf(action: GameAction): Buffer {
  const data = `${action.round}:${action.tick}:${action.snakeId}:${action.action}:${action.result}:${action.score}`;
  return createHash("sha256").update(data).digest();
}

export function computeMerkleRoot(leaves: Buffer[]): Buffer {
  if (leaves.length === 0) return Buffer.alloc(32);
  if (leaves.length === 1) return leaves[0];

  const next: Buffer[] = [];
  for (let i = 0; i < leaves.length; i += 2) {
    const left = leaves[i];
    const right = i + 1 < leaves.length ? leaves[i + 1] : left;
    const combined =
      Buffer.compare(left, right) < 0
        ? Buffer.concat([left, right])
        : Buffer.concat([right, left]);
    next.push(createHash("sha256").update(combined).digest());
  }
  return computeMerkleRoot(next);
}
