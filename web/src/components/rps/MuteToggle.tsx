"use client";

import { useEffect, useState } from "react";
import * as sfx from "@/lib/rps/sfx";

export default function MuteToggle() {
  const [muted, setMutedState] = useState(false);

  // Sync initial state on client (avoids SSR/hydration mismatch).
  useEffect(() => {
    setMutedState(sfx.isMuted());
  }, []);

  // React to mute changes from anywhere (other components, other tabs).
  useEffect(() => {
    const onLocal = (e: Event) => {
      setMutedState(Boolean((e as CustomEvent<boolean>).detail));
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === "rps-muted") setMutedState(e.newValue === "1");
    };
    window.addEventListener("rps-mute-change", onLocal);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("rps-mute-change", onLocal);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Keyboard `M` shortcut, but skip when typing in an input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "m" && e.key !== "M") return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      sfx.setMuted(!sfx.isMuted());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function toggle() {
    sfx.setMuted(!muted);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={muted ? "Unmute sound" : "Mute sound"}
      title={muted ? "Unmute (M)" : "Mute (M)"}
      className="text-lg w-9 h-9 rounded-md flex items-center justify-center transition-colors hover:bg-[rgba(255,255,255,0.06)]"
      style={{ color: muted ? "#55556a" : "#c0c0c0" }}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
