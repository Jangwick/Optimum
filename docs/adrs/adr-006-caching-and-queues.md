# ADR-006: In-Process Cache and Job Queue

## Status

Accepted

## Context

Dashboard and analytics repeatedly fetch the same reference data (`processStatus`, `claimType`, `client`, `engineer`, `accountant`). We also need a lightweight way to run background work (report generation, exports, imports) without blocking the request/response loop. A production-grade system would use Redis for cache and Bull/SQS for queues, but the current deployment is a single Node process. We do not want to add a new dependency and operational surface until we have evidence the single-node approach is insufficient.

## Decision

Use an **in-process cache** and an **in-process job queue** with explicit `LIMIT:` markers and documented upgrade paths.

1. Cache:
   - `server/src/utils/cache.ts` provides a minimal `InProcessCache` with TTL and single-flight loading.
   - Default TTL is 5 minutes.
   - It is used in `server/src/services/dashboard.service.ts` and `analytics.service.ts` for reference data lookups.
   - The implementation is intentionally small and replaceable.

2. Job queue and counter:
   - `server/src/queue/job-queue.ts` provides an `InProcessJobQueue` with per-type handlers and `AbortSignal` support.
   - `server/src/queue/job-counter.ts` tracks active `export`, `report` and `import` jobs for load shedding.
   - `server/src/middleware/load-shed.ts` rejects new expensive jobs when the threshold is exceeded.

3. Every in-process ceiling is marked with a `LIMIT:` comment:
   - `cache.ts`: in-process and per-node; does not propagate invalidation across replicas.
   - `job-queue.ts`: single-node and loses jobs on restart.
   - `job-counter.ts`: per-process only.

## Consequences

- Reference data is fetched once and reused, reducing DB pressure for dashboard and analytics.
- Background work has a clear abstraction, and handler errors do not crash the queue.
- No new infrastructure is required for the current single-server deployment.
- Cache entries are lost on restart and do not invalidate across multiple server instances.
- Jobs are lost on restart and are not distributed across nodes.
- Redis/Bull/SQS remain the future path for multi-instance or multi-worker deployments.

## Implementation

- `server/src/utils/cache.ts`
- `server/src/queue/job-queue.ts`
- `server/src/queue/job-counter.ts`
- `server/src/middleware/load-shed.ts`
- `server/src/services/dashboard.service.ts`
- `server/src/services/analytics.service.ts`

## Upgrade path

- Replace `InProcessCache` with Redis or a shared memory store and add an invalidation bus.
- Replace `InProcessJobQueue` and `JobCounter` with Bull/Redis or SQS when background work must survive restarts and run on dedicated workers.
