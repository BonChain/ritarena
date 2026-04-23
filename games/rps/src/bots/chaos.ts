import type { Bot } from "./types";
import { randomChoice } from "./types";

export const chaos: Bot = {
  name: "@chaos",
  tagline: "Pure randomness. Nash equilibrium.",
  pickChoice() {
    return randomChoice();
  },
};
