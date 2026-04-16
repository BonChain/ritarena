# Plan C: YogenFlow Dashboard

> **Status:** Ready for execution
> **Created:** 2026-04-02
> **Developer:** Junior dev (Express.js experience, React basics, first Next.js project)
> **Timeline:** Apr 22-28 (Week 4), ~5 working days
> **Depends on:** Plan B (SDK + Agents) -- needs running Agent Service API
> **Blocks:** Nothing (final deliverable layer)

---

## Goal

Build the YogenFlow Dashboard -- a Next.js web application that displays agent leaderboards, prediction market data, and competition results. This is the user-facing product layer that hackathon judges will see during the demo. It consumes data from the Agent Service REST API (Plan B) and optionally reads on-chain data via the YogenFlow SDK.

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Browser (Next.js App)                │
│  ┌──────────┬──────────┬──────────┬───────────┐ │
│  │ Markets  │Leaderboard│ Agent   │Competition│ │
│  │  Page    │  Page     │ Detail  │  Results  │ │
│  └────┬─────┴────┬─────┴────┬────┴─────┬─────┘ │
│       │          │          │          │         │
│  ┌────▼──────────▼──────────▼──────────▼─────┐  │
│  │          lib/api.ts (fetch client)         │  │
│  └────────────────┬──────────────────────────┘  │
│                   │                              │
│  ┌────────────────▼──────────────────────────┐  │
│  │     @solana/wallet-adapter-react           │  │
│  │     (wallet connection for future trading) │  │
│  └────────────────────────────────────────────┘  │
└───────────────────┬──────────────────────────────┘
                    │ HTTP (fetch)
┌───────────────────▼──────────────────────────────┐
│         Agent Service REST API (Plan B)           │
│  GET /api/markets    GET /api/agents              │
│  GET /api/markets/:id GET /api/agents/:wallet     │
│  GET /api/leaderboard GET /api/health             │
└──────────────────────────────────────────────────┘
```

## Tech Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| Next.js | 15+ (latest via create-next-app) | App Router, React Server Components |
| React | 19+ | UI framework (bundled with Next.js) |
| TypeScript | ^5.0 | Type safety |
| Tailwind CSS | v4 (bundled with create-next-app) | Utility-first styling |
| Recharts | ^2.15 | P&L line chart on agent detail page |
| @solana/wallet-adapter-react | ^0.15 | Wallet connection UI |
| @solana/wallet-adapter-react-ui | ^0.9 | Pre-built wallet button |
| @solana/wallet-adapter-wallets | ^0.19 | Phantom, Solflare wallet adapters |
| @solana/web3.js | ^1.98 | Solana RPC connection |

> **For agentic workers:** This plan follows the superpowers:subagent-driven-development pattern. Each task is self-contained with explicit file lists, complete code blocks, verification commands, and commit steps. An AI coding agent can execute each task sequentially without ambiguity.

---

## Task 0: Next.js Project Scaffold

**Files:**
- `dashboard/` (entire new directory)
- `dashboard/package.json`
- `dashboard/next.config.ts`
- `dashboard/tsconfig.json`
- `dashboard/src/app/globals.css`

### Step 0.1 -- Create the Next.js project

- [ ] Run from the project root:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier
npx create-next-app@latest dashboard --yes --ts --tailwind --eslint --app --src-dir --turbopack --import-alias "@/*"
```

Expected output (last lines):
```
Success! Created dashboard at ...
```

### Step 0.2 -- Install additional dependencies

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/dashboard
npm install recharts @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets @solana/web3.js@1
```

### Step 0.3 -- Configure next.config.ts

- [ ] Replace the contents of `dashboard/next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy API requests to the Agent Service in development
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
```

### Step 0.4 -- Create environment file

- [ ] Create `dashboard/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

### Step 0.5 -- Replace globals.css with dark theme base

- [ ] Replace the contents of `dashboard/src/app/globals.css`:

```css
@import "tailwindcss";

:root {
  --color-bg-primary: #0a0e17;
  --color-bg-secondary: #111827;
  --color-bg-card: #1a2035;
  --color-bg-hover: #243049;
  --color-border: #2d3748;
  --color-text-primary: #e2e8f0;
  --color-text-secondary: #94a3b8;
  --color-text-muted: #64748b;
  --color-accent: #6366f1;
  --color-accent-hover: #818cf8;
  --color-green: #22c55e;
  --color-green-dim: #166534;
  --color-red: #ef4444;
  --color-red-dim: #991b1b;
  --color-yellow: #eab308;
}

@theme inline {
  --color-bg-primary: var(--color-bg-primary);
  --color-bg-secondary: var(--color-bg-secondary);
  --color-bg-card: var(--color-bg-card);
  --color-bg-hover: var(--color-bg-hover);
  --color-border: var(--color-border);
  --color-text-primary: var(--color-text-primary);
  --color-text-secondary: var(--color-text-secondary);
  --color-text-muted: var(--color-text-muted);
  --color-accent: var(--color-accent);
  --color-accent-hover: var(--color-accent-hover);
  --color-profit: var(--color-green);
  --color-profit-dim: var(--color-green-dim);
  --color-loss: var(--color-red);
  --color-loss-dim: var(--color-red-dim);
  --color-pending: var(--color-yellow);
}

body {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-family:
    "Inter",
    ui-sans-serif,
    system-ui,
    -apple-system,
    sans-serif;
}

/* Monospace for numbers */
.font-mono {
  font-family:
    "JetBrains Mono",
    "Fira Code",
    ui-monospace,
    SFMono-Regular,
    monospace;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: var(--color-bg-primary);
}

::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted);
}
```

### Step 0.6 -- Create directory structure

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/dashboard/src
mkdir -p app/markets/\[id\] app/leaderboard app/agents/\[wallet\] app/competition components lib
```

### Step 0.7 -- Verify the scaffold builds

- [ ] Run:

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/dashboard
npm run build
```

Expected: Build succeeds with no errors.

### Step 0.8 -- Git commit

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier
git add dashboard/
git commit -m "scaffold: Next.js dashboard with Tailwind, wallet adapter, Recharts"
```

---

## Task 1: Root Layout + Navigation Component

**Files:**
- `dashboard/src/app/layout.tsx`
- `dashboard/src/app/page.tsx`
- `dashboard/src/components/Navigation.tsx`
- `dashboard/src/components/WalletButton.tsx`
- `dashboard/src/components/WalletProvider.tsx`

### Step 1.1 -- Create WalletProvider component

- [ ] Create `dashboard/src/components/WalletProvider.tsx`:

```tsx
"use client";

import { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";

import "@solana/wallet-adapter-react-ui/styles.css";

export default function WalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const endpoint =
    process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com";

  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
```

### Step 1.2 -- Create WalletButton component

- [ ] Create `dashboard/src/components/WalletButton.tsx`:

```tsx
"use client";

import dynamic from "next/dynamic";

// Dynamic import prevents SSR hydration mismatch for wallet adapter
const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function WalletButton() {
  return (
    <WalletMultiButtonDynamic
      style={{
        backgroundColor: "#6366f1",
        borderRadius: "8px",
        fontSize: "14px",
        height: "40px",
        padding: "0 16px",
      }}
    />
  );
}
```

### Step 1.3 -- Create Navigation component

- [ ] Create `dashboard/src/components/Navigation.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import WalletButton from "./WalletButton";

const NAV_ITEMS = [
  { href: "/markets", label: "Markets" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/competition", label: "Competition" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-bg-secondary/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/markets" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white font-bold text-sm">
            YF
          </div>
          <span className="text-lg font-bold text-text-primary">
            Yogen<span className="text-accent">Flow</span>
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Wallet */}
        <WalletButton />
      </div>
    </nav>
  );
}
```

### Step 1.4 -- Create root layout

- [ ] Replace the contents of `dashboard/src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import WalletProvider from "@/components/WalletProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "YogenFlow - Proof of Prediction",
  description:
    "Verifiable AI agent performance on Solana. Agents prove forecasting skill through prediction markets with immutable on-chain track records.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
        <WalletProvider>
          <Navigation />
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </WalletProvider>
      </body>
    </html>
  );
}
```

### Step 1.5 -- Create home page (redirect to /markets)

- [ ] Replace the contents of `dashboard/src/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/markets");
}
```

### Step 1.6 -- Verify build

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/dashboard
npm run build
```

### Step 1.7 -- Git commit

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier
git add dashboard/src/app/layout.tsx dashboard/src/app/page.tsx dashboard/src/app/globals.css dashboard/src/components/
git commit -m "feat(dashboard): root layout with dark theme, navigation, wallet adapter"
```

---

## Task 2: API Client + Shared Types

**Files:**
- `dashboard/src/lib/types.ts`
- `dashboard/src/lib/api.ts`

### Step 2.1 -- Create shared types

- [ ] Create `dashboard/src/lib/types.ts`:

```typescript
// === Market Types ===

export type MarketStatus = "Open" | "Resolved" | "Settled";

export interface Market {
  id: string;
  publicKey: string;
  question: string;
  creator: string;
  status: MarketStatus;
  outcome: boolean | null;
  yesPrice: number; // 0-1
  noPrice: number; // 0-1
  liquidity: number; // USDC
  totalVolume: number; // USDC
  feeBps: number;
  createdAt: string; // ISO date
  resolutionDeadline: string; // ISO date
  resolvedAt: string | null;
}

export interface MarketDetail extends Market {
  trades: Trade[];
  poolYes: number;
  poolNo: number;
  oracleFeed: string;
  resolutionSource: string;
  resolutionValue: number | null;
}

// === Agent Types ===

export interface Agent {
  wallet: string;
  name: string;
  accuracyBps: number; // 0-10000 (basis points)
  totalProfit: number; // USDC (can be negative)
  totalVolume: number; // USDC
  totalMarketsTraded: number;
  totalMarketsCreated: number;
  wins: number;
  losses: number;
  registrationStake: number;
  createdAt: string;
  lastActive: string;
}

export interface AgentDetail extends Agent {
  trades: Trade[];
  pnlHistory: PnlPoint[];
}

// === Trade Types ===

export interface Trade {
  id: string;
  marketId: string;
  marketQuestion: string;
  trader: string;
  side: "YES" | "NO";
  amount: number; // USDC
  price: number; // 0-1
  timestamp: string;
  txSignature: string;
}

// === Leaderboard Types ===

export type LeaderboardSort = "profit" | "accuracy" | "volume" | "trades";

export interface LeaderboardEntry {
  rank: number;
  wallet: string;
  name: string;
  accuracyBps: number;
  totalProfit: number;
  totalVolume: number;
  totalMarketsTraded: number;
  wins: number;
  losses: number;
}

// === Chart Types ===

export interface PnlPoint {
  timestamp: string;
  cumulativePnl: number;
}

// === Competition Types ===

export interface CompetitionStats {
  name: string;
  startDate: string;
  endDate: string;
  totalAgents: number;
  totalMarkets: number;
  totalVolume: number;
  status: "upcoming" | "active" | "completed";
}

export interface CompetitionRanking {
  rank: number;
  wallet: string;
  name: string;
  accuracyBps: number;
  totalProfit: number;
  totalVolume: number;
  totalMarketsTraded: number;
}

// === API Response Types ===

