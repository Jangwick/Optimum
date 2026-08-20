# ---- Build stage ----
FROM node:22-slim AS builder

WORKDIR /app

# Install dependencies for both client and server
COPY package.json package-lock.json* ./
COPY server/package.json server/package-lock.json* ./server/
COPY client/package.json client/package-lock.json* ./client/

# Remove lockfiles to avoid npm edgesOut compatibility issues
RUN rm -f package-lock.json server/package-lock.json client/package-lock.json

# Skip Puppeteer browser download (Chromium installed in production stage)
ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN npm install
RUN cd server && npm install
RUN cd client && npm install

# Copy source and build
COPY . .

# Generate Prisma client
RUN cd server && npx prisma generate

# Build the client
RUN cd client && npm run build

# ---- Production stage ----
FROM node:22-slim AS production

# Install Chromium for Puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
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

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy server package files and install production deps
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && rm -f package-lock.json && npm install --omit=dev

# Copy server source
COPY server/src ./server/src
COPY server/prisma ./server/prisma

# Copy generated Prisma client
COPY --from=builder /app/server/generated ./server/generated

# Copy built client
COPY --from=builder /app/client/dist ./client/dist

# Copy logo to public (already in client/dist via build)
COPY --from=builder /app/client/public/logo.png ./client/dist/logo.png

# Create directories for uploads and reports
RUN mkdir -p /app/server/uploads /app/server/reports /app/server/logs /app/server/templates

EXPOSE ${PORT:-3001}

# Run migrations, seed, then start
WORKDIR /app/server
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node src/server.js"]
