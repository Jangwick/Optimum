# Verification and Guard

This document captures the final build metrics, CI command matrix, and known warnings and limits for the `feature/resilience-and-optimization` branch.

## Build Metrics

- **Server typecheck**: `cd server && npx tsc --noEmit` — pass
- **Server lint**: `cd server && npm run lint` — pass
- **Client typecheck**: `cd client && npx tsc --noEmit` — pass
- **Client lint**: `cd client && npm run lint` — pass
- **Client build**: `cd client && npm run build` — pass
  - Output chunks:
    - `index` — 93.76 kB
    - `vendor` — 209.13 kB
    - `charts` — 418.57 kB
    - `documents` — 503.73 kB
- **Targeted Jest**: 6 suites, 30 tests passed

## CI Command Matrix

| Check | Command |
|---|---|
| Server typecheck | `cd server && npx tsc --noEmit` |
| Server lint | `cd server && npm run lint` |
| Client typecheck | `cd client && npx tsc --noEmit` |
| Client lint | `cd client && npm run lint` |
| Client build | `cd client && npm run build` |
| Targeted Jest | `cd server; $env:SKIP_DB_SETUP='true'; $env:NODE_OPTIONS='--experimental-vm-modules'; npx jest --testPathPatterns="sanitize-log\|job-queue\|request-signal\|retry\|idempotency\|config"` |

## Known Warnings and Limits

- **`documents` chunk size**: 503.73 kB, slightly above the 500 kB warning threshold. This is because `mammoth` is bundled in the route-level document-import chunk. It is only loaded on the document import route.
- **In-process cache and job queue**: Both are single-node and lose state on restart. Multi-instance deployments need Redis, Bull, or SQS.
- **DB query timeout**: Enforced through the MariaDB/MySQL driver `queryTimeout` in `DATABASE_URL` and Prisma transaction `maxWait`/`timeout` values. Heavy raw SQL aggregates can still exceed these on large data sets.
- **Load shedding and idempotency counters**: These are in-process. Distributed deployments need an external semaphore or shared state.
- **Jest run notes**: `SKIP_DB_SETUP='true'` avoids database bootstrapping for the targeted unit suites. Integration tests still need the test database.
