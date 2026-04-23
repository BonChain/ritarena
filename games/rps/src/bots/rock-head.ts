import type { Bot } from "./types";

export const rockHead: Bot = {
  name: "@rock-head",
  tagline: "I really like rock. (50% rock.)",
  pickChoice() {
    const r = Math.random();
    if (r < 0.5) return "rock";
    if (r < 0.75) return "paper";
    return "scissors";
  },
};
