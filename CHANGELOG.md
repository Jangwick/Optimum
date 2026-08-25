# Changelog

## [Unreleased]

- `3fde298` feat: route splitting, manual chunks, memoization
- `37c8fb6` feat: client resilience (React Query, limits, errors)
- `7fe3b53` feat: versioned logs, sanitizer, safe notifications
- `1874d6b` fix: import jest globals in job-queue test
- `384f527` feat: add load shedding middleware
- `effb463` feat: add per-user and endpoint rate limits
- `4e3752a` feat: cache reference data in dashboard and analytics
- `8d965ba` feat: graceful shutdown and job queue
- `9dc0c6a` feat: stream files and fix setTimeout leak
- `27175c8` feat: request signal and export cancellation
- `07101dc` feat: add retry helper and wrap raw queries
- `897a849` feat: add explicit DB/HTTP/PDF timeouts
- `c780a21` feat: validate config and cap maxFileSize
- `b382ce0` feat: add idempotency key middleware
- `1a3f205` feat: retry unique claim/invoice numbers
- `fd0caf1` feat: wrap fee/assessment/settlement syncs in tx
- `19d36b2` feat: aggregate dashboard/analytics in DB
- `324007d` feat: add missing Prisma indexes
- `5525d8f` feat: cap export, import, and search limits
- `f4823a0` Phase 2.1c: paginate list endpoints
- `9287d15` Phase 2.1b: paginate fee/invoice/offer lists
- `0231dde` feat: paginate task/inspection/investigation lists
- `4e21db4` fix(client): point index.html to main.tsx
- `e9d8b86` docs: fix stale .js references in docs and Dockerfiles
- `c4c9a92` docs: update AGENTS, README, and references for TypeScript
- `bb1073b` feat: add Zod validation to all controllers
- `e1de48b` feat: enforce claim-scoped authorization
- `93010cc` feat: remove localStorage JWT, add download tokens
- `e7f693f` chore: allow unit tests to skip DB setup
- `2714c24` fix: sanitize docx preview to plain text
- `ec53601` fix: tighten auth rate limit and cors
- `d9e9c8b` fix: require env var for default admin password
- `9b16518` feat: add request logger and log redaction
