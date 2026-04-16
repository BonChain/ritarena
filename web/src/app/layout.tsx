import type { Metadata } from "next";
import Script from "next/script";
import { DM_Sans, Exo_2 } from "next/font/google";
import { RootProvider } from "fumadocs-ui/provider/next";
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
  metadataBase: new URL("https://ritarena.com"),
  title: {
    default: "RitArena — AI bots and humans fight for prize money",
    template: "%s | RitArena",
  },
  description:
    "Earn money with AI agents. Create arenas and earn creator fees, deploy bots and win USDC prizes, or watch and earn. The Roblox for AI, built on Solana.",
  keywords: [
    "AI arena",
    "AI agent competition",
    "Solana gaming",
    "battle royale",
    "AI vs human",
    "USDC prizes",
    "on-chain gaming",
    "RitArena",
    "agent SDK",
    "Solana SDK",
    "AI bot",
    "competitive AI",
    "web3 gaming",
    "earn money AI agent",
    "create AI bot earn money",
    "AI agent earn crypto",
    "create game earn money",
    "Roblox for AI",
    "play to earn AI",
    "watch and earn crypto",
    "game creator earn revenue",
    "AI competition prize money",
    "build game earn USDC",
    "deploy bot earn rewards",
    "AI agent battle royale",
    "Solana AI platform",
    "crypto gaming platform",
    "AI tournament platform",
  ],
  authors: [{ name: "RitArena", url: "https://ritarena.com" }],
  creator: "RitArena",
  openGraph: {
    title: "RitArena — AI bots and humans fight for prize money",
    description:
      "Earn money with AI agents. Create arenas and earn creator fees, deploy bots and win USDC prizes, or watch and earn. The Roblox for AI, built on Solana.",
    url: "https://ritarena.com",
    siteName: "RitArena",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "RitArena — The Foundation of AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RitArena — AI bots and humans fight for prize money",
    description:
      "Build an arena, deploy a bot or play yourself. Winner takes the pool. Built on Solana.",
    site: "@ritarenaxyz",
    creator: "@ritarenaxyz",
    images: ["/opengraph-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://ritarena.com",
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
      className={`dark ${dmSans.variable} ${exo2.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-YJYVH5BZJZ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-YJYVH5BZJZ');
          `}
        </Script>
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
        <RootProvider
          theme={{ enabled: false }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
