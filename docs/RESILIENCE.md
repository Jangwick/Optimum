# Resilience Runbook

This branch hardens Optimum in five phases. Each section lists the behavior, key files and known ceilings with an upgrade path.

## Phase 2 — Backend performance & correctness

Server-side pagination, Prisma indexes, DB-level aggregations, atomic transactions, race-free unique number generation and hard caps for uploads, exports, imports and search.

Key files:

- `server/src/validators/index.ts` — `PaginationQuerySchema` (`limit` default 20, max 100).
- `server/src/validators/master-data.ts`, `notification.ts`, `tasks.ts`, `document.ts`, `financial.ts`, `report.ts`, `inspection.ts`, `investigation.ts`, `discussion-note.ts`, `user.ts` — per-list query schemas.
- `server/src/services/claim.service.ts`, `fee.service.ts`, `invoice.service.ts`, `settlement.service.ts`, `assessment.service.ts`, `document.service.ts`, `task.service.ts`, `inspection.service.ts`, `investigation.service.ts`, `discussion-note.service.ts`, `notification.service.ts`, `master-data.service.ts`, `report.service.ts` — paginated list functions returning `{ items, count, page, limit }`.
- `server/prisma/schema.prisma` — indexes on Claim, Task, Inspection, Fee, Invoice, Settlement, Offer, AuditLog, ClaimStatusHistory, ClaimProcessStatusHistory and Notification.
- `server/src/services/dashboard.service.ts`, `analytics.service.ts` — Prisma `groupBy`/`aggregate` and raw SQL with `withRetry`.
- `server/src/services/fee.service.ts`, `assessment.service.ts`, `settlement.service.ts`, `report.service.ts` — `prisma.$transaction` with `maxWait: 5000`, `timeout: 10000` for totals sync and version creation.
- `server/src/services/claim.service.ts`, `invoice.service.ts` — unique-constraint + retry loop (up to 5 attempts) for `generateClaimNumber` / `generateInvoiceNumber`.
- `server/src/config/index.ts` — Zod env validation and `MAX_FILE_SIZE` hard cap at 100 MB.
- `server/src/services/export.service.ts` — 10,000-row cap; `server/src/services/search.service.ts` — 10-result cap; `server/src/imports/claims/workbook-parser.ts` — 50 sheets, 10,000 rows/sheet, 50,000 total rows, 120 s parse timeout.

Known ceilings / upgrade paths:

- Pagination returns at most 100 rows per page. Upgrade path: larger pages require DB benchmark + UI virtualization, not just a bigger limit.
- Raw SQL aggregates in dashboard/analytics bypass some Prisma safeguards. Upgrade path: migrate to native Prisma `groupBy` where MySQL support allows, or tune `queryTimeout` in `DATABASE_URL`.
- `generateClaimNumber` / `generateInvoiceNumber` count rows for the current year; concurrent load can still race until the unique constraint catches it. Upgrade path: a dedicated counter table or UUID-style numbers.
- Workbook import loads the whole file into memory. Upgrade path: streaming SAX parser or offload to a background queue.

## Phase 3 — Server resilience & boundaries

Explicit timeouts, retries, cancellation, streaming, graceful shutdown, in-process job queue, in-process cache, rate limits, load shedding and idempotency.

Key files:

- `server/src/db/client.ts` — `queryTimeout`, `connectTimeout`, `acquireTimeout`, `idleTimeout` and `connectionLimit` parsed from `DATABASE_URL` or env.
- `server/src/utils/retry.ts` — `withRetry` and `isPrismaTransientError`; retries `P1001`, `P1002`, `P1017` with full-jitter exponential backoff.
- `server/src/services/dashboard.service.ts`, `analytics.service.ts` — raw SQL queries wrapped with `withRetry`.
- `server/src/services/report.service.ts` — Puppeteer launch / `setContent` / PDF 60 s timeouts; checks `signal?.aborted` at cancellation points.
- `server/src/middleware/request-signal.ts`, `server/src/app.ts` — per-request `AbortSignal` set on `req.signal`.
- `server/src/controllers/export.controller.ts`, `server/src/controllers/report.controller.ts` — respect `req.signal`; `res.destroy()` on abort.
- `server/src/controllers/document.controller.ts` — streams `Readable` to `res`; handles stream errors.
- `server/src/server.ts` — SIGTERM/SIGINT handlers stop accept, wait up to 30 s for in-flight requests, then `prisma.$disconnect`.
- `server/src/queue/job-queue.ts`, `server/src/queue/job-counter.ts` — in-process background queue and active-job counter.
- `server/src/utils/cache.ts` — `InProcessCache` with TTL and single-flight loading; `server/src/services/dashboard.service.ts` and `analytics.service.ts` cache reference data.
- `server/src/middleware/rate-limit.ts`, `server/src/app.ts`, `server/src/routes/{claim,search,report,export}.routes.ts` — per-user global and per-endpoint `strictRateLimit`.
- `server/src/middleware/load-shed.ts` — caps concurrent `export`, `report` and `import` jobs using `LOAD_SHED_THRESHOLD`.
- `server/src/middleware/idempotency.ts` — idempotency-key cache for mutating endpoints.

Known ceilings / upgrade paths:

