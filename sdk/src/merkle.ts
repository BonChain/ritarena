// sdk/src/merkle.ts

import { createHash } from "crypto";

export function hashLeaf(data: Record<string, string | number>): Buffer {
  const str = Object.entries(data)
    .map(([k, v]) => `${k}:${v}`)
    .join(":");
  return createHash("sha256").update(str).digest();
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
