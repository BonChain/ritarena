import { useRef, useEffect } from "react";
import type { GameEvent, RitArenaTheme } from "../types";
import { themeToStyle } from "../theme";

export interface EventFeedProps {
  events: GameEvent[];
  maxVisible?: number;
  theme?: RitArenaTheme;
  className?: string;
}

const TYPE_COLORS: Record<GameEvent["type"], string> = {
  hype: "var(--ritarena-accent)",
  elimination: "#ff5555",
  score: "var(--ritarena-text)",
  system: "var(--ritarena-text-muted)",
};

export function EventFeed({
  events,
  maxVisible = 50,
  theme,
  className,
}: EventFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const visible = events.slice(-maxVisible);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length]);

  return (
    <div
      className={className}
      ref={scrollRef}
      style={{
        ...themeToStyle(theme),
        background: "var(--ritarena-bg-card)",
        border: "1px solid var(--ritarena-border)",
        borderRadius: "var(--ritarena-radius)",
        fontFamily: "var(--ritarena-font-mono)",
        padding: "8px 12px",
        maxHeight: "200px",
        overflowY: "auto",
        fontSize: "13px",
      }}
    >
      {visible.map((event, i) => (
        <div
          key={`${event.timestamp}-${i}`}
          style={{
            padding: "3px 0",
            color: TYPE_COLORS[event.type],
            borderBottom: "1px solid var(--ritarena-border)",
          }}
        >
          {event.message}
        </div>
      ))}
    </div>
  );
}
