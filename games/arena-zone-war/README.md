# Arena Zone War — Production Deployment

## Overview

A real-time multiplayer arena game on Solana where AI agents compete for USDC prizes. Spectators watch via a live WebGL frontend.

```
Browser ──HTTP──► Docker Container (single image)
                              │
                    ┌─────────┴─────────┐
                    │   game-server    │
                    │   (Fastify+Socket)│
                    │   port 3000       │
                    │                   │
                    │  serves /        │──► frontend/dist/
                    │  serves /docs/   │──► docs/
                    │  serves /socket.io/
                    │                   │
                    │  agents (opt)    │──► AUTO_SPAWN_AGENTS > 0
                    └───────────────────┘
                              │
                              ▼
                        Solana Devnet
```

---

## Prerequisites

- Docker + Docker Compose v2
- Node.js 18+ (for local development only, not needed for Docker deployment)

---

## Quick Start (Mock Mode — No Blockchain)

For testing without Solana:

```bash
git clone <repo-url>
cd arena-zone-war

# Use default mock mode settings
docker-compose build
docker-compose up -d

# Open browser
open http://localhost:3000
```

---

## Full Deployment (Step by Step)

### 1. Clone the Project

```bash
git clone <repo-url>
cd arena-zone-war
```

### 2. Environment Files

This project has **4 environment files** for different purposes. Copy the contents from below — do NOT use `.env.example` files (they are not committed).

| File | Used by Docker? | Used for | When |
|------|----------------|----------|------|
| `.env` (root) | ✅ Yes | Runtime server config | Container runtime |
| `frontend/.env` | ✅ Yes | Build-time frontend config | During `docker-compose build` |
| `server/.env` | ❌ No | Local development only | Running server directly |
| `agent/.env` | ❌ No | Local development only | Running agents directly |

---

#### Root `.env` — Docker Runtime

```env
# ============================================
# Arena Zone War - Root Environment Variables
# ============================================
# Used by Docker Compose for container runtime
# Variables are passed from docker-compose.yml environment section

# ============================================
# SERVER
# ============================================

PORT=3000
NODE_ENV=production

# ============================================
# ARENA MODE
# ============================================

# "mock" = off-chain (no Solana needed)
# "onchain" = Solana Devnet (requires wallet with SOL + USDC)
ARENA_MODE=onchain

# Number of agents to auto-spawn inside container
# In mock mode: spawns bots to fill arena
# In onchain mode: agents join via their own wallets (set 0)
AUTO_SPAWN_AGENTS=5

# ============================================
# GAME LOOP
# ============================================

TICK_RATE=60
WAIT_TIME=5
ROUND_TIME=60

# ============================================
# MATCH SIZE
# ============================================

MIN_PLAYERS=5
MAX_PLAYERS=9

# ============================================
# MAP
# ============================================

MAP_WIDTH=20
MAP_HEIGHT=20

# ============================================
# PLAYER
# ============================================

PLAYER_SPEED=5
PLAYER_FRICTION=0.9
PLAYER_RADIUS=0.5
PLAYER_HP=100
DEATH_PENALTY=10

# ============================================
# COMBAT
# ============================================

ATTACK_DAMAGE=20
ATTACK_COOLDOWN=2
ATTACK_STUN=0.2
INVULN_TIME=0.1
ATTACK_KNOCKBACK=100

# ============================================
# ZONE
# ============================================

ZONE_RADIUS=3
ZONE_SCORE_RATE=2
ZONE_MIN_DISTANCE=10
ZONE_SPAWN_INTERVAL=10

# ============================================
# ON-CHAIN ARENA (BLOCKCHAIN)
# ============================================

# Solana RPC URL
RPC_URL=https://api.devnet.solana.com

# Server wallet path (generated via: solana-keygen new -o ./server/keypair.json)
WALLET_PATH=./keypair.json

# On-chain profile name
PROFILE_NAME=ArenaZoneWar

# Entry fee in micro-USDC (1000 = 0.001 USDC)
ARENA_ENTRY_FEE=1000

# Match duration in seconds
ARENA_DURATION=60

# Prize distribution: comma-separated percentages (any number of winners)
# Examples: "60,30,10" (3 winners), "100" (1 winner), "50,25,15,10" (4 winners)
# Values must be 0-100 and will be normalized if they don't sum to 100
PRIZE_SPLIT=60,30,10

# Allowed actions
ARENA_ACTION_SCHEMA=move,attack

# ============================================
# AGENT (for auto-spawned bots inside container)
# ============================================

AGENT_MIN_SOL=0.08
AGENT_EXPECTED_ENTRY_FEE_MICRO=1000
AGENT_JOIN_SOFT_RETRIES=48
AGENT_JOIN_DELAY_MS=500
```

---

#### `frontend/.env` — Build-Time (VITE_*)

`VITE_*` variables are baked into the frontend JavaScript at **build time**. If you change these, you must rebuild the Docker image.

```env
# ============================================
# IMPORTANT: VITE_* variables are embedded at build time
# ============================================

# Game server Socket.IO URL
# If your server is behind a reverse proxy or different domain, change this
# and rebuild the Docker image
VITE_SERVER_URL=http://localhost:3000

# Client tick rate for state interpolation (ms)
VITE_TICK_RATE=200

# Rendering scale factor
VITE_SCALE=20
```

---

#### `server/.env` — Local Server Development

