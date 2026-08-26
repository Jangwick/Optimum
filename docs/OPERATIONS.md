# Operations Runbook

## Environment setup

1. Install Node.js >= 22.
2. Install MySQL 8 or MariaDB and create a database.
3. Copy `server/.env.example` to `server/.env` and fill in:
   - `NODE_ENV` (`development` or `production`)
   - `PORT` (default `3001`)
   - `CLIENT_URL` (e.g. `http://localhost:5173`)
   - `DATABASE_URL` (e.g. `mysql://user:pass@localhost:3306/optimum?queryTimeout=60000&connectTimeout=30000`)
   - `JWT_SECRET` (strong random string)
   - `JWT_EXPIRES_IN` (default `24h`)
   - `BCRYPT_ROUNDS` (default `12`)
   - `UPLOAD_DIR` (default `./uploads`)
   - `REPORT_DIR` (default `./reports`)
   - `MAX_FILE_SIZE` (default 20 MB, capped at 100 MB)
4. Optional client env: `VITE_API_BASE_URL` (default `/api`).
5. Run `npm install` at the root, then `cd server && npx prisma generate`.
6. In development the server auto-runs `prisma db push` and `prisma/seed.ts` on startup. In production run migrations and seeding before or during startup.

## Start / stop

Development:

```bash
npm run dev          # server + client concurrently
cd server && npm run dev   # tsx watch src/server.ts
cd client && npm run dev   # Vite on port 5173
```

Production:

```bash
cd server && npm run build   # prisma generate + tsc + copy generated client
cd server && npm run start:prod   # prisma migrate deploy + seed + node dist/src/server.js
```

Or use Docker Compose with `docker-compose up --build`.

Stop:

- Send `SIGTERM` or `SIGINT` to the Node process.
- The server stops accepting new connections, waits up to 30 s for in-flight requests, then closes Prisma and exits.
- Use `docker compose down` if running containers.

## Health check

```bash
curl http://localhost:3001/api/health
```

Expected response:

```json
{
  "status": "ok",
  "version": "0.1.0",
  "env": "production",
  "database": "connected",
  "seeded": { ... }
}
```

A 503 response means the database is unreachable or the health query failed.

## Logs

Server logs are emitted as pino JSON. In development `pino-pretty` is used if available.

```bash
# tail logs (PowerShell)
cd server && npm run dev 2>&1 | ForEach-Object { $_ }

# or with pino-pretty
cd server && npm run dev | npx pino-pretty
```

Look for `event: 'request_complete'`, `event: 'request_error'`, `event: 'notification_failed'`, etc. Every log includes `requestId` and `version` where applicable.

## Graceful shutdown

`server/src/server.ts` handles `SIGTERM` and `SIGINT`:

1. Calls `setShuttingDown(true)`.
2. Closes the HTTP server and idle keep-alive connections.
3. Polls every 100 ms until `activeRequests` reaches 0 or `SHUTDOWN_TIMEOUT_MS` (30 s) elapses.
4. Calls `prisma.$disconnect()`.
5. Exits with code 0 (or 1 on error).

In-flight requests see a 503 response once `isShuttingDown` is true.

## `LOAD_SHED_THRESHOLD`

`server/src/middleware/load-shed.ts` counts active jobs for `/api/export`, `/api/reports` and `/api/imports`.

- Default threshold: `10` concurrent jobs.
- Override with `LOAD_SHED_THRESHOLD` environment variable.
- When the threshold is exceeded the server responds with `503 Service Unavailable` and `Retry-After: 30`.

## Rate-limit thresholds

All rate limits are per-user where a JWT cookie/header is present; they fall back to `req.ip` and then `anonymous`.

- **Global API** (`server/src/app.ts`): 100 requests / 15 min in production, 1000 / 15 min in development. Skips `GET /api/health` and `GET /api/auth/me`.
- **Strict endpoints** (`strictRateLimit`, 30 / 15 min):
  - `POST /api/claims`
  - `GET /api/search`
  - `GET /api/export/claims`
  - `POST /api/claims/:claimId/reports/:id/generate`
  - `GET /api/claims/:claimId/reports/:id/download`
  - `GET /api/claims/:claimId/reports/:id/download/docx`

Rate-limit headers are standard (`RateLimit-*`).

## Cache TTL and invalidation

The `InProcessCache` in `server/src/utils/cache.ts` is used for reference data in dashboard and analytics.

- Default TTL: **5 minutes** (`300000` ms).
- Single-flight loading prevents cache stampede.
- Invalidate a single key: `referenceDataCache.invalidate('processStatuses')`.
- Invalidate the whole cache: `referenceDataCache.invalidate()`.

Because the cache is in-process, invalidation does not propagate to other nodes. Restarting the server clears it.

## Backup reminders

- Back up the database before schema changes (`backup-mysql.ps1` or `mysqldump`).
- Keep `uploads/` and `reports/` on persistent storage or migrate to BLOB/object storage; the local disk is not retained across container redeploys.
- Do not commit `.env`, `dist/`, `node_modules/`, `uploads/` or `reports/`.
- Test restore procedures on a copy of production data at least quarterly.