export interface HealthResponse {
  status: "ok" | "degraded" | "down";
  version: string;
  uptime: number;
  solanaRpc: string;
  programId: string;
}
```

### Step 2.2 -- Create API client

- [ ] Create `dashboard/src/lib/api.ts`:

```typescript
import type {
  Market,
  MarketDetail,
  Agent,
  AgentDetail,
  LeaderboardEntry,
  LeaderboardSort,
  CompetitionStats,
  CompetitionRanking,
  HealthResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(path: string): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    next: { revalidate: 10 }, // ISR: revalidate every 10 seconds
  });

  if (!res.ok) {
    throw new ApiError(res.status, `API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

// --- Markets ---

export async function getMarkets(): Promise<Market[]> {
  return fetchApi<Market[]>("/api/markets");
}

export async function getMarket(id: string): Promise<MarketDetail> {
  return fetchApi<MarketDetail>(`/api/markets/${id}`);
}

// --- Agents ---

export async function getAgents(): Promise<Agent[]> {
  return fetchApi<Agent[]>("/api/agents");
}

export async function getAgent(wallet: string): Promise<AgentDetail> {
  return fetchApi<AgentDetail>(`/api/agents/${wallet}`);
}

// --- Leaderboard ---

export async function getLeaderboard(
  sort: LeaderboardSort = "profit",
  limit: number = 20
): Promise<LeaderboardEntry[]> {
  return fetchApi<LeaderboardEntry[]>(
    `/api/leaderboard?sort=${sort}&limit=${limit}`
  );
}

// --- Competition ---

export async function getCompetitionStats(): Promise<CompetitionStats> {
  return fetchApi<CompetitionStats>("/api/competition");
}

export async function getCompetitionRankings(): Promise<CompetitionRanking[]> {
  return fetchApi<CompetitionRanking[]>("/api/competition/rankings");
}

// --- Health ---

export async function getHealth(): Promise<HealthResponse> {
  return fetchApi<HealthResponse>("/api/health");
}

// --- Formatting Helpers ---

/** Format basis points (0-10000) to percentage string */
export function formatAccuracy(bps: number): string {
  return `${(bps / 100).toFixed(1)}%`;
}

/** Format USDC amount (lamports to dollars) */
export function formatUSDC(lamports: number): string {
  const dollars = lamports / 1_000_000;
  if (Math.abs(dollars) >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(dollars) >= 1_000) {
    return `$${(dollars / 1_000).toFixed(1)}K`;
  }
  return `$${dollars.toFixed(2)}`;
}

/** Format USDC with sign and color class */
export function formatPnl(lamports: number): { text: string; className: string } {
  const dollars = lamports / 1_000_000;
  const sign = dollars >= 0 ? "+" : "";
  const text = `${sign}${formatUSDC(lamports).replace("$", "$")}`;
  const className = dollars >= 0 ? "text-profit" : "text-loss";
  return {
    text: dollars >= 0 ? `+${formatUSDC(lamports)}` : `-${formatUSDC(Math.abs(lamports))}`,
    className,
  };
}

/** Format price as percentage (0-1 -> 0-100%) */
export function formatPrice(price: number): string {
  return `${(price * 100).toFixed(1)}%`;
}

/** Truncate wallet address: Abc1...xyz9 */
export function truncateWallet(wallet: string): string {
  if (wallet.length <= 11) return wallet;
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

/** Format relative time (e.g., "2h ago", "in 3d") */
export function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const target = new Date(isoDate).getTime();
  const diffMs = target - now;
  const absDiffMs = Math.abs(diffMs);
  const prefix = diffMs < 0 ? "" : "in ";
  const suffix = diffMs < 0 ? " ago" : "";

  if (absDiffMs < 60_000) return "just now";
  if (absDiffMs < 3_600_000) {
    const mins = Math.floor(absDiffMs / 60_000);
    return `${prefix}${mins}m${suffix}`;
  }
  if (absDiffMs < 86_400_000) {
    const hrs = Math.floor(absDiffMs / 3_600_000);
    return `${prefix}${hrs}h${suffix}`;
  }
  const days = Math.floor(absDiffMs / 86_400_000);
  return `${prefix}${days}d${suffix}`;
}
```

### Step 2.3 -- Verify build

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/dashboard
npm run build
```

### Step 2.4 -- Git commit

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier
git add dashboard/src/lib/
git commit -m "feat(dashboard): typed API client and shared types for agent service"
```

---

## Task 3: Markets Page

**Files:**
- `dashboard/src/app/markets/page.tsx`
- `dashboard/src/components/MarketCard.tsx`

### Step 3.1 -- Create MarketCard component

- [ ] Create `dashboard/src/components/MarketCard.tsx`:

```tsx
import Link from "next/link";
import { formatPrice, formatUSDC, formatRelativeTime, truncateWallet } from "@/lib/api";
import type { Market } from "@/lib/types";

function StatusBadge({ status }: { status: Market["status"] }) {
  const styles = {
    Open: "bg-profit/10 text-profit border-profit/20",
    Resolved: "bg-accent/10 text-accent border-accent/20",
    Settled: "bg-text-muted/10 text-text-muted border-text-muted/20",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function OutcomeBadge({ outcome }: { outcome: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold ${
        outcome
          ? "bg-profit/10 text-profit border-profit/20"
          : "bg-loss/10 text-loss border-loss/20"
      }`}
    >
      {outcome ? "YES" : "NO"}
    </span>
  );
}

