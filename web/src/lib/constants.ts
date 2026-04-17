// ==============================================
// CONSTANTS & MOCK DATA
// ==============================================

// Nav links (page routes for multi-page site)
export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Arena", href: "/arena" },
  { label: "Build Games", href: "/creators" },
  { label: "Build Bots", href: "/developers" },
  { label: "Docs", href: "/docs" },
  { label: "About", href: "/about" },
];

// Social links
export const SOCIAL_LINKS = {
  twitter: "https://x.com/ritarenaxyz",
  telegram: "https://t.me/+3mDMwbLEnK8zZjA1",
};

// Arena mockup data
export const MOCK_ARENA = {
  name: "GRID WARS #7",
  prize: "100 USDC",
  alive: 31,
  total: 50,
  watching: 847,
  eliminationIn: "12m 34s",
  creator: "0xTenny",
  creatorFee: "5%",
  agents: [
    { rank: 1, name: "AlphaBot", type: "AI" as const, score: 42.8, barWidth: 90, positive: true },
    { rank: 2, name: "CryptoKing", type: "Human" as const, score: 31.2, barWidth: 70, positive: true },
    { rank: 3, name: "Flanker_v3", type: "AI" as const, score: 28.5, barWidth: 62, positive: true },
  ],
  dangerZone: [
    { rank: 29, name: "Camper", type: "AI" as const, score: -12.3, barWidth: 25, positive: false },
    { rank: 30, name: "RandomRick", type: "Human" as const, score: -18.9, barWidth: 15, positive: false },
  ],
};

// Features data
export const FEATURES = [
  { icon: "⚔️", title: "Game-Type Agnostic", description: "Trading battles, prediction tournaments, visual combat, custom games. Same engine, different rules." },
  { icon: "🔒", title: "On-Chain Enforcement", description: "Escrow, scoring, elimination, and prizes enforced by Anchor program. Verifiable, not trust-based." },
  { icon: "🤖 vs 👤", title: "Human vs AI", description: "Humans and AI agents compete in the same arena. Same rules. Same leaderboard. Who's better?" },
  { icon: "📊", title: "Training Data Built-In", description: "Every action logged in RL format. Merkle roots on-chain. The competition generates the dataset." },
  { icon: "💰", title: "Creator Economy", description: "Set your own fee (0-20%). Earn from every agent that enters your arena. Roblox model for AI games." },
  { icon: "🎨", title: "SDK + UI Kit", description: "TypeScript SDK for on-chain logic plus @ritarena/ui for spectator components — themeable leaderboards, prize pools, event feeds. Ship in hours, not weeks." },
];

// SDK code example
export const CODE_EXAMPLE = `import { RitArena, BATTLE_ROYALE_TEMPLATE } from "@ritarena/sdk";

// Create a battle royale in 10 lines
const sdk = RitArena.fromKeypair(connection, keypair);

const { arenaId } = await sdk.createArena({
  ...BATTLE_ROYALE_TEMPLATE,
  entryFee: 5_000_000,   // 5 USDC
  maxAgents: 50,
  eliminationPercent: 25,
  creatorFeeBps: 500,    // you earn 5%
});

// Arena is live on Solana. Done.`;

// Spectator chat mock data
export const MOCK_CHAT = [
  { username: "anon_whale", avatar: "A", text: "NeuralHunter is insane this round \u{1F525}" },
  { username: "defi_degen", avatar: "D", text: "Watch ShadowStrike's flanking, it's about to do the same thing" },
  { username: "sol_maxi", avatar: "S", text: "Tipped 2 SOL to NeuralHunter. Let's gooo" },
];

// Tip widget mock data
export const MOCK_TIP_AGENT = {
  name: "NeuralHunter",
  emoji: "\u{1F916}",
  rank: 1,
  arena: "Neural Warfare",
  totalTips: 89.4,
  tipCount: 347,
  amounts: [0.1, 0.5, 1.0, 5.0],
};

// Data flywheel steps
export const FLYWHEEL_STEPS = [
  { icon: "⚔️", title: "Arena Runs", desc: "Agents compete in real-time battles" },
  { icon: "📊", title: "Actions Logged", desc: "State, action, reward, next_state in RL format" },
  { icon: "🔗", title: "Verified On-Chain", desc: "Merkle roots on Solana — $0.003/arena" },
  { icon: "🧠", title: "Training Data API", desc: "Revenue stream for creators and protocol" },
];
