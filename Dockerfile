# ---- Builder: client only ----
FROM node:22-slim AS client-builder

WORKDIR /app/client

COPY client/package.json client/package-lock.json* ./
RUN rm -f package-lock.json && npm install --legacy-peer-deps

COPY client/ .
RUN npm run build

# ---- Builder: prisma generate only ----
FROM node:22-slim AS prisma-builder

WORKDIR /app/server

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV DATABASE_URL="mysql://dummy:dummy@localhost:3306/dummy"

# Only install what prisma generate needs (not puppeteer, bcrypt, express, etc.)
COPY server/package.json server/package-lock.json* ./
RUN rm -f package-lock.json && npm install --legacy-peer-deps --omit=optional \
    prisma@7.9.1 @prisma/client@7.9.1 @prisma/adapter-mariadb@^7.9.1 dotenv

COPY server/prisma ./prisma
COPY server/prisma.config.js .
RUN npx prisma generate

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

# Copy server package files and install production deps (prisma now a regular dep)
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && rm -f package-lock.json && npm install --omit=dev --legacy-peer-deps --omit=optional

# Copy server source
COPY server/src ./server/src
COPY server/prisma ./server/prisma
COPY server/prisma.config.js ./server/
COPY server/entrypoint.sh ./server/

# Copy generated Prisma client from builder
COPY --from=prisma-builder /app/server/generated ./server/generated

# Copy built client from builder
COPY --from=client-builder /app/client/dist ./client/dist

# Create directories
RUN mkdir -p /app/server/uploads /app/server/reports /app/server/logs /app/server/templates

EXPOSE ${PORT:-3001}

# Run migrations, seed, then start via entrypoint script
WORKDIR /app/server
RUN chmod +x entrypoint.sh
CMD ["sh", "entrypoint.sh"]