export default function MarketCard({ market }: { market: Market }) {
  return (
    <Link
      href={`/markets/${market.id}`}
      className="block rounded-xl border border-border bg-bg-card p-5 transition-all hover:border-accent/40 hover:bg-bg-hover"
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold leading-snug text-text-primary">
          {market.question}
        </h3>
        <div className="flex shrink-0 items-center gap-2">
          {market.outcome !== null && <OutcomeBadge outcome={market.outcome} />}
          <StatusBadge status={market.status} />
        </div>
      </div>

      {/* Price Bar */}
      {market.status === "Open" && (
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-profit font-mono font-medium">
              YES {formatPrice(market.yesPrice)}
            </span>
            <span className="text-loss font-mono font-medium">
              NO {formatPrice(market.noPrice)}
            </span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-loss/30">
            <div
              className="rounded-full bg-profit transition-all"
              style={{ width: `${market.yesPrice * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="flex items-center gap-4 text-xs text-text-muted">
        <div>
          <span className="text-text-secondary">Volume</span>{" "}
          <span className="font-mono text-text-primary">
            {formatUSDC(market.totalVolume)}
          </span>
        </div>
        <div>
          <span className="text-text-secondary">Liquidity</span>{" "}
          <span className="font-mono text-text-primary">
            {formatUSDC(market.liquidity)}
          </span>
        </div>
        <div className="ml-auto">
          <span className="text-text-secondary">Creator</span>{" "}
          <span className="font-mono">{truncateWallet(market.creator)}</span>
        </div>
        <div>
          {market.status === "Open" ? (
            <>
              <span className="text-text-secondary">Deadline</span>{" "}
              <span>{formatRelativeTime(market.resolutionDeadline)}</span>
            </>
          ) : (
            <>
              <span className="text-text-secondary">Resolved</span>{" "}
              <span>
                {market.resolvedAt
                  ? formatRelativeTime(market.resolvedAt)
                  : "—"}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
```

### Step 3.2 -- Create Markets page

- [ ] Create `dashboard/src/app/markets/page.tsx`:

```tsx
import { getMarkets } from "@/lib/api";
import MarketCard from "@/components/MarketCard";
import type { Market } from "@/lib/types";

export const metadata = {
  title: "Markets | YogenFlow",
};

export default async function MarketsPage() {
  let markets: Market[] = [];
  let error: string | null = null;

  try {
    markets = await getMarkets();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to fetch markets";
  }

  const activeMarkets = markets.filter((m) => m.status === "Open");
  const resolvedMarkets = markets.filter(
    (m) => m.status === "Resolved" || m.status === "Settled"
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Prediction Markets
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Binary outcome markets created and traded by AI agents on Solana devnet
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-loss/30 bg-loss/5 p-4">
          <p className="text-sm text-loss">
            Failed to load markets: {error}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Make sure the Agent Service is running on{" "}
            {process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}
          </p>
        </div>
      )}

      {/* Active Markets */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">
            Active Markets
            <span className="ml-2 text-sm font-normal text-text-muted">
              ({activeMarkets.length})
            </span>
          </h2>
        </div>

        {activeMarkets.length === 0 && !error ? (
          <div className="rounded-xl border border-border bg-bg-card p-8 text-center">
            <p className="text-text-muted">No active markets</p>
            <p className="mt-1 text-xs text-text-muted">
              Markets will appear here once agents create them
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        )}
      </section>

      {/* Resolved Markets */}
      {resolvedMarkets.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">
              Resolved Markets
              <span className="ml-2 text-sm font-normal text-text-muted">
                ({resolvedMarkets.length})
              </span>
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {resolvedMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

### Step 3.3 -- Verify build

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/dashboard
npm run build
```

### Step 3.4 -- Git commit

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier
git add dashboard/src/app/markets/page.tsx dashboard/src/components/MarketCard.tsx
git commit -m "feat(dashboard): markets page with active/resolved sections and market cards"
```

---

## Task 4: Market Detail Page

**Files:**
- `dashboard/src/app/markets/[id]/page.tsx`
- `dashboard/src/components/TradeHistory.tsx`

### Step 4.1 -- Create TradeHistory component

- [ ] Create `dashboard/src/components/TradeHistory.tsx`:

```tsx
import Link from "next/link";
import { formatUSDC, formatPrice, formatRelativeTime, truncateWallet } from "@/lib/api";
import type { Trade } from "@/lib/types";

interface TradeHistoryProps {
  trades: Trade[];
  showMarket?: boolean; // show market question column (for agent detail)
  showTrader?: boolean; // show trader column (for market detail)
}

export default function TradeHistory({
  trades,
  showMarket = false,
  showTrader = true,
}: TradeHistoryProps) {
  if (trades.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-8 text-center">
        <p className="text-text-muted">No trades yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-text-muted">
            <th className="px-4 py-3 text-left font-medium">Time</th>
            {showTrader && (
              <th className="px-4 py-3 text-left font-medium">Trader</th>
            )}
            {showMarket && (
              <th className="px-4 py-3 text-left font-medium">Market</th>
            )}
            <th className="px-4 py-3 text-left font-medium">Side</th>
            <th className="px-4 py-3 text-right font-medium">Amount</th>
            <th className="px-4 py-3 text-right font-medium">Price</th>
            <th className="px-4 py-3 text-right font-medium">Tx</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {trades.map((trade) => (
            <tr
              key={trade.id}
              className="transition-colors hover:bg-bg-hover"
            >
              <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                {formatRelativeTime(trade.timestamp)}
              </td>
              {showTrader && (
                <td className="px-4 py-3">
                  <Link
                    href={`/agents/${trade.trader}`}
                    className="font-mono text-xs text-accent hover:text-accent-hover"
                  >
                    {truncateWallet(trade.trader)}
                  </Link>
                </td>
              )}
              {showMarket && (
                <td className="max-w-[200px] truncate px-4 py-3">
                  <Link
                    href={`/markets/${trade.marketId}`}
                    className="text-accent hover:text-accent-hover"
                  >
                    {trade.marketQuestion}
                  </Link>
                </td>
              )}
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                    trade.side === "YES"
                      ? "bg-profit/10 text-profit"
                      : "bg-loss/10 text-loss"
                  }`}
                >
                  {trade.side}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-text-primary">
                {formatUSDC(trade.amount)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-text-primary">
                {formatPrice(trade.price)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                <a
                  href={`https://explorer.solana.com/tx/${trade.txSignature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-text-muted hover:text-accent"
                  title={trade.txSignature}
                >
                  {trade.txSignature.slice(0, 8)}...
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Step 4.2 -- Create Market Detail page

- [ ] Create `dashboard/src/app/markets/[id]/page.tsx`:

```tsx
import { getMarket } from "@/lib/api";
import { formatPrice, formatUSDC, formatRelativeTime, truncateWallet } from "@/lib/api";
import TradeHistory from "@/components/TradeHistory";
import type { MarketDetail } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const market = await getMarket(id);
    return { title: `${market.question} | YogenFlow` };
  } catch {
    return { title: "Market | YogenFlow" };
  }
}

function StatBox({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-bg-secondary p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p
        className={`mt-1 text-lg font-semibold text-text-primary ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default async function MarketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let market: MarketDetail | null = null;
  let error: string | null = null;

  try {
    market = await getMarket(id);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to fetch market";
  }

  if (error || !market) {
    return (
      <div className="rounded-xl border border-loss/30 bg-loss/5 p-8 text-center">
        <h2 className="text-lg font-semibold text-loss">Market Not Found</h2>
        <p className="mt-2 text-sm text-text-muted">
          {error || "This market does not exist."}
        </p>
      </div>
    );
  }

  const isOpen = market.status === "Open";

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-text-muted">
        <a href="/markets" className="hover:text-accent">
          Markets
        </a>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">Market #{market.id}</span>
      </nav>

      {/* Question */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-text-primary">
            {market.question}
          </h1>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
              isOpen
                ? "border-profit/20 bg-profit/10 text-profit"
                : "border-accent/20 bg-accent/10 text-accent"
            }`}
          >
            {market.status}
          </span>
          {market.outcome !== null && (
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${
                market.outcome
                  ? "border-profit/20 bg-profit/10 text-profit"
                  : "border-loss/20 bg-loss/10 text-loss"
              }`}
            >
              Outcome: {market.outcome ? "YES" : "NO"}
            </span>
          )}
        </div>
      </div>

      {/* Price Bar (if open) */}
      {isOpen && (
        <div className="rounded-xl border border-border bg-bg-card p-6">
          <div className="mb-2 flex justify-between text-sm font-medium">
            <span className="text-profit font-mono">
              YES {formatPrice(market.yesPrice)}
            </span>
            <span className="text-loss font-mono">
              NO {formatPrice(market.noPrice)}
            </span>
          </div>
          <div className="flex h-4 overflow-hidden rounded-full bg-loss/30">
            <div
              className="rounded-full bg-profit transition-all"
              style={{ width: `${market.yesPrice * 100}%` }}
            />
          </div>

          {/* Trade Placeholder */}
          <div className="mt-4 flex gap-3">
            <button
              disabled
              className="flex-1 rounded-lg bg-profit/20 py-3 text-sm font-semibold text-profit opacity-60 cursor-not-allowed"
            >
              Buy YES (coming soon)
            </button>
            <button
              disabled
              className="flex-1 rounded-lg bg-loss/20 py-3 text-sm font-semibold text-loss opacity-60 cursor-not-allowed"
            >
              Buy NO (coming soon)
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatBox label="Total Volume" value={formatUSDC(market.totalVolume)} mono />
        <StatBox label="Liquidity" value={formatUSDC(market.liquidity)} mono />
        <StatBox
          label="Creator"
          value={truncateWallet(market.creator)}
          mono
        />
        <StatBox
          label={isOpen ? "Deadline" : "Resolved"}
          value={
            isOpen
              ? formatRelativeTime(market.resolutionDeadline)
              : market.resolvedAt
                ? formatRelativeTime(market.resolvedAt)
                : "—"
          }
        />
      </div>

      {/* Market Details */}
      <div className="rounded-xl border border-border bg-bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold text-text-secondary">
          Market Details
        </h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <dt className="text-text-muted">Market ID</dt>
          <dd className="font-mono text-text-primary">{market.id}</dd>
          <dt className="text-text-muted">Resolution Source</dt>
          <dd className="text-text-primary">{market.resolutionSource}</dd>
          <dt className="text-text-muted">Oracle Feed</dt>
          <dd className="font-mono text-xs text-text-primary">
            {truncateWallet(market.oracleFeed)}
          </dd>
          {market.resolutionValue !== null && (
            <>
              <dt className="text-text-muted">Resolution Threshold</dt>
              <dd className="font-mono text-text-primary">
                ${(market.resolutionValue / 1_000_000).toLocaleString()}
              </dd>
            </>
          )}
          <dt className="text-text-muted">Fee</dt>
          <dd className="text-text-primary">{market.feeBps / 100}%</dd>
          <dt className="text-text-muted">Created</dt>
          <dd className="text-text-primary">
            {new Date(market.createdAt).toLocaleDateString()}
          </dd>
          <dt className="text-text-muted">Pool (YES / NO)</dt>
          <dd className="font-mono text-text-primary">
            {formatUSDC(market.poolYes)} / {formatUSDC(market.poolNo)}
          </dd>
        </dl>
      </div>

      {/* Trade History */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Trade History
          <span className="ml-2 text-sm font-normal text-text-muted">
            ({market.trades.length})
          </span>
        </h2>
        <TradeHistory trades={market.trades} showTrader showMarket={false} />
      </div>
    </div>
  );
}
```

### Step 4.3 -- Verify build

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/dashboard
npm run build
```

### Step 4.4 -- Git commit

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier
git add dashboard/src/app/markets/ dashboard/src/components/TradeHistory.tsx
git commit -m "feat(dashboard): market detail page with stats, price bar, trade history"
```

---

## Task 5: Leaderboard Page

**Files:**
- `dashboard/src/app/leaderboard/page.tsx`
- `dashboard/src/components/AgentRow.tsx`

### Step 5.1 -- Create AgentRow component

- [ ] Create `dashboard/src/components/AgentRow.tsx`:

```tsx
import Link from "next/link";
import { formatAccuracy, formatUSDC, truncateWallet } from "@/lib/api";
import type { LeaderboardEntry } from "@/lib/types";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-500/20 text-xs font-bold text-yellow-400">
        1
      </span>
    );
  if (rank === 2)
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-400/20 text-xs font-bold text-gray-300">
        2
      </span>
    );
  if (rank === 3)
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
        3
      </span>
    );
  return (
    <span className="flex h-7 w-7 items-center justify-center text-xs text-text-muted">
      {rank}
    </span>
  );
}

export default function AgentRow({ entry }: { entry: LeaderboardEntry }) {
  const profitDollars = entry.totalProfit / 1_000_000;

  return (
    <tr className="border-b border-border transition-colors hover:bg-bg-hover">
      {/* Rank */}
      <td className="px-4 py-3">
        <RankBadge rank={entry.rank} />
      </td>

      {/* Agent Name + Wallet */}
      <td className="px-4 py-3">
        <Link
          href={`/agents/${entry.wallet}`}
          className="group flex flex-col"
        >
          <span className="font-medium text-text-primary group-hover:text-accent">
            {entry.name}
          </span>
          <span className="font-mono text-xs text-text-muted">
            {truncateWallet(entry.wallet)}
          </span>
        </Link>
      </td>

      {/* Accuracy */}
      <td className="px-4 py-3 text-right font-mono text-sm text-text-primary">
        {formatAccuracy(entry.accuracyBps)}
      </td>

      {/* Profit */}
      <td
        className={`px-4 py-3 text-right font-mono text-sm font-medium ${
          profitDollars >= 0 ? "text-profit" : "text-loss"
        }`}
      >
        {profitDollars >= 0 ? "+" : ""}
        {formatUSDC(entry.totalProfit)}
      </td>

      {/* Volume */}
      <td className="px-4 py-3 text-right font-mono text-sm text-text-primary">
        {formatUSDC(entry.totalVolume)}
      </td>

      {/* Trades (W/L) */}
      <td className="px-4 py-3 text-right text-sm">
        <span className="text-text-primary">
          {entry.totalMarketsTraded}
        </span>
        <span className="ml-1 text-xs text-text-muted">
          (<span className="text-profit">{entry.wins}W</span>/
          <span className="text-loss">{entry.losses}L</span>)
        </span>
      </td>
    </tr>
  );
}
```

### Step 5.2 -- Create Leaderboard page

- [ ] Create `dashboard/src/app/leaderboard/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import AgentRow from "@/components/AgentRow";
import type { LeaderboardEntry, LeaderboardSort } from "@/lib/types";

const SORT_OPTIONS: { value: LeaderboardSort; label: string }[] = [
  { value: "profit", label: "Profit" },
  { value: "accuracy", label: "Accuracy" },
  { value: "volume", label: "Volume" },
  { value: "trades", label: "Trades" },
];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [sort, setSort] = useState<LeaderboardSort>("profit");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const res = await fetch(
          `${apiUrl}/api/leaderboard?sort=${sort}&limit=50`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setEntries(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch");
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [sort]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Agent Leaderboard
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Top AI agents ranked by prediction performance. Minimum 20 resolved
            trades to qualify.
          </p>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-bg-secondary p-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                sort === opt.value
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-loss/30 bg-loss/5 p-4">
          <p className="text-sm text-loss">Failed to load leaderboard: {error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg bg-bg-card"
            />
          ))}
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl border border-border bg-bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-text-muted">
                <th className="w-14 px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">Agent</th>
                <th className="px-4 py-3 text-right font-medium">Accuracy</th>
                <th className="px-4 py-3 text-right font-medium">Profit</th>
                <th className="px-4 py-3 text-right font-medium">Volume</th>
                <th className="px-4 py-3 text-right font-medium">Trades</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-text-muted"
                  >
                    No agents have qualified yet. Agents need 20+ resolved
                    trades to appear here.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <AgentRow key={entry.wallet} entry={entry} />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

### Step 5.3 -- Verify build

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/dashboard
npm run build
```

### Step 5.4 -- Git commit

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier
git add dashboard/src/app/leaderboard/ dashboard/src/components/AgentRow.tsx
git commit -m "feat(dashboard): agent leaderboard with sortable rankings"
```

---

## Task 6: Agent Detail Page

**Files:**
- `dashboard/src/app/agents/[wallet]/page.tsx`
- `dashboard/src/components/PnlChart.tsx`

### Step 6.1 -- Create PnlChart component

- [ ] Create `dashboard/src/components/PnlChart.tsx`:

```tsx
"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
import type { PnlPoint } from "@/lib/types";

interface PnlChartProps {
  data: PnlPoint[];
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatDollar(value: number): string {
  const dollars = value / 1_000_000;
  if (Math.abs(dollars) >= 1_000) {
    return `$${(dollars / 1_000).toFixed(1)}K`;
  }
  return `$${dollars.toFixed(0)}`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const value = payload[0].value;
  const dollars = value / 1_000_000;
  const isPositive = dollars >= 0;

  return (
    <div className="rounded-lg border border-border bg-bg-secondary p-3 shadow-xl">
      <p className="text-xs text-text-muted">
        {label ? new Date(label).toLocaleDateString() : ""}
      </p>
      <p
        className={`mt-1 font-mono text-sm font-semibold ${
          isPositive ? "text-profit" : "text-loss"
        }`}
      >
        {isPositive ? "+" : ""}${dollars.toFixed(2)}
      </p>
    </div>
  );
}

export default function PnlChart({ data }: PnlChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-bg-card">
        <p className="text-text-muted">No P&L data available</p>
      </div>
    );
  }

  const lastValue = data[data.length - 1].cumulativePnl;
  const isPositive = lastValue >= 0;
  const strokeColor = isPositive ? "#22c55e" : "#ef4444";
  const fillColor = isPositive
    ? "rgba(34, 197, 94, 0.08)"
    : "rgba(239, 68, 68, 0.08)";

  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-secondary">
          Cumulative P&L
        </h3>
        <span
          className={`font-mono text-sm font-semibold ${
            isPositive ? "text-profit" : "text-loss"
          }`}
        >
          {isPositive ? "+" : ""}
          {formatDollar(lastValue)}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <defs>
            <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.15} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatDate}
            tick={{ fill: "#64748b", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatDollar}
            tick={{ fill: "#64748b", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#2d3748" strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="cumulativePnl"
            stroke={strokeColor}
            strokeWidth={2}
            fill="url(#pnlGradient)"
            dot={false}
            activeDot={{
              r: 4,
              fill: strokeColor,
              stroke: "#0a0e17",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### Step 6.2 -- Create Agent Detail page

- [ ] Create `dashboard/src/app/agents/[wallet]/page.tsx`:

```tsx
import { getAgent } from "@/lib/api";
import { formatAccuracy, formatUSDC, truncateWallet, formatRelativeTime } from "@/lib/api";
import TradeHistory from "@/components/TradeHistory";
import PnlChart from "@/components/PnlChart";
import type { AgentDetail } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ wallet: string }>;
}) {
  const { wallet } = await params;
  try {
    const agent = await getAgent(wallet);
    return { title: `${agent.name} | YogenFlow` };
  } catch {
    return { title: "Agent | YogenFlow" };
  }
}

function StatCard({
  label,
  value,
  subtext,
  className = "",
}: {
  label: string;
  value: string;
  subtext?: string;
  className?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`mt-1 text-xl font-bold font-mono ${className}`}>{value}</p>
      {subtext && <p className="mt-0.5 text-xs text-text-muted">{subtext}</p>}
    </div>
  );
}

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ wallet: string }>;
}) {
  const { wallet } = await params;
  let agent: AgentDetail | null = null;
  let error: string | null = null;

  try {
    agent = await getAgent(wallet);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to fetch agent";
  }

  if (error || !agent) {
    return (
      <div className="rounded-xl border border-loss/30 bg-loss/5 p-8 text-center">
        <h2 className="text-lg font-semibold text-loss">Agent Not Found</h2>
        <p className="mt-2 text-sm text-text-muted">
          {error || "This agent does not exist."}
        </p>
      </div>
    );
  }

  const profitDollars = agent.totalProfit / 1_000_000;
  const isProfitable = profitDollars >= 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-text-muted">
        <a href="/leaderboard" className="hover:text-accent">
          Leaderboard
        </a>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">{agent.name}</span>
      </nav>

      {/* Agent Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{agent.name}</h1>
          <p className="mt-1 font-mono text-sm text-text-muted">
            {agent.wallet}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Registered {formatRelativeTime(agent.createdAt)} | Last active{" "}
            {formatRelativeTime(agent.lastActive)}
          </p>
        </div>
        <div
          className={`rounded-xl border px-5 py-3 text-center ${
            isProfitable
              ? "border-profit/20 bg-profit/5"
              : "border-loss/20 bg-loss/5"
          }`}
        >
          <p className="text-xs text-text-muted">Total P&L</p>
          <p
            className={`text-2xl font-bold font-mono ${
              isProfitable ? "text-profit" : "text-loss"
            }`}
          >
            {isProfitable ? "+" : ""}
            {formatUSDC(agent.totalProfit)}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard
          label="Accuracy"
          value={formatAccuracy(agent.accuracyBps)}
          subtext={`${agent.wins}W / ${agent.losses}L`}
          className="text-text-primary"
        />
        <StatCard
          label="Total Profit"
          value={`${isProfitable ? "+" : ""}${formatUSDC(agent.totalProfit)}`}
          className={isProfitable ? "text-profit" : "text-loss"}
        />
        <StatCard
          label="Volume"
          value={formatUSDC(agent.totalVolume)}
          className="text-text-primary"
        />
        <StatCard
          label="Markets Traded"
          value={agent.totalMarketsTraded.toString()}
          subtext={`${agent.totalMarketsCreated} created`}
          className="text-text-primary"
        />
        <StatCard
          label="Registration Stake"
          value={formatUSDC(agent.registrationStake)}
          className="text-text-primary"
        />
      </div>

      {/* P&L Chart */}
      <PnlChart data={agent.pnlHistory} />

      {/* Delegation CTA (Coming Soon) */}
      <div className="rounded-xl border border-accent/20 bg-accent/5 p-6 text-center">
        <h3 className="text-lg font-semibold text-accent">
          Delegate Capital to {agent.name}
        </h3>
        <p className="mt-2 text-sm text-text-secondary">
          Let this agent trade on your behalf. Profit sharing, safety
          constraints, and full transparency — all on-chain.
        </p>
        <button
          disabled
          className="mt-4 rounded-lg bg-accent/20 px-6 py-2.5 text-sm font-semibold text-accent opacity-60 cursor-not-allowed"
        >
          Coming Soon — Phase 2
        </button>
      </div>

      {/* Trade History */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Recent Trades
          <span className="ml-2 text-sm font-normal text-text-muted">
            ({agent.trades.length})
          </span>
        </h2>
        <TradeHistory
          trades={agent.trades}
          showTrader={false}
          showMarket
        />
      </div>
    </div>
  );
}
```

### Step 6.3 -- Verify build

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/dashboard
npm run build
```

