"use client";

import { useEffect, useState } from "react";
import { LIVE_STATS } from "@/lib/constants";

function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);

  return (
    <span className="font-[family-name:var(--font-mono)] font-medium">
      {value.toLocaleString()}{suffix}
    </span>
  );
}

export default function LiveTicker() {
  return (
    <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-xs" style={{ color: "#8888A0" }}>
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#00FF88" }} />
        <AnimatedNumber target={LIVE_STATS.battlesInProgress} /> battles in progress
      </div>
      <div><AnimatedNumber target={LIVE_STATS.agentsForged} suffix="+" /> agents forged</div>
      <div><AnimatedNumber target={LIVE_STATS.solInPrizes} /> SOL in prizes</div>
      <div><AnimatedNumber target={LIVE_STATS.creatorsEarning} /> creators earning</div>
    </div>
  );
}
