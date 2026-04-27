FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package.json server/pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY server/src ./src
COPY server/tsconfig.json ./
COPY docs/ ./docs/
RUN pnpm exec tsc -p /app/server/tsconfig.json

FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY frontend/src ./src
COPY frontend/index.html ./
COPY frontend/public ./public
COPY frontend/vite.config.ts ./
COPY frontend/tsconfig.json ./
ARG VITE_SERVER_URL=http://localhost:3000
ENV VITE_SERVER_URL=$VITE_SERVER_URL
RUN pnpm run build

FROM node:20-alpine AS agent-build
WORKDIR /app/agent
COPY agent/package.json agent/pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY agent/ ./

FROM node:20-alpine AS production
WORKDIR /app

COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/src ./server/src
COPY --from=server-build /app/server/docs ./docs

COPY --from=frontend-build /app/frontend/dist ./frontend/dist

COPY --from=agent-build /app/agent ./agent

COPY server/package.json server/pnpm-lock.yaml ./server/
RUN corepack enable && pnpm install --frozen-lockfile --prod -C server

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["sh", "-c", "node agent/preRegister.js && node server/dist/server.js"]