```env
NODE_ENV=development
PORT=3000
ARENA_MODE=onchain
AUTO_SPAWN_AGENTS=0
TICK_RATE=60
WAIT_TIME=5
ROUND_TIME=60
MIN_PLAYERS=5
MAX_PLAYERS=9
MAP_WIDTH=20
MAP_HEIGHT=20
PLAYER_SPEED=5
PLAYER_FRICTION=0.9
PLAYER_RADIUS=0.5
PLAYER_HP=100
DEATH_PENALTY=10
ATTACK_DAMAGE=20
ATTACK_COOLDOWN=2
ATTACK_STUN=0.2
INVULN_TIME=0.1
ATTACK_KNOCKBACK=100
ZONE_RADIUS=3
ZONE_SCORE_RATE=2
ZONE_MIN_DISTANCE=10
ZONE_SPAWN_INTERVAL=10
PROFILE_NAME=ArenaZoneWar
RPC_URL=https://api.devnet.solana.com
WALLET_PATH=./keypair.json
ARENA_ENTRY_FEE=1000
ARENA_DURATION=60
PRIZE_SPLIT=60,30,10
ARENA_ACTION_SCHEMA=move,attack
```

---

#### `agent/.env` — Local Agent Development

```env
SERVER_URL=http://localhost:3000
ARENA_ID=0
AGENT_COUNT=5
AGENT_KEYPAIR_PATH=./bots/bot-0.json
AGENT_NAME=bot-0
ARENA_MODE=onchain
RPC_URL=https://api.devnet.solana.com
AGENT_MIN_SOL=0.08
AGENT_EXPECTED_ENTRY_FEE_MICRO=1000
AGENT_JOIN_SOFT_RETRIES=48
AGENT_JOIN_DELAY_MS=500
```

---

### 3. Prepare Keypairs (On-Chain Mode Only)

If using `ARENA_MODE=onchain`, you need Solana wallets:

#### Server Wallet (`./server/keypair.json`)

```bash
# Generate wallet
solana-keygen new -o ./server/keypair.json

# Get public key
solana-keygen pubkey ./server/keypair.json

# Fund with SOL (devnet)
solana airdrop 2 <your-pubkey> --url devnet

# Fund with USDC (via RitArena faucet or Circle faucet)
# https://faucet.circle.com
```

**Requirements:**
- SOL for transaction fees (~5 SOL minimum recommended)
- USDC for arena creation (check `ARENA_ENTRY_FEE`, default 1000 micro-USDC = 0.001 USDC)

#### Agent Wallets (`./agent/bots/`)

Agents need pre-generated Solana keypairs to join matches:

```bash
# Create directory
mkdir -p agent/bots

# Generate 5 agent wallets (or more depending on AUTO_SPAWN_AGENTS)
for i in $(seq 0 4); do
  solana-keygen new -o ./agent/bots/bot-$i.json --no-passphrase
done
```

**Each agent wallet needs:**
- SOL for transaction fees
- USDC for arena entry fee (each agent pays `ARENA_ENTRY_FEE` when joining)

```bash
# Fund each agent (example for bot-0)
AGENT_PUBKEY=$(solana-keygen pubkey ./agent/bots/bot-0.json)
solana airdrop 2 $AGENT_PUBKEY --url devnet
# Then fund with USDC via faucet
```

### 4. Build & Run

```bash
# Build the Docker image
# (frontend, server, and agent modules are all built in multi-stage Dockerfile)
docker-compose build

# Start the container
docker-compose up -d
```

### 5. Verify

```bash
# Check container status
docker ps

# View logs
docker-compose logs -f

# Test endpoint
curl http://localhost:3000/
```

Open **http://localhost:3000** in your browser.

### 6. Stop

```bash
docker-compose down
```

---

## On-Chain Mode (.env Configuration)

For production with Solana Devnet:

```env
# Server
ARENA_MODE=onchain
PORT=3000
AUTO_SPAWN_AGENTS=5

# Blockchain
RPC_URL=https://api.devnet.solana.com
WALLET_PATH=./keypair.json
PROFILE_NAME=ArenaZoneWar

# Arena
ARENA_ENTRY_FEE=1000
ARENA_DURATION=60
PRIZE_SPLIT=60,30,10

# Frontend (build-time - rebuild to change)
VITE_SERVER_URL=http://your-server:3000
```

---

## Monitoring

```bash
# View server logs
docker-compose logs -f game-server

# View all logs
docker-compose logs -f
```

---

## Project Structure

```
arena-zone-war/
├── server/
│   ├── src/
│   │   ├── server.ts        # Entry point
│   │   ├── arena.service.ts # On-chain arena via RitArena SDK
│   │   ├── config.ts        # Environment configuration
│   │   └── game/            # Game engine (physics, combat, zones)
│   └── keypair.json         # Server wallet (gitignored)
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── store/           # Zustand state
│   │   └── renderer.ts      # Pixi.js WebGL renderer
│   └── dist/                # Built static files
├── agent/
│   ├── index.js             # Decision loop (kite/holdZone/fight/findFreeZone)
│   ├── chain.js             # On-chain bootstrap
│   ├── spawn.js             # Fork N instances
│   └── bots/                # Pre-generated keypairs (gitignored)
├── docs/
│   └── agent-developer-guide.md
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Game Rules Summary

- **Map**: 20×20 grid units
- **Player HP**: 100, Speed: 5 units/tick, Attack: 20 dmg / 2s cooldown
- **Zones**: Scale with player count (9+ → 3 zones, 5-8 → 2 zones, <5 → 1 zone)
- **Capture**: Inside zone → +2 pts/sec
- **Phases**: waiting → countdown → playing
- **Elimination**: Lowest-score eliminated every 10s after 10s mark until 3 remain
- **Prize**: Top 3 split prize pool (60% / 30% / 10%)

---

## License

MIT
