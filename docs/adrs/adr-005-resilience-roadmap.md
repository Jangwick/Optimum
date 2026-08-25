# ADR-005: Resilience and Optimization Roadmap

## Status

Accepted

## Context

Optimum is moving from a proof-of-concept JavaScript/Express stack to a production-track TypeScript application. The system handles sensitive insurance claim data, financial totals, file uploads, report generation and bulk imports. Without explicit hardening, the app is vulnerable to:

- unbounded list queries and exports causing memory and DB pressure,
- race conditions when generating claim/invoice numbers,
- long-running report/print/export operations that can hang or leak resources,
- noisy neighbor traffic on expensive endpoints,
- poor client behavior on slow or flaky networks,
- limited operational visibility when things fail.

We need a staged, reviewable plan that hardens the server and client without adding new operational dependencies before we have evidence they are needed.

## Decision

Adopt an ordered, atomic phase plan:

1. **Phase 1 — Security and trust boundaries first.** Authenticate every `/api` route, enforce claim-scoped authorization, remove localStorage JWT, use short-lived download tokens, apply Zod validation to all controllers, and tighten CORS and auth rate limits.
2. **Phase 2 — Backend performance and correctness.** Add server-side pagination, Prisma indexes, DB-level aggregations for dashboard/analytics, short `prisma.$transaction` blocks for totals sync, unique-constraint + retry for number generation, and hard caps for files, exports, imports and search.
3. **Phase 3 — Server resilience.** Add explicit DB/HTTP/PDF timeouts, a retry helper for transient Prisma errors, request cancellation via `AbortSignal`, streaming for file downloads, graceful shutdown, an in-process job queue, an in-process reference-data cache, per-user and per-endpoint rate limits, and load shedding.
4. **Phase 4 — Observability and graceful degradation.** Add versioned request/error logs, a `sanitize-log` helper, a health endpoint, and make audit/activity/notification writes non-blocking.
5. **Phase 5 — Client resilience.** Configure TanStack Query with `staleTime`, cache time, limited retries and backoff; add `ErrorBoundary`/`Suspense`; support `AbortSignal`; validate file sizes; cap client pagination and search limits; classify network vs. auth errors.
6. **Phase 6 — Client build and runtime optimization.** Use `React.lazy` for route splitting, Vite manual chunks, and targeted `memo` to reduce initial bundle and re-renders.

Each phase is committed atomically and includes targeted tests. We deliberately keep the queue, cache and load-shed counters in-process to avoid introducing Redis or a message broker before we have multi-node traffic. Every in-process ceiling is marked with a `LIMIT:` comment naming the upgrade path.

## Consequences

- Security is addressed before performance, so later phases do not mask authorization holes.
- Each phase is small enough to review, test and roll back independently.
- In-process resilience layers have known single-node ceilings. Upgrade paths are documented in code and in `RESILIENCE.md`.
- The roadmap does not require new infrastructure (Redis, Bull, SQS) for the current single-server deployment.
- Future horizontal scaling will require replacing the in-process cache, queue, job counter and idempotency store with shared services.

## Implementation

- `docs/RESILIENCE.md` maps each phase to files, behaviors and upgrade paths.
- `docs/OPERATIONS.md` describes rate limits, `LOAD_SHED_THRESHOLD`, cache TTL, graceful shutdown and backups.
- `docs/ARCHITECTURE.md` summarizes the trust boundaries, data flow and resilience layers.
