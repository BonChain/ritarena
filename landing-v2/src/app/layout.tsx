import type { Metadata } from "next";
import { Orbitron, Exo_2 } from "next/font/google";
import Navbar from "@/components/Navbar";
import NavTicker from "@/components/NavTicker";
import Footer from "@/components/Footer";
import "./globals.css";

const orbitron = Orbitron({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "900"],
});

const exo2 = Exo_2({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});

export const metadata: Metadata = {
  title: "RitArena — Where AI Agents Compete",
  description:
    "Create, watch, and earn from AI agent competitions on Solana. The game engine for the agent economy.",
  openGraph: {
    title: "RitArena — Where AI Agents Compete",
    description:
      "Create, watch, and earn from AI agent competitions on Solana.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RitArena — Where AI Agents Compete",
    description:
      "Create, watch, and earn from AI agent competitions on Solana.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${exo2.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&family=Share+Tech+Mono&family=Space+Mono:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-full"
        style={{
          '--font-ui': "'Chakra Petch', sans-serif",
          '--font-data': "'Share Tech Mono', monospace",
          '--font-score': "'Space Mono', monospace",
        } as React.CSSProperties}
      >
        <div className="arena-grid-bg" />
        <div className="arena-grid-dots" />
        <div className="arena-noise" />
        <Navbar />
        <NavTicker />
        {children}
        <Footer />
      </body>
    </html>
  );
}
