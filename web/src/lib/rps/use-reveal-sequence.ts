"use client";

import { useEffect, useState } from "react";
import * as sfx from "./sfx";

type Options = {
  /** Changes when a new round resolves; null suppresses the sequence (e.g. during round-start). */
  epoch: number | null;
  /** Total tiles to reveal. */
  count: number;
};

const INITIAL_DELAY_MS = 250;
const STAGGER_MS = 150;

/**
 * Drives the stagger-reveal in `RpsRevealGrid`. When `epoch` flips to a
 * new value, holds every tile hidden for 250ms (suspense beat), plays the
 * reveal arpeggio, then increments `revealedCount` by 1 every 150ms until
 * all `count` tiles are visible.
 */
export function useRevealSequence({ epoch, count }: Options): { revealedCount: number } {
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    if (epoch === null) {
      setRevealedCount(0);
      return;
    }
    setRevealedCount(0);
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    timeouts.push(setTimeout(() => sfx.reveal(), INITIAL_DELAY_MS));
    for (let i = 0; i < count; i++) {
      timeouts.push(
        setTimeout(() => setRevealedCount(i + 1), INITIAL_DELAY_MS + i * STAGGER_MS)
      );
    }
    return () => timeouts.forEach(clearTimeout);
  }, [epoch, count]);

  return { revealedCount };
}
