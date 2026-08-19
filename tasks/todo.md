# Implementation Todo — Claims Solutions

## Phase 1 — Foundation

- [x] 1.1 Initialize monorepo, root package, ESLint/Prettier, `.gitignore`, README.
- [x] 1.2 Set up MySQL 8 with `docker-compose.yml`, Prisma init, schema base, first migration.
- [x] 1.3 Express bootstrap with env config, pino, helmet, CORS, rate limit, error handler, health endpoint.
- [x] 1.4 React Vite client with Tailwind v4, design tokens from `design.md`, Hanken Grotesk + JetBrains Mono fonts, `lucide-react` 20px icons, `logo.png` in sidebar/login, and dev proxy.

**Checkpoint 1**: `npm run lint`, `npm run build`, `npm run dev` succeed; `/api/health` and login page load.

## Phase 2 — Authentication & RBAC

- [x] 2.1 `Role` and `User` Prisma models, seed roles + initial admin, bcrypt.
- [x] 2.2 Login/logout/me endpoints with JWT in HTTP-only cookie, auth and RBAC middleware.
- [x] 2.3 Login page, `AuthContext`, role-based redirect, protected routes, role layouts.
- [~] 2.4 Users CRUD (admin) + profile (backend complete; frontend read-only list).

**Checkpoint 2**: Login works for all three roles; RBAC blocks cross-role API calls.

## Phase 3 — Master Data

- [x] 3.1 Insurance companies, clients, policies CRUD backend.
- [x] 3.1b Insurance companies, clients, policies API available for UI.
- [x] 3.2 Claim types and document categories CRUD + seed.
- [x] 3.3 18 claim statuses seed data and lookup endpoint.

**Checkpoint 3**: Master data forms submit and persist; status dropdown has 18 values.

## Phase 4 — Claim Management

- [x] 4.1 Claim creation with auto-generated claim/assignment numbers; assignment.
- [x] 4.2 Claim list with filters, pagination, search, role scoping.
- [x] 4.3 Claim detail page with summary, status actions, assignment, timeline.
- [x] 4.4 Excel export of claim register.

**Checkpoint 4**: A claim can be created, assigned, and status changed; register is searchable and exportable.

## Phase 5 — Investigation & Inspection

- [x] 5.1 Investigation record and contact records under claim.
- [x] 5.2 Inspection scheduling, completion, findings.
- [x] 5.3 Photo upload, grid preview, caption, delete.

**Checkpoint 5**: Engineer can investigate, schedule inspection, upload photos, and view them.

## Phase 6 — Document Management

- [x] 6.1 Document category requirements per claim type; document checklist.
- [x] 6.2 Document upload, download, preview, delete.
- [x] 6.3 Document history and audit for uploads/deletes.

**Checkpoint 6**: Document checklist auto-generates; required docs can be uploaded, marked received, and downloaded.

## Phase 7 — Assessment

- [x] 7.1 Loss assessment header + line items with auto-calculated totals.
- [x] 7.2 Loss estimate / reserve.
- [x] 7.3 Assessment summary in claim detail.

**Checkpoint 7**: Assessment totals calculate correctly; reserve visible on claim detail.

## Phase 8 — Reports & Templates

- [x] 8.1 Report template model and admin template upload (DOCX).
- [x] 8.2 Collect client templates / build generic placeholder templates.
- [x] 8.3 Report draft, version, DOCX generation with `docxtemplater`.
- [x] 8.4 PDF generation with `puppeteer` from HTML template.
- [x] 8.5 Client review / clarification workflow.

**Checkpoint 8**: A report can be generated as DOCX and PDF, submitted, and clarified.

## Phase 9 — Settlement & Fees

- [x] 9.1 Settlement and offer record CRUD.
- [x] 9.2 Fee entry (linked to user).
- [x] 9.3 Invoice generation from fees, payment recording.

**Checkpoint 9**: A claim can be settled, an offer recorded, fees invoiced, and payment recorded.

## Phase 10 — Dashboard, Tasks, Notifications, Audit

- [x] 10.1 Role dashboards with KPIs and charts.
- [x] 10.2 Task creation/assignment and notification generation.
- [x] 10.3 Audit log viewer for Admin.

**Checkpoint 10**: Dashboards render real data; tasks and notifications work; admin can view audit logs.

## Phase 11 — Testing & Quality

- [~] 11.1 Backend integration tests (Jest infra in place; ESM + Prisma adapter requires test DB tuning).
- [~] 11.2 Frontend component and hook tests (Vitest not configured).
- [x] 11.3 End-to-end manual QA checklist.

## Phase 12 — Deployment

- [x] 12.1 Build scripts, environment validation, production `build` + `start`.
- [x] 12.2 Nginx reverse proxy, SSL, PM2 process config, MySQL backup script.
- [x] 12.3 Runbook and README updates.

**Final Checkpoint**: Full MVP works in staging; all tests pass; deployment runbook is complete.