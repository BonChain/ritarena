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
  elimination: "var(--ritarena-danger)",
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
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (atBottom) el.scrollTop = el.scrollHeight;
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
      <div
        style={{
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--ritarena-text-muted)",
          marginBottom: "4px",
        }}
      >
        Events
      </div>
      {visible.length === 0 ? (
        <div
          style={{
            padding: "12px 0",
            color: "var(--ritarena-text-muted)",
            textAlign: "center",
            fontSize: "12px",
          }}
        >
          Waiting for events...
        </div>
      ) : (
        visible.map((event) => (
          <div
            key={event.timestamp}
            style={{
              padding: "3px 0",
              color: TYPE_COLORS[event.type],
              borderBottom: "1px solid var(--ritarena-border)",
            }}
          >
            {event.message}
          </div>
        ))
      )}
    </div>
  );
}
