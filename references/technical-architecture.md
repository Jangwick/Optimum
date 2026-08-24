# Optimum Technical Architecture

## Overview

Optimum is a claims-adjustment management system. It lets insurance adjusters create claims, assign engineers and accountants, upload documents and inspection photos, generate PDF/DOCX reports, track process status, and export financial data. The system is split into a React single-page application for the frontend and an Express REST API for the backend.

## Tech Stack

- **Frontend:** React 18, Vite 6, Tailwind CSS 4, TanStack Query, React Router DOM 6, React Hook Form, Zod, Axios, Recharts, date-fns, Vitest
- **Backend:** Node.js 22, Express 4, Prisma 7, MySQL 8, JWT, bcrypt, Multer, docxtemplater, Puppeteer, ExcelJS, pino, Jest + Supertest
- **Shared tooling:** npm, concurrently, ESLint, Prettier
- **Containerization target:** Docker, Docker Compose, nginx (client), Node 22 slim (server)

## High-Level Architecture

```
┌──────────────┐      HTTP / REST      ┌─────────────────┐      Prisma       ┌──────────┐
│  React SPA   │ ←──────────────────→ │  Express API    │ ←───────────────→ │  MySQL 8 │
│  (Vite)      │   JWT cookie + auth   │  (Node 22)      │    Client       │          │
└──────────────┘                       └─────────────────┘                 └──────────┘
                                              │
                                              ▼
                                       File system (uploads, reports, templates)
```

The client is served as a static SPA. In production the same Express process also serves `client/dist` with a fallback to `index.html`. The client can also be served independently by nginx in the Docker target.

## Backend Architecture

### Entry point

- `server/src/server.js` starts the Express app, reads `PORT` from config, and auto-runs `prisma db push` and `prisma/seed.js` on startup.
- `server/src/app.js` wires middleware, routes, static serving, and the 404/error handlers.

### Middleware stack

1. `helmet` — security headers.
2. `cors` — dynamic origin based on `CLIENT_URL` and localhost in dev.
3. `express.json` / `express.urlencoded` — JSON body parsing with a 1 MB cap.
4. `cookie-parser` — cookie handling.
5. `express-rate-limit` — global API rate limiting.
6. `authMiddleware` — on individual routes.
7. `errorHandler` — centralized error response.

### Route layout

Routes are grouped by domain and mounted in `app.js`:

- `/api/auth` — login, logout, current user, password change
- `/api/users` — user management
- `/api/master-data` — reference tables (insurers, clients, claim types, etc.)
- `/api/claims` — claims CRUD and list
- `/api/claims/:claimId/*` — nested resources (investigations, documents, inspections, reports, invoices, fees, settlements, assessments, etc.)
- `/api/dashboard`, `/api/analytics` — KPIs and charts
- `/api/audit-logs` — audit trail
- `/api/export` — Excel exports
- `/api/tasks`, `/api/notifications`, `/api/process-statuses` — workflow and activity

### Request flow

A typical request goes: `Route` → `authMiddleware` / `rbac` → `Controller` (validate, extract params) → `Service` (business logic + Prisma) → `Prisma Client` → `MySQL`. Errors are propagated to `errorHandler`, which returns a generic message and logs details via pino.

### Key services

- `claim.service.js` — core claim CRUD, assignment, scoping
- `document.service.js` — file upload, storage, access control
- `report.service.js` — report drafts, PDF/DOCX generation, file containment
- `user.service.js` — user CRUD and password/role management
- `auth.service.js` — JWT issue/verify and cookie handling
- `audit.service.js` — audit log writes

### File handling

- Files are uploaded with Multer into memory, then validated and stored in `server/uploads` (or DB BLOB in newer paths).
- File paths are resolved through `server/src/utils/file-path.js` to prevent traversal; all paths must be under `UPLOAD_DIR`.
- Reports are generated into `server/uploads/reports/<claimId>/<filename>`.
- Documents and report previews are served through authenticated API endpoints, not a public static mount.

### Authentication and authorization

- Login returns a JWT signed with `JWT_SECRET` and sets it as an `httpOnly`, `secure` (production), `sameSite='lax'` cookie.
- `authMiddleware` verifies the cookie or `Authorization: Bearer <token>` header. Query-string tokens are only accepted for the document preview/download GET routes.
- `rbac.js` enforces role checks.
- `claim.service.js` or `auth.js` assert claim access: admin, assigned engineer, assigned accountant, or claim creator.

