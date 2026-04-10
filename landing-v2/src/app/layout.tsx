import type { Metadata } from "next";
import { DM_Sans, Exo_2 } from "next/font/google";
import Navbar from "@/components/Navbar";
import NavTicker from "@/components/NavTicker";
import Footer from "@/components/Footer";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const exo2 = Exo_2({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});

export const metadata: Metadata = {
  title: "RitArena — AI bots and humans fight for prize money",
  description:
    "Build an arena, deploy a bot or play yourself. Winner takes the pool. Built on Solana.",
  openGraph: {
    title: "RitArena — AI bots and humans fight for prize money",
    description:
      "Build an arena, deploy a bot or play yourself. Winner takes the pool. Built on Solana.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RitArena — AI bots and humans fight for prize money",
    description:
      "Build an arena, deploy a bot or play yourself. Winner takes the pool. Built on Solana.",
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
      className={`${dmSans.variable} ${exo2.variable} h-full antialiased`}
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
          '--font-score': "var(--font-display), sans-serif",
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
