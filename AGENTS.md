# Agent Notes — Claims Solutions / Optimum

## Brand & Design

- **Design system source**: `design.md` (Optimum Assurance Desktop). It is the authoritative source for colors, typography, spacing, elevation, shapes, and components.
- **Prototype reference**: `index.html` shows the intended dashboard layout, sidebar, top bar, metric cards, and activity feed. Use it for structure, but reimplement in React with real data.
- **Logo**: `logo.png` must be used for the application logo. Copy it to `client/public/logo.png` and use it in the login page, sidebar header, favicon, and report headers.
- **Do not use** the external placeholder image URLs inside `index.html` (Google/AIDA-hosted logo and avatars).

## Typography & Icons

- **Primary font**: Hanken Grotesk (body, headlines).
- **Monospace font**: JetBrains Mono (labels, claim IDs, policy numbers, currency, timestamps).
- **Icon library**: `lucide-react` at 20px, line-style.

## Frontend Conventions

- Tailwind CSS v4 with CSS-based configuration in `client/src/index.css`.
- Theme tokens from `design.md` must be mapped to Tailwind (colors, spacing, border-radius, typography).
- Layout: fixed 260px sidebar (`sidebar-bg`), 12-column fluid content, 40px inputs, 56px top bar, metric cards with 4px top-cap, sticky table headers.

## Project Plan

- Full implementation plan: `C:\Users\Administrator\.devin\plans\plan-87f3885396a41ad7.md`
- TypeScript and Docker migration plan: `C:\Users\mikmikk03\.devin\plans\plan-typescript-and-docker.md`
- Repo plan: `tasks/plan.md`
- Task list: `tasks/todo.md`

## Technical Documentation

- Architecture overview, data flow, security model, and deployment notes: `references/technical-architecture.md`
- Security references and verification checklist: `references/security-checklist.md`

## Tech Stack (MVP)

- React 18 + Vite 6 + Tailwind CSS 4
- Node.js 22 + Express 4
- MySQL 8 + Prisma 7
- JWT + bcrypt, Multer, docxtemplater, puppeteer, exceljs

## Testing and Test-Driven Development

Testing is not an afterthought. Every feature, bug fix, and meaningful unit of behavior must be proven with a test before the implementation is considered complete, but do not overtest.

Follow the test pyramid: a solid base of fast, small unit tests; fewer integration tests at boundaries (API, database, file system); and very few end-to-end tests only for the most critical user flows. Avoid the inverted "ice-cream cone" with lots of slow UI tests and few unit tests.

- **Write a failing test first.** Before implementing any new feature or change, write a test that fails. For bug fixes, write a test that reproduces the bug and fails with the current code. A passing test on the first run proves nothing.
- **Every feature needs a test.** Every new feature, endpoint, component, service, and non-trivial utility must have at least one automated test covering the happy path and the most important error path.
- **Every line of code that carries behavior needs a reason to be trusted.** Trivial one-liners (passthroughs, simple constants, pure formatting) do not need their own tests. Logic with branches, calculations, side effects, or trust boundaries does.
- **Do not overtest.** Test behavior, not implementation. Do not test framework code, third-party libraries, or that a function was called. Do not write tests that break when a harmless refactor happens.
- **Follow the TDD cycle:** RED (failing test) → GREEN (minimal code to pass) → REFACTOR (clean up while tests still pass).
- **Prefer state-based assertions.** Test the outcome, not internal method calls. Tests that assert on call sequences break during refactors.
- **Prefer real implementations over mocks.** Use the simplest test double that works; reach for mocks only at slow, non-deterministic, or external boundaries (network, email, third-party APIs).
- **Follow Arrange-Act-Assert.** Set up the scenario, perform the action, verify the result. Keep one concept per test.
- **Run targeted, relevant tests.** After a change, run only the test files that cover the affected code. Do not run the entire suite unless a final check is needed.
- **Do not skip or disable tests to make a suite green.** If a test fails, fix the root cause or escalate, do not silence the signal.
- **Classify tests by size.** Small tests run in a single process with no network or database. Medium tests use localhost services (test DB, file system). Large tests touch external systems or a real browser. Most tests should be small.
- **Client tests:** use `npx vitest run <path>` or the relevant `*.test.tsx` files.
- **Server tests:** use `npx jest --testPathPatterns=<name>` and `NODE_OPTIONS=--experimental-vm-modules` when needed.

## Code Quality and Review

Every change is reviewed for correctness, readability, architecture, security, and performance before it is committed or merged.

### Pre-commit checklist