- `idempotency.ts` uses an in-process `Map`. Upgrade path: Redis-backed or shared cache for multi-instance deployments.
- `job-queue.ts` is single-node and loses jobs on restart. Upgrade path: Redis/Bull/SQS.
- `job-counter.ts` is per-process. Upgrade path: Redis-backed counter or semaphore.
- `cache.ts` is in-process and per-node; invalidation does not propagate. Upgrade path: Redis or a shared memory store.
- `document.service.ts` materializes the whole BLOB in memory from the Prisma adapter. Upgrade path: streaming SQL query or object store.
- Timeouts are static constants. Upgrade path: derive from SLAs and add adaptive circuit breakers.
- Load shedding counts are in-process; multi-node deployments need external coordination. Upgrade path: Redis cell or global queue.

## Phase 4 — Observability & graceful degradation

Structured request logging, versioned errors, health checks, sanitized logs and non-blocking audit/activity/notification writes.

Key files:

- `server/src/middleware/request-logger.ts` — request IDs, `x-request-id` header, structured `request_complete` logs with `version`.
- `server/src/middleware/error.ts` — centralized error handler; logs `version`, request ID, status code and stack.
- `server/src/routes/health.routes.ts` — returns `status`, `version`, `env`, DB connectivity and seeded row counts.
- `server/src/config/version.ts` — reads version from root `package.json`.
- `server/src/utils/sanitize-log.ts` — strips control characters from strings before logging or storing.
- `server/src/services/notification.service.ts` — `createNotification` catches errors and returns `null`; parent request continues.
- `server/src/services/activity.service.ts`, `audit.service.ts` — non-blocking writes; sanitized descriptions and `newValues`.

Known ceilings / upgrade paths:

- Logs are local pino text unless shipped. Upgrade path: stdout shipping to a log aggregator.
- Health check runs DB counts. Upgrade path: lightweight dependency probes for disk, memory and queue depth.
- Version is read from `package.json` at runtime. Upgrade path: build-time injection and image digest.

## Phase 5 — Client resilience

TanStack Query tuning, ErrorBoundary/Suspense, caller-supplied `AbortSignal`, file-size validation, pagination caps and network-vs-auth error classification.

Key files:

- `client/src/main.tsx` — `QueryClient` with `staleTime: 30s`, `gcTime: 5m`, `retry: 1`, exponential `retryDelay`, `refetchOnWindowFocus: false`, `refetchOnReconnect: true`; wraps the app in `ErrorBoundary` and `Suspense`.
- `client/src/services/api.ts` — 30 s timeout, `AbortSignal.timeout(30000)`, request IDs, 401 redirect to `/login`.
- `client/src/utils/api-error.ts` — classifies `auth`, `network`, `server`, `client` and `unknown` errors.
- `client/src/hooks/useList.ts` — caps `limit` at 100.
- `client/src/services/search.service.ts` — caps `limit` at 100.
- `client/src/pages/ClaimDetail.tsx`, `client/src/components/ClaimInvestigation.tsx` — client-side `MAX_FILE_SIZE` check (20 MB).
- `client/src/components/NotificationsDropdown.tsx` — `retry: 1` and exponential `retryDelay` on unread/list queries.
- `client/src/App.tsx` — `ErrorBoundary` wrappers around every route.

Known ceilings / upgrade paths:

- Client `MAX_FILE_SIZE` is hard-coded and may drift from the server cap. Upgrade path: a shared config endpoint or env-driven build-time constant.
- Retry policy is global. Upgrade path: per-endpoint retry policies and an offline mutation queue.

## Phase 6 — Client build & runtime optimization

Route-level code splitting, Vite manual chunks and targeted `memo` usage to reduce the initial bundle and avoid unnecessary re-renders.

Key files:

- `client/src/App.tsx` — `React.lazy` imports for every route; route components are loaded on demand.
- `client/vite.config.ts` — manual chunks for `vendor`, `ui`, `charts` and `documents`.
- `client/src/pages/Dashboard.tsx` — `memo` on metric cards, charts and lists.
- `client/src/pages/Claims.tsx` — `memo` on `StatusPill` and `ReadOnlyBadge`.

Known ceilings / upgrade paths:

- Lazy routes require a Suspense fallback. Upgrade path: route prefetching and service-worker caching.
- Manual chunks are static. Upgrade path: bundle analysis and route-based automatic chunking.
- `memo` only prevents re-renders of unchanged props. Upgrade path: virtualize large data tables.

## Verification matrix

| Phase | Server tests | Client tests | Other |
|---|---|---|---|
| Phase 2 | `cd server && npx jest --testPathPatterns=claim` <br> `npx jest --testPathPatterns=search` <br> `npx jest --testPathPatterns=dashboard` <br> `npx jest --testPathPatterns=config` <br> `npx jest --testPathPatterns=validators` | `cd client && npx vitest run src/services/search.service.test.ts` | `cd server && npm run typecheck` |
| Phase 3 | `npx jest --testPathPatterns=request-signal` <br> `npx jest --testPathPatterns=retry` <br> `npx jest --testPathPatterns=job-queue` <br> `npx jest --testPathPatterns=idempotency` <br> `npx jest --testPathPatterns=download-token` | — | `cd client && npx vitest run src/App.test.tsx` (sanity) |
| Phase 4 | `npx jest --testPathPatterns=sanitize-log` <br> `npx jest --testPathPatterns=logger` | — | `curl http://localhost:3001/api/health` |
| Phase 5 | — | `npx vitest run src/services/search.service.test.ts` <br> `npx vitest run src/App.test.tsx` <br> `npx vitest run src/pages/ClaimDetail.test.tsx` <br> `npx vitest run src/components/InitialInvestigation.test.tsx` | `npm run build` in `client` |
| Phase 6 | — | `npx vitest run src/App.test.tsx` | `npm run build` in `client` (verify chunking) |

Run the full suites only as a final check:

```bash
cd server && npm test
cd ../client && npm test
```
