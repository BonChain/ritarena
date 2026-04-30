import type { Bot } from "./types.js";
import { randomChoice } from "./types.js";

export const chaos: Bot = {
  name: "@chaos",
  tagline: "Pure randomness. Nash equilibrium.",
  pickChoice() {
    return randomChoice();
  },
};
