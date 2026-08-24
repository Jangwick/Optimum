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

Testing is not an afterthought. Every feature and every bug fix must be proven with a test before the implementation is considered complete.

- **Write a failing test first.** Before implementing any new feature or change, write a test that fails. For bug fixes, write a test that reproduces the bug and fails with the current code. A passing test on the first run proves nothing.
- **Follow the TDD cycle:** RED (failing test) → GREEN (minimal code to pass) → REFACTOR (clean up while tests still pass).
- **Prefer state-based assertions.** Test the outcome, not internal method calls. Tests that assert on call sequences break during refactors.
- **Prefer real implementations over mocks.** Use the simplest test double that works; reach for mocks only at slow, non-deterministic, or external boundaries (network, email, third-party APIs).
- **Follow Arrange-Act-Assert.** Set up the scenario, perform the action, verify the result. Keep one concept per test.
- **Run targeted, relevant tests.** After a change, run only the test files that cover the affected code. Do not run the entire suite unless a final check is needed.
- **Do not skip or disable tests to make a suite green.** If a test fails, fix the root cause or escalate, do not silence the signal.
- **Client tests:** use `npx vitest run <path>` or the relevant `*.test.tsx` files.
- **Server tests:** use `npx jest --testPathPatterns=<name>` and `NODE_OPTIONS=--experimental-vm-modules` when needed.

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