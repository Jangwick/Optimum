# syntax=docker/dockerfile:1

# ---- Dependencies: install all workspace dependencies (dev + prod) ----
FROM node:22-slim AS deps

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

COPY package*.json ./
COPY client/package.json client/
COPY server/package.json server/
COPY packages/shared-types/package.json packages/shared-types/

RUN npm ci --include-workspace-root --legacy-peer-deps

# ---- Build: shared types, client, Prisma client, and server ----
FROM node:22-slim AS build

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NODE_ENV=production
ENV VITE_API_BASE_URL=/api
ENV DATABASE_URL="mysql://dummy:dummy@localhost:3306/dummy"

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY client/package.json client/
COPY server/package.json server/
COPY packages/shared-types/package.json packages/shared-types/

COPY client/ ./client/
COPY server/ ./server/
COPY packages/shared-types/ ./packages/shared-types/

# Build shared types first, then client, then compile server TypeScript.
# The generated Prisma client is copied into dist so relative imports resolve.
RUN if [ -f packages/shared-types/src/index.ts ]; then \
      npm run build -w @optimum/shared-types; \
    fi && \
    npm run build -w client && \
    cd server && \
    npx prisma generate && \
    npx tsc && \
    node -e "require('fs').cpSync('generated/prisma', 'dist/generated/prisma', { recursive: true, force: true })"

# ---- Production: minimal runtime image with Chromium ----
FROM node:22-slim AS production

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Install Chromium and runtime deps required by Puppeteer
RUN apt-get update && apt-get install -y --no-install-suggests --no-install-recommends \
    chromium \
    libglib2.0-0 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY client/package.json client/
COPY server/package.json server/
COPY packages/shared-types/package.json packages/shared-types/

RUN npm ci --workspace=server --include-workspace-root --legacy-peer-deps --omit=dev

# Copy runtime artifacts
COPY server/prisma ./server/prisma
COPY server/prisma.config.js ./server/prisma.config.js
COPY server/entrypoint.sh ./server/entrypoint.sh
COPY --from=build /app/server/dist ./server/dist

# Copy built client so the Express server can serve the SPA
COPY --from=build /app/client/dist ./client/dist

# Create runtime directories and switch to non-root user
RUN mkdir -p /app/server/uploads /app/server/reports /app/server/logs /app/server/templates && \
    chown -R node:node /app/server

USER node

WORKDIR /app/server
RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

CMD ["sh", "entrypoint.sh"]
