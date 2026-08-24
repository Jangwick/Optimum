# syntax=docker/dockerfile:1
FROM node:22-slim AS builder

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL:-/api}
ENV NODE_ENV=development

WORKDIR /app

# Copy root lockfile and all workspace package manifests
COPY package*.json ./
COPY client/package.json client/
COPY server/package.json server/
COPY packages/shared-types/package.json packages/shared-types/

# Install client workspace and root dependencies
RUN npm ci --workspace=client --include-workspace-root --legacy-peer-deps

# Copy client and shared source, then build the client
COPY client/ ./client/
COPY packages/shared-types/ ./packages/shared-types/

# Build shared types if it has code, then the client
RUN if [ -f packages/shared-types/src/index.ts ]; then \
      npm run build -w @optimum/shared-types; \
    fi && \
    npm run build -w client

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

WORKDIR /usr/share/nginx/html

COPY --from=builder /app/client/dist .
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