### Database

- Prisma schema is in `server/prisma/schema.prisma`.
- Prisma client is generated to `server/generated/prisma`.
- Key entities: User, Role, Claim, Client, InsuranceCompany, Policy, ClaimInsurer, Document, Report, Inspection, Task, Fee, Invoice, Settlement, AuditLog, and many related lookup/junction tables.

## Frontend Architecture

### Entry point

- `client/src/main.jsx` mounts `App` inside `StrictMode`, `QueryClientProvider`, `BrowserRouter`, and `AuthProvider`.
- `client/src/App.jsx` declares all routes and a `ProtectedRoute` wrapper that checks `useAuth` and optional allowed roles.

### State and data fetching

- Global auth state lives in `client/src/context/AuthContext.jsx`.
- Server data is fetched with TanStack Query through service functions in `client/src/services/*.js`.
- The `api.js` file creates an Axios instance that attaches the JWT from `localStorage` and redirects to `/login` on 401.

### Page and component structure

- `client/src/pages/*.jsx` — top-level routes (Dashboard, Claims, ClaimDetail, NewClaim, Reports, etc.).
- `client/src/components/*.jsx` — reusable UI (DataTable, Modal, Select, TopBar, Sidebar, form inputs, dashboard widgets).
- `client/src/hooks/useList.js` — shared list pagination/filtering hook.
- `client/src/lib/utils.js` and `client/src/utils/currency.js` — formatting helpers.

### Styling

- Tailwind CSS v4 with a custom theme defined in `client/src/index.css`.
- Fonts: Hanken Grotesk (body), JetBrains Mono (labels, claim IDs, currency).
- Icons from `lucide-react` at 20px line style.

### Build

- Vite bundles the client to `client/dist`.
- The backend can serve `client/dist` directly for production, or nginx can serve it in Docker.

## Data Flow Example (Claim Creation)

1. User fills `NewClaim` form.
2. React Hook Form validates with Zod.
3. `claim.service.js` POSTs to `POST /api/claims`.
4. `claim.controller.js` calls `claim.service.js`.
5. Service creates the claim in Prisma and records an activity.
6. Response returns the new claim.
7. TanStack Query caches the result; UI navigates to the claim detail.

## Security Model

- All `/api` routes except `/api/health` require authentication.
- Role checks are applied at route or service level.
- Claim-scoped resources verify the user is admin, assigned engineer, assigned accountant, or the creator.
- Input is validated at API boundaries (Zod in newer paths, manual checks in older paths).
- User-controlled output is escaped before report PDF generation and encoded in `Content-Disposition` headers.
- File uploads are allowlisted by extension and verified by magic bytes.
- Rate limiting is stricter on auth endpoints.
- Secrets are kept in environment variables.

## Environment Variables

Server (`server/.env`):

- `NODE_ENV` — `development` | `production`
- `PORT` — server port, default `3001`
- `CLIENT_URL` — allowed CORS origin
- `DATABASE_URL` — MySQL connection string
- `JWT_SECRET` — signing secret
- `JWT_EXPIRES_IN` — token lifetime
- `BCRYPT_ROUNDS` — password hashing cost
- `UPLOAD_DIR`, `REPORT_DIR`, `MAX_FILE_SIZE`

Client (`.env` / `.env.local`):

- `VITE_API_BASE_URL` — backend base URL, default `/api`

## Development Commands

- `npm run dev` at root — starts server and client concurrently.
- `cd client && npm run dev` — Vite dev server.
- `cd server && npm run dev` — nodemon (or `tsx watch` after migration).
- `npm run build` — builds client.
- `npm run lint` — lints server and client.
- `cd client && npm test` — Vitest.
- `cd server && npm test` — Jest.

## Testing

- Client: Vitest with `@testing-library/react`.
- Server: Jest with Supertest.
- Tests should be targeted; full suite is only run as a final check.

## Deployment and Docker Target

- Backend runs as a Node 22 slim container, compiled with `tsc`.
- Frontend is built with Vite and served by nginx.
- `docker-compose.yml` orchestrates MySQL, server, and client.
- Environment variables are passed via an `.env` file; `.env` must never be committed.