- [ ] The change does exactly what the task or spec requires and nothing extra.
- [ ] A failing test was written first (TDD), or a regression test was added for any bug fix.
- [ ] Targeted tests pass: `npx vitest run <path>` for client changes, `npx jest --testPathPatterns=<name>` for server changes.
- [ ] Lint passes in both `client` and `server`: `npm run lint`.
- [ ] Client build succeeds: `cd client && npm run build`.
- [ ] No secrets, passwords, or tokens in the diff.
- [ ] No `.env`, `dist/`, `node_modules/`, one-off repro scripts, or generated artifacts are staged.
- [ ] Database migrations and seed scripts are idempotent and safe to re-run.
- [ ] Error paths are handled, not just the happy path.
- [ ] User input is validated at the trust boundary.
- [ ] The diff is small and focused; changes over ~300 lines are split or reviewed extra carefully.

### Review standards

- **Correctness:** edge cases and error paths are handled; the change matches the spec.
- **Readability:** names are clear, logic is straightforward, and comments explain intent (not obvious behavior).
- **Architecture:** the change follows existing patterns, does not leak feature logic into shared modules, and does not introduce unnecessary abstractions.
- **Security:** trust boundaries are respected, secrets are not exposed, auth checks are in place, and external data is treated as untrusted.
- **Performance:** no N+1 queries, unbounded loops, or unnecessary re-renders.
- **Change size:** target ~100 lines; ~300 is acceptable for a single logical change; over ~1000 lines must be split.
- **Review comments are labeled:** `Critical:` (blocks merge), `Required:` (must address), `Optional:` / `Consider:` (suggestion), `Nit:` (minor).
- **Dependency discipline.** Before adding a dependency: check the existing stack, check bundle size and license, check that it is maintained, and run `npm audit`. Upgrade one dependency at a time, read its changelog, and review the lockfile diff.
- **Do not merge unreviewed code.** Even small changes get a quick review.

## TypeScript and Type Boundaries

Type safety is an architectural seam, not just decoration. Types should model the domain, enforce trust boundaries, and prevent drift between client and server.

- **Design domain types intentionally.** Do not mirror API response shapes or auto-generated database types directly into business logic. Map external data into a stable domain model at the boundary.
- **Avoid `any`.** Use `unknown` for data that has not yet been validated, then narrow with Zod or a type guard. Every `any` is a hole in the contract and must have a path to removal.
- **Enable strictness plus the two high-value flags.** `strict: true` is the starting point; `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` catch the `undefined` and optional-property bugs that `strict` misses.
- **Keep public types minimal and stable.** The `packages/shared-types` package owns cross-cutting API contracts. Do not export implementation details. Version breaking changes and document them.
- **Internal types stay local.** Client components and server services should not import each other's internal type directories. Shared types are the only cross-workspace dependency.

## Docker and Containerization

Docker is a production boundary, not a local-only convenience. Build images as if they will run in a restricted Kubernetes or cloud environment.

- **Multi-stage builds.** Separate dependency installation, build, and runtime into distinct stages so the final image contains only what runs.
- **Use `npm ci`, not `npm install`.** `npm ci` is deterministic and respects the lockfile. In the runtime stage use `npm ci --omit=dev`.
- **Run as non-root.** The server container should use a non-root `USER`. The client container should use an unprivileged nginx image or run on an unprivileged port.
- **Add `HEALTHCHECK`.** The server image should expose `/api/health` and a Docker `HEALTHCHECK` that verifies it. `docker-compose.yml` should wait for healthy dependents, not just `depends_on`.
- **Do not bake secrets or environment files.** Keep `.env`, certificates, and build secrets out of image layers. Pass them at runtime and add them to `.dockerignore`.
- **Pin base image tags.** Prefer exact version tags or digests (e.g., `node:22-slim@sha256:...`) for reproducible, auditable builds.

## Idempotency and Drift-Resistant Operations

Operations that can run more than once without error are a production safety net. Migrations, seeds, setup scripts, and deployment commands must all be safe to re-run against a partially modified state.

- **Migrations must be idempotent.** Raw SQL migrations must be safe to re-run on a database with schema drift. Use `IF [NOT] EXISTS` guards for `ADD COLUMN`, `DROP COLUMN`, `MODIFY`, `ADD/DROP FOREIGN KEY`, `ADD/DROP INDEX`, `CREATE TABLE`, and `CREATE INDEX` (MariaDB/MySQL compatible syntax). Migration files generated by `prisma migrate diff` are not idempotent by default; review and guard them before committing.
- **Seeds and startup scripts must be idempotent.** Use upserts and existence checks so re-running them does not duplicate data or fail. The default admin and reference data should not create duplicates on re-run.
- **Resolve failed migrations before re-deploying.** A migration recorded as failed in `_prisma_migrations` blocks all future `prisma migrate deploy` runs. After fixing the SQL, mark the failed migration as rolled back with `npx prisma migrate resolve --rolled-back <name>` and then re-deploy.
- **Production hotfixes must be reflected in a migration or baseline.** If you apply a schema or data change directly to the database, reconcile it with a migration and `prisma migrate resolve` so the migration history stays true.
- **Do not commit one-off repro scripts or SQL artifacts.** Ad-hoc SQL files and repro scripts are for local debugging only. Keep them out of version control or add them to `.gitignore`.

