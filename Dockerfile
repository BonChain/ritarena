FROM node:20-alpine AS base

# ── Install dependencies ──
FROM base AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++ linux-headers eudev-dev
COPY web/package.json web/package-lock.json ./
RUN npm install --no-audit --no-fund

# ── Build ──
FROM base AS builder
WORKDIR /app
ARG NEXT_PUBLIC_RPS_HTTP
ARG NEXT_PUBLIC_RPS_WS
ARG NEXT_PUBLIC_SOLANA_RPC_URL
ENV NEXT_PUBLIC_RPS_HTTP=$NEXT_PUBLIC_RPS_HTTP
ENV NEXT_PUBLIC_RPS_WS=$NEXT_PUBLIC_RPS_WS
ENV NEXT_PUBLIC_SOLANA_RPC_URL=$NEXT_PUBLIC_SOLANA_RPC_URL
COPY --from=deps /app/node_modules ./node_modules
COPY web/ .
RUN npm run build

# ── Production ──
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder /app/public ./app/public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./app/.next/static

# Create data directory for Railway volume mount (waitlist, etc.)
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs
WORKDIR /app/app
EXPOSE 3000

CMD ["node", "server.js"]