## Key Directories

- `client/src/` — SPA source
- `client/public/` — static assets
- `server/src/` — API source
- `server/prisma/` — schema and migrations
- `server/generated/prisma/` — generated Prisma client
- `server/tests/` — Jest tests
- `server/uploads/` — uploaded files (not committed)
- `server/reports/` — generated reports (not committed)
- `server/templates/` — DOCX report templates
- `references/` — security checklist and technical architecture

## Notes for Agents

- Do not add new abstractions unless requested; prefer the existing service/route/controller pattern.
- Do not introduce new dependencies if an installed one already solves the problem.
- Keep all file paths inside `UPLOAD_DIR` and `reportDir`; use `resolveFilePath` for safe resolution.
- Preserve the existing role and claim-access model when modifying routes or services.
- Run targeted tests after changes; do not run the full suite unless a final check is needed.

## TypeScript Migration and Tooling

### Phase 0 — Stabilization

- The server test suite was wired to the `server/.env` test database URL through `server/tests/setup-test-env.js` and `server/tests/globalSetup.js`. Jest now runs `prisma db push` and `prisma db seed` once before all suites.
- Coverage was added for documents, reports, and user endpoints in `server/tests/feature-coverage.test.js`.
- A file-upload bug was fixed: `server/src/middleware/upload.js` now returns `400` for disallowed extensions and mismatched MIME types instead of `500`.

### Phase 1 — TypeScript Tooling

- npm workspaces are enabled from the root `package.json` with `client`, `server`, and `packages/*`.
- A `packages/shared-types` workspace was created for cross-package API contracts and DTOs; it builds with `tsc` and emits declarations to `dist/`.
- Client tooling:
  - `typescript` and `@types/react`/`@types/react-dom`/`@types/node` added.
  - `client/tsconfig.json` and `client/tsconfig.node.json` created with `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`.
  - `client/vite.config.js` renamed to `client/vite.config.ts`.
  - `client/eslint.config.js` updated with `typescript-eslint` for `.js`/`.jsx`/`.ts`/`.tsx`.
- Server tooling:
  - `typescript`, `tsx`, `ts-jest`, and relevant `@types/*` packages added.
  - `server/tsconfig.json` created with `NodeNext` module resolution, `allowJs: true`, `strict`, and output to `dist/`.
  - `server/eslint.config.js` updated with `typescript-eslint` and `.cjs`/`.mjs` support.
  - `dev` script changed to `tsx watch src/server.js`; `build` runs `npx prisma generate && tsc`.

### Verification

- `npm run typecheck` passes in both `client` and `server`.
- `npm run build` passes in both `client` and `server`.
- `npm test` passes in both `client` and `server`.
- `npm run lint` passes in both `client` and `server`.

### Phase 2 — Module-by-Module Migration

- Migrated server utility modules first:
  - `server/src/utils/escape-html.ts`
  - `server/src/utils/file-path.ts`
- Migrated shared server infrastructure:
  - `server/src/config/index.ts`
  - `server/src/middleware/error.ts`
  - `server/src/middleware/auth.ts`
  - `server/src/middleware/rbac.ts`
  - `server/src/middleware/upload.ts`
  - `server/src/services/auth.service.ts`
  - `server/src/db/client.ts`
  - `server/src/config/logger.ts`
  - `server/src/services/audit.service.ts`
  - `server/src/services/activity.service.ts`
  - `server/src/services/notification.service.ts`
  - `server/src/services/user.service.ts`
- Jest was configured with `maxWorkers: 1` to avoid claim-number generation races across parallel integration suites sharing the same test database.
- `server/package.json` Jest config updated to `ts-jest/presets/default-esm` with `moduleNameMapper` so existing `.js` imports resolve to renamed `.ts` source files and tests still run without editing every import path.

### Current migration status

- Server: `utils/escape-html.ts`, `utils/file-path.ts`, `config/index.ts`, and `middleware/error.ts` are TypeScript; all other source files are still JavaScript and are imported with `.js` extensions.
- Client: no source files renamed to `.tsx` yet; tooling only.
- No `.js` files have been removed before their `.ts`/`.tsx` replacements are working.
