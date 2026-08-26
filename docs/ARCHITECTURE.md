# Optimum Architecture

## System overview

Optimum is a claims-adjustment management system.

- **Client:** React 18 SPA built with Vite 6, TypeScript, Tailwind CSS 4, TanStack Query 5, React Router DOM 6, React Hook Form, Zod, Axios, Recharts and `lucide-react`.
- **Server:** Node.js 22 + Express 4 + TypeScript, Prisma 7 with `@prisma/adapter-mariadb` against MySQL 8 / MariaDB.
- **Reports / exports:** Puppeteer, ExcelJS, docxtemplater, PizZip, Multer.
- **Deployment target:** Docker multi-stage builds, optionally served by nginx for the client.

The server can serve `client/dist` with an `index.html` fallback, or the client can be served independently.

## Trust boundaries

- `authMiddleware` runs on every `/api` route except `/api/health`. It verifies a JWT in a `httpOnly` cookie or `Authorization: Bearer` header. Query-string download tokens are accepted only for binary GET routes (`/documents/*/preview|download`, inspection photos).
- `requireRole` enforces coarse role checks (`ADMIN`, `ENGINEER`, `ACCOUNTANT`).
- `assertClaimAccess` enforces claim-scoped authorization: admin, assigned engineer, assigned accountant or claim creator.
- All request bodies, query params and uploads are validated with Zod at the controller boundary.
- File uploads are allow-listed by extension and verified by magic bytes; stored paths are resolved under `UPLOAD_DIR` / `REPORT_DIR` via `resolveFilePath` to prevent traversal.

## Data flow

```
React SPA --HTTP/REST+JWT--> Express API --Prisma--> MySQL/MariaDB
                                      |-> UPLOAD_DIR / REPORT_DIR
```

1. The client calls `client/src/services/api.ts` (Axios, 30s timeout, request IDs, `AbortSignal` timeout, 401 redirect).
2. Express routes delegate to controllers that parse Zod schemas and call services.
3. Services run business logic and Prisma queries; raw SQL aggregates use `withRetry`.
4. Documents are stored as DB BLOBs where possible (with an in-code `LIMIT:` marker: the whole BLOB is materialized in memory by the adapter). Legacy records fall back to disk in `UPLOAD_DIR`.
5. File downloads are streamed with `Readable.pipe(res)`. Report PDFs/DOCXs and Excel exports are built on the server and returned as buffers or streams.

## Key resilience layers

- **Pagination / limits:** `PaginationQuerySchema` caps `limit` at 100; search at 10; export at 10,000 rows; `MAX_FILE_SIZE` capped at 100 MB.
- **Idempotency:** `Idempotency-Key` header middleware for mutating endpoints.
- **Timeouts:** DB connection/idle/query timeouts from `DATABASE_URL`; 30 s Axios timeout; 60 s Puppeteer/PDF timeouts; 10 s Prisma transaction timeouts; 120 s workbook import timeout.
- **Retries:** `withRetry` on transient Prisma errors (`P1001`, `P1002`, `P1017`) with jittered exponential backoff; claim and invoice number generation retry on `P2002`.
- **Cancellation:** `requestSignalMiddleware` attaches an `AbortSignal` to every request; report and export services respect it; `res.destroy()` on abort.
- **Streaming / setTimeout hygiene:** file downloads use streams; parse timeouts use fresh `setTimeout` references.
- **Graceful shutdown:** SIGTERM/SIGINT stop accepting connections, wait up to 30 s for in-flight requests and close Prisma.
- **Job queue:** `InProcessJobQueue` in `server/src/queue/job-queue.ts` isolates background work.
- **Cache:** `InProcessCache` with a 5-minute TTL and single-flight loading for reference data.
- **Rate limits:** per-user global limit (100/15 min prod, 1000/15 min dev); `strictRateLimit` (30/15 min) on `/api/export/claims`, `/api/reports/*/generate`, `/api/reports/*/download*`, `/api/search` and `POST /api/claims`.
- **Load shedding:** `LOAD_SHED_THRESHOLD` caps concurrent export/report/import jobs; returns 503 with `Retry-After: 30`.
- **Logging / sanitization:** pino request logger with request IDs and `version`; `sanitize-log.ts` strips control characters from user data before logging or storing.

## Observability

- `request-logger.ts` emits structured `request_complete` logs with `method`, `route`, `statusCode`, `duration_ms` and `version`.
- `error.ts` enriches error logs with request ID, version and stack.
- `GET /api/health` returns `status`, `version`, `env`, `database` connectivity and seeded row counts.