### Step 6.4 -- Git commit

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier
git add dashboard/src/app/agents/ dashboard/src/components/PnlChart.tsx
git commit -m "feat(dashboard): agent detail page with stats, P&L chart, trade history"
```

---

## Task 7: Competition Results Page

**Files:**
- `dashboard/src/app/competition/page.tsx`

### Step 7.1 -- Create Competition Results page

- [ ] Create `dashboard/src/app/competition/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  formatAccuracy,
  formatUSDC,
  truncateWallet,
} from "@/lib/api";
import type { CompetitionStats, CompetitionRanking } from "@/lib/types";

function CompetitionStatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-5 text-center">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold font-mono text-text-primary">
        {value}
      </p>
    </div>
  );
}

export default function CompetitionPage() {
  const [stats, setStats] = useState<CompetitionStats | null>(null);
  const [rankings, setRankings] = useState<CompetitionRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCompetition() {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const [statsRes, rankingsRes] = await Promise.all([
          fetch(`${apiUrl}/api/competition`),
          fetch(`${apiUrl}/api/competition/rankings`),
        ]);
        if (!statsRes.ok || !rankingsRes.ok)
          throw new Error("Failed to fetch competition data");
        setStats(await statsRes.json());
        setRankings(await rankingsRes.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch");
      } finally {
        setLoading(false);
      }
    }
    fetchCompetition();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-text-primary">
          Agent Competition
        </h1>
        <p className="mt-2 text-text-secondary">
          AI agents compete on prediction markets with real devnet USDC. Results
          are recorded on-chain and fully verifiable.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-loss/30 bg-loss/5 p-4 text-center">
          <p className="text-sm text-loss">
            Failed to load competition data: {error}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Competition data will be available once the agent competition starts.
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl bg-bg-card"
              />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-xl bg-bg-card" />
        </div>
      )}

      {/* Stats */}
      {!loading && stats && (
        <>
          {/* Competition Status Banner */}
          <div
            className={`rounded-xl border p-4 text-center ${
              stats.status === "active"
                ? "border-profit/30 bg-profit/5"
                : stats.status === "completed"
                  ? "border-accent/30 bg-accent/5"
                  : "border-pending/30 bg-pending/5"
            }`}
          >
            <span
              className={`inline-flex items-center gap-2 text-sm font-semibold ${
                stats.status === "active"
                  ? "text-profit"
                  : stats.status === "completed"
                    ? "text-accent"
                    : "text-pending"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  stats.status === "active"
                    ? "bg-profit animate-pulse"
                    : stats.status === "completed"
                      ? "bg-accent"
                      : "bg-pending"
                }`}
              />
              {stats.status === "active"
                ? "Competition In Progress"
                : stats.status === "completed"
                  ? "Competition Completed"
                  : "Competition Upcoming"}
            </span>
            <p className="mt-1 text-xs text-text-muted">
              {stats.name} |{" "}
              {new Date(stats.startDate).toLocaleDateString()} -{" "}
              {new Date(stats.endDate).toLocaleDateString()}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <CompetitionStatCard
              label="Competing Agents"
              value={stats.totalAgents.toString()}
            />
            <CompetitionStatCard
              label="Markets Created"
              value={stats.totalMarkets.toString()}
            />
            <CompetitionStatCard
              label="Total Volume"
              value={formatUSDC(stats.totalVolume)}
            />
            <CompetitionStatCard
              label="Duration"
              value={`${Math.ceil(
                (new Date(stats.endDate).getTime() -
                  new Date(stats.startDate).getTime()) /
                  86_400_000
              )} days`}
            />
          </div>
        </>
      )}

      {/* Rankings Table */}
      {!loading && rankings.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-text-primary">
            Final Rankings
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border bg-bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-text-muted">
                  <th className="w-14 px-4 py-3 text-left font-medium">#</th>
                  <th className="px-4 py-3 text-left font-medium">Agent</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Accuracy
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Profit
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Volume
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Trades
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rankings.map((r) => {
                  const profitDollars = r.totalProfit / 1_000_000;

                  return (
                    <tr
                      key={r.wallet}
                      className={`transition-colors hover:bg-bg-hover ${
                        r.rank <= 3 ? "bg-accent/[0.03]" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        {r.rank === 1 ? (
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-500/20 text-xs font-bold text-yellow-400">
                            1
                          </span>
                        ) : r.rank === 2 ? (
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-400/20 text-xs font-bold text-gray-300">
                            2
                          </span>
                        ) : r.rank === 3 ? (
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
                            3
                          </span>
                        ) : (
                          <span className="flex h-7 w-7 items-center justify-center text-xs text-text-muted">
                            {r.rank}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/agents/${r.wallet}`}
                          className="group flex flex-col"
                        >
                          <span className="font-medium text-text-primary group-hover:text-accent">
                            {r.name}
                          </span>
                          <span className="font-mono text-xs text-text-muted">
                            {truncateWallet(r.wallet)}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text-primary">
                        {formatAccuracy(r.accuracyBps)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono font-medium ${
                          profitDollars >= 0 ? "text-profit" : "text-loss"
                        }`}
                      >
                        {profitDollars >= 0 ? "+" : ""}
                        {formatUSDC(r.totalProfit)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text-primary">
                        {formatUSDC(r.totalVolume)}
                      </td>
                      <td className="px-4 py-3 text-right text-text-primary">
                        {r.totalMarketsTraded}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delegation CTA */}
      <div className="rounded-xl border border-accent/20 bg-gradient-to-r from-accent/5 to-accent/10 p-8 text-center">
        <h3 className="text-xl font-bold text-text-primary">
          Delegate to Top Agents
        </h3>
        <p className="mx-auto mt-3 max-w-lg text-sm text-text-secondary">
          In Phase 2, you will be able to delegate capital to top-performing
          agents. They trade on your behalf with full on-chain transparency,
          safety constraints, and profit sharing.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            disabled
            className="rounded-lg bg-accent/20 px-6 py-2.5 text-sm font-semibold text-accent opacity-60 cursor-not-allowed"
          >
            Coming Soon — Phase 2
          </button>
        </div>
        <p className="mt-4 text-xs text-text-muted">
          Join the waitlist: Follow{" "}
          <a
            href="https://x.com/yogenflow"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent-hover"
          >
            @yogenflow
          </a>{" "}
          on X for updates
        </p>
      </div>
    </div>
  );
}
```

### Step 7.2 -- Verify build

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/dashboard
npm run build
```

### Step 7.3 -- Git commit

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier
git add dashboard/src/app/competition/
git commit -m "feat(dashboard): competition results page with rankings and delegation CTA"
```

---

## Task 8: Polish -- Loading States, Error Boundaries, Responsive Tweaks

**Files:**
- `dashboard/src/components/LoadingSkeleton.tsx`
- `dashboard/src/app/markets/loading.tsx`
- `dashboard/src/app/markets/[id]/loading.tsx`
- `dashboard/src/app/leaderboard/loading.tsx`
- `dashboard/src/app/agents/[wallet]/loading.tsx`
- `dashboard/src/app/competition/loading.tsx`
- `dashboard/src/app/not-found.tsx`
- `dashboard/src/app/error.tsx`

### Step 8.1 -- Create LoadingSkeleton component

- [ ] Create `dashboard/src/components/LoadingSkeleton.tsx`:

```tsx
export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-bg-card p-5">
      <div className="mb-3 h-4 w-3/4 rounded bg-bg-hover" />
      <div className="mb-4 h-2 w-full rounded-full bg-bg-hover" />
      <div className="flex gap-4">
        <div className="h-3 w-16 rounded bg-bg-hover" />
        <div className="h-3 w-16 rounded bg-bg-hover" />
        <div className="ml-auto h-3 w-24 rounded bg-bg-hover" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 w-full animate-pulse rounded bg-bg-hover" />
        </td>
      ))}
    </tr>
  );
}

export function StatSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-bg-card p-4">
      <div className="h-3 w-12 rounded bg-bg-hover" />
      <div className="mt-2 h-6 w-20 rounded bg-bg-hover" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="flex h-64 animate-pulse items-center justify-center rounded-xl border border-border bg-bg-card">
      <div className="h-32 w-3/4 rounded bg-bg-hover" />
    </div>
  );
}
```

### Step 8.2 -- Create loading.tsx files for each route

- [ ] Create `dashboard/src/app/markets/loading.tsx`:

```tsx
import { CardSkeleton } from "@/components/LoadingSkeleton";

export default function MarketsLoading() {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-7 w-48 animate-pulse rounded bg-bg-hover" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-bg-hover" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] Create `dashboard/src/app/markets/[id]/loading.tsx`:

```tsx
import { StatSkeleton, ChartSkeleton } from "@/components/LoadingSkeleton";

export default function MarketDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="h-4 w-32 animate-pulse rounded bg-bg-hover" />
      <div className="h-7 w-96 animate-pulse rounded bg-bg-hover" />
      <div className="h-24 animate-pulse rounded-xl border border-border bg-bg-card" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-xl border border-border bg-bg-card" />
    </div>
  );
}
```

- [ ] Create `dashboard/src/app/leaderboard/loading.tsx`:

```tsx
export default function LeaderboardLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-7 w-48 animate-pulse rounded bg-bg-hover" />
        <div className="mt-2 h-4 w-96 animate-pulse rounded bg-bg-hover" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-lg bg-bg-card"
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] Create `dashboard/src/app/agents/[wallet]/loading.tsx`:

```tsx
import { StatSkeleton, ChartSkeleton } from "@/components/LoadingSkeleton";

export default function AgentDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="h-4 w-32 animate-pulse rounded bg-bg-hover" />
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-48 animate-pulse rounded bg-bg-hover" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-bg-hover" />
        </div>
        <div className="h-20 w-36 animate-pulse rounded-xl bg-bg-card" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
      <ChartSkeleton />
      <div className="h-48 animate-pulse rounded-xl border border-border bg-bg-card" />
    </div>
  );
}
```

- [ ] Create `dashboard/src/app/competition/loading.tsx`:

```tsx
import { StatSkeleton } from "@/components/LoadingSkeleton";

export default function CompetitionLoading() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mx-auto h-8 w-64 animate-pulse rounded bg-bg-hover" />
        <div className="mx-auto mt-3 h-4 w-96 animate-pulse rounded bg-bg-hover" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-border bg-bg-card" />
    </div>
  );
}
```

### Step 8.3 -- Create global not-found page

- [ ] Create `dashboard/src/app/not-found.tsx`:

```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="text-6xl font-bold text-text-muted">404</div>
      <h1 className="mt-4 text-xl font-semibold text-text-primary">
        Page Not Found
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/markets"
        className="mt-6 rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
      >
        Go to Markets
      </Link>
    </div>
  );
}
```

### Step 8.4 -- Create global error boundary

- [ ] Create `dashboard/src/app/error.tsx`:

```tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-loss/30 bg-loss/10">
        <span className="text-2xl text-loss">!</span>
      </div>
      <h1 className="mt-4 text-xl font-semibold text-text-primary">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-sm text-text-secondary">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
      >
        Try Again
      </button>
    </div>
  );
}
```

### Step 8.5 -- Verify full build

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier/dashboard
npm run build
```

Expected: Build succeeds with no errors across all routes.

### Step 8.6 -- Git commit

```bash
cd D:/work/bonchain/solana/hackathon/2026_frontier
git add dashboard/src/
git commit -m "feat(dashboard): loading skeletons, error boundary, 404 page"
```

---

## Summary: File Checklist

| File | Task | Purpose |
|------|------|---------|
| `dashboard/` (scaffold) | 0 | Next.js project with Tailwind, wallet adapter, Recharts |
| `dashboard/.env.local` | 0 | API URL and Solana config |
| `dashboard/next.config.ts` | 0 | API proxy rewrite rules |
| `dashboard/src/app/globals.css` | 0 | Dark theme CSS variables and base styles |
| `dashboard/src/components/WalletProvider.tsx` | 1 | Solana wallet context provider |
| `dashboard/src/components/WalletButton.tsx` | 1 | Wallet connect button (dynamic import, no SSR) |
| `dashboard/src/components/Navigation.tsx` | 1 | Top nav bar with 4 links + wallet button |
| `dashboard/src/app/layout.tsx` | 1 | Root layout wrapping wallet provider + nav |
| `dashboard/src/app/page.tsx` | 1 | Home redirect to /markets |
| `dashboard/src/lib/types.ts` | 2 | Shared TypeScript types for all API responses |
| `dashboard/src/lib/api.ts` | 2 | Typed fetch functions + formatting helpers |
| `dashboard/src/components/MarketCard.tsx` | 3 | Market card with price bar, status badge, stats |
| `dashboard/src/app/markets/page.tsx` | 3 | Markets list (active + resolved sections) |
| `dashboard/src/components/TradeHistory.tsx` | 4 | Reusable trade history table |
| `dashboard/src/app/markets/[id]/page.tsx` | 4 | Market detail with stats, price bar, trades |
| `dashboard/src/components/AgentRow.tsx` | 5 | Leaderboard table row with rank badges |
| `dashboard/src/app/leaderboard/page.tsx` | 5 | Sortable agent leaderboard |
| `dashboard/src/components/PnlChart.tsx` | 6 | Recharts area chart for cumulative P&L |
| `dashboard/src/app/agents/[wallet]/page.tsx` | 6 | Agent detail with stats, chart, trades, delegation CTA |
| `dashboard/src/app/competition/page.tsx` | 7 | Competition stats, rankings, delegation waitlist |
| `dashboard/src/components/LoadingSkeleton.tsx` | 8 | Reusable skeleton components |
| `dashboard/src/app/markets/loading.tsx` | 8 | Markets page loading state |
| `dashboard/src/app/markets/[id]/loading.tsx` | 8 | Market detail loading state |
| `dashboard/src/app/leaderboard/loading.tsx` | 8 | Leaderboard loading state |
| `dashboard/src/app/agents/[wallet]/loading.tsx` | 8 | Agent detail loading state |
| `dashboard/src/app/competition/loading.tsx` | 8 | Competition loading state |
| `dashboard/src/app/not-found.tsx` | 8 | 404 page |
| `dashboard/src/app/error.tsx` | 8 | Global error boundary |

## Time Estimates

| Task | Description | Estimate |
|------|-------------|----------|
| 0 | Project scaffold | 30 min |
| 1 | Root layout + navigation | 1 hr |
| 2 | API client + types | 45 min |
| 3 | Markets page | 1.5 hr |
| 4 | Market detail page | 1.5 hr |
| 5 | Leaderboard page | 1.5 hr |
| 6 | Agent detail page | 2 hr |
| 7 | Competition results page | 1.5 hr |
| 8 | Polish (loading, errors, responsive) | 1.5 hr |
| **Total** | | **~12 hrs (2-3 days)** |

Buffer for debugging wallet adapter, Recharts integration, and API connection issues: +1 day. Total: **3-4 working days** within the Week 4 window.
