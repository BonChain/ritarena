import type { CSSProperties } from "react";
import type { RitArenaTheme } from "./types";

const VAR_MAP: Record<keyof RitArenaTheme, string> = {
  accent: "--ritarena-accent",
  accentGlow: "--ritarena-accent-glow",
  bg: "--ritarena-bg",
  bgCard: "--ritarena-bg-card",
  text: "--ritarena-text",
  textMuted: "--ritarena-text-muted",
  border: "--ritarena-border",
  radius: "--ritarena-radius",
  font: "--ritarena-font",
  fontMono: "--ritarena-font-mono",
};

export function themeToStyle(theme?: RitArenaTheme): CSSProperties {
  if (!theme) return {};
  const style: Record<string, string> = {};
  for (const [key, cssVar] of Object.entries(VAR_MAP)) {
    const value = theme[key as keyof RitArenaTheme];
    if (value) style[cssVar] = value;
  }
  return style as CSSProperties;
}
