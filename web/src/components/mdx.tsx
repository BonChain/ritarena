import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { Mermaid } from "@/components/mdx/mermaid";
import { ComponentPreview } from "@/components/mdx/component-preview";
import { EliminationDemo } from "@/components/mdx/elimination-demo";
import { GodPowerDemo } from "@/components/mdx/god-power-demo";
import {
  Leaderboard,
  PrizePool,
  EventFeed,
  AgentCard,
  MatchResult,
  PhaseTimer,
  GodPowerBar,
  EliminationEffect,
} from "@/components/mdx/ritarena-ui-client";

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Mermaid,
    ComponentPreview,
    EliminationDemo,
    GodPowerDemo,
    Leaderboard,
    PrizePool,
    EventFeed,
    AgentCard,
    MatchResult,
    PhaseTimer,
    GodPowerBar,
    EliminationEffect,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