## Security & Secure Coding

Security is a constraint on every line that touches user data, authentication, files, or external input. Follow these principles on every change.

For a curated list of external references and a per-change verification checklist, see `references/security-checklist.md`.

This checklist aligns with the OWASP Top 10:2025 and common defensive practices for this Express + React stack.

### Input validation and trust boundaries
- **Treat all external input as untrusted**, including HTTP bodies, query params, route params, headers, cookies, file uploads, and data from third-party APIs or LLMs.
- Validate and sanitize at the API boundary. Cast numeric IDs with `Number` and reject `NaN`. Prefer Zod schemas for complex request bodies.
- Never trust client-supplied MIME types or file extensions. Verify uploads with an allowlist and magic-byte content checks.

### Authentication and authorization (A01, A07)
- Authenticate every `/api` route except `/api/health` with `authMiddleware`.
- Authorize every action. Use `requireRole` for role checks and `assertClaimAccess` / `canAccessClaim` for claim-scoped resources. Default to **deny**.
- Enforce least privilege: users should only see and mutate data they own, are assigned to, or are explicitly allowed to manage.

### Output encoding and injection prevention (A05)
- Use parameterized queries via Prisma; never concatenate user input into SQL.
- HTML-escape user-controlled values before building report PDF HTML or any server-rendered output. Avoid `innerHTML` and `dangerouslySetInnerHTML` with user data.
- Encode `Content-Disposition` filenames and other headers that carry user data.

### Cryptography and session management (A04, A07)
- Hash passwords with bcrypt (≥12 rounds). Use `crypto.randomBytes` or the installed `nanoid` for tokens, nonces, and generated passwords; never `Math.random()`.
- Keep `JWT_SECRET`, `DATABASE_URL`, and bcrypt rounds in environment variables, not code.
- Auth cookies must be `httpOnly`, `secure` in production, and `sameSite='lax'`. Clear them with matching options and `maxAge: 0`.
- Avoid returning JWTs in JSON or storing them in `localStorage`. If a query-string token is required for binary downloads, restrict it to those specific GET routes.

### File and path safety (A01, A08)
- Resolve stored file paths only under `UPLOAD_DIR` and `REPORT_DIR` using `resolveFilePath`. Reject absolute paths and `..` traversal before `fs` calls or `res.sendFile`.
- Do not serve the `uploads` directory as a public static mount. Files are served only through authenticated API endpoints.

### Configuration and hardening (A02)
- Use helmet for security headers and review defaults before relaxing them.
- Keep CORS and CSP tight. Do not rely on wildcard (`*`) origins in production unless the deployment explicitly requires it.
- Remove or protect public static mounts, default accounts, and debug endpoints.

### Rate limiting and availability (A10)
- Apply `express-rate-limit` to auth and expensive endpoints. Auth limits must be stricter than the global API limit.
- Cap upload size and JSON/URL-encoded body size. Handle abnormal conditions gracefully and **fail closed**, not open.

### Logging and monitoring (A09)
- Log security events (login, logout, failed auth, privilege changes, file access, claim mutations) through `audit.service` or an equivalent audit trail.
- Ensure audit failures do not break business logic, but do not swallow security errors silently.
- Keep sensitive data out of logs: no tokens, passwords, hashes, or PII.

### Errors and exceptions (A10)
- Return generic, non-revealing error messages to clients. Use `AppError` with safe messages and log the real details server-side.
- Handle edge cases explicitly: missing resources, invalid IDs, validation failures, and authorization denials should all lead to deterministic, safe states.

### Supply chain and dependencies (A03, A06)
- Maintain one authoritative lockfile and package manager. Review new dependencies before adding them; avoid install scripts unless inspected.
- Run `npm audit` against the lockfile before release and triage findings by reachability and exploitability. Do not run `npm audit fix --force` blindly; review breaking changes first.

### Secure design (A06)
- Threat-model new features: identify assets, trust boundaries, and how an attacker would misuse the feature.
- Build allowlists, not denylists, for file types, URL schemes, hosts, and actions.
- Avoid SSRF: never fetch user-supplied URLs without an allowlist of schemes and hosts, and reject private/reserved IPs.

### Testing
- After security changes, run targeted tests (e.g., `auth.test.js`, `claim.test.js`, `file-path.test.js`) instead of the full suite unless a broader check is required.
- Add or update a focused regression test for non-trivial security logic.