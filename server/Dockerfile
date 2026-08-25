# syntax=docker/dockerfile:1

# ---- Dependencies stage: install all server deps (dev + prod) ----
FROM node:22-slim AS deps

# Skip any Chromium downloads during dependency installation
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

COPY package*.json ./
COPY client/package.json client/
COPY server/package.json server/
COPY packages/shared-types/package.json packages/shared-types/

RUN npm ci --workspace=server --include-workspace-root --legacy-peer-deps

# ---- Build stage: compile TypeScript and generate Prisma client ----
FROM node:22-slim AS build

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY client/package.json client/
COPY server/package.json server/
COPY packages/shared-types/package.json packages/shared-types/

# Copy the server and shared source
COPY server/ ./server/
COPY packages/shared-types/ ./packages/shared-types/

WORKDIR /app/server
RUN npx prisma generate && npx tsc && node -e "require('fs').cpSync('generated/prisma', 'dist/generated/prisma', { recursive: true, force: true })"

# ---- Runtime stage: minimal production image with Chromium ----
FROM node:22-slim AS runtime

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
COPY server/prisma.config.ts ./server/prisma.config.ts
COPY --from=build /app/server/dist ./server/dist

# Create runtime directories and switch to non-root user
RUN mkdir -p /app/server/uploads /app/server/reports /app/server/logs /app/server/templates && \
    chown -R node:node /app/server

USER node

WORKDIR /app/server

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

CMD ["npm", "run", "start:prod"]
