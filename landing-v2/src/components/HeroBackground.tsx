"use client";

export default function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      {/* Uncomment when video ready: */}
      {/*
      <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-30">
        <source src="/videos/hero-bg.mp4" type="video/mp4" />
      </video>
      */}

      <div className="absolute inset-0" style={{ background: "#0a0a0f" }} />
      <div className="absolute inset-0 grid-bg" />

      {/* Glow orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] animate-pulse"
        style={{ background: "rgba(20, 241, 149, 0.05)" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px] animate-pulse"
        style={{ background: "rgba(153, 69, 255, 0.05)", animationDelay: "1s" }}
      />

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40"
        style={{ background: "linear-gradient(to top, #0a0a0f, transparent)" }}
      />
    </div>
  );
}
