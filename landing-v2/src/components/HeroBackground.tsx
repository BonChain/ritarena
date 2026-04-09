"use client";

export default function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      {/* Bottom fade — smooth transition from hero into content */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40"
        style={{ background: "linear-gradient(to top, #0a0a0f, transparent)" }}
      />
    </div>
  );
}
