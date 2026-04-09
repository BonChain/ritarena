"use client";

import { useState } from "react";

export default function WaitlistForm({ id = "hero" }: { id?: string }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      const emails = JSON.parse(localStorage.getItem("ritarena_waitlist") || "[]");
      if (!emails.includes(email)) {
        emails.push(email);
        localStorage.setItem("ritarena_waitlist", JSON.stringify(emails));
      }
    } catch {
      // ignore
    }

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div
        className="flex items-center gap-3 px-5 py-4 rounded-xl"
        style={{ background: "rgba(0, 255, 136, 0.08)", border: "1px solid rgba(0, 255, 136, 0.2)" }}
      >
        <span style={{ color: "#00FF88" }} className="text-lg">&#10003;</span>
        <span style={{ color: "#00FF88" }} className="font-medium text-sm">
          You&apos;re in! We&apos;ll notify you when RitArena launches.
        </span>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2" id={id}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F5F7" }}
          className="flex-1 px-4 py-3.5 rounded-xl text-sm outline-none transition-colors placeholder:text-[#55556a]"
        />
        <button
          type="submit"
          style={{ background: "#FF6B2C", color: "white" }}
          className="px-6 py-3.5 rounded-xl text-sm font-semibold hover:brightness-110 transition-all whitespace-nowrap cursor-pointer"
        >
          Get Early Access
        </button>
      </form>
      <p className="mt-3 text-xs" style={{ color: "#55556a" }}>
        Free. No spam. Just launch updates.
      </p>
    </div>
  );
}
