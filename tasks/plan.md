# Implementation Plan: Claims Solutions Insurance Adjustment Management System

**Full plan**: `C:\Users\Administrator\.devin\plans\plan-87f3885396a41ad7.md`

## Overview

Build a greenfield **React 18 + Node.js 22 + MySQL 8** web app for Claims Solutions to manage claims from assignment through investigation, inspection, documents, assessment, reporting, settlement, fees, and closure. Three roles: Admin, Engineer, Accountant. Replaces Excel as the primary tracking system.

## Architecture Decisions

- **Monorepo**: `client/` (React + Vite) and `server/` (Express + Prisma) under one repo with a root `package.json`.
- **Database ORM**: Prisma 7.9.1 for migrations and MySQL queries.
- **Auth**: JWT in `HttpOnly`, `Secure`, `SameSite=Strict` cookies, bcrypt password hashing.
- **RBAC**: Middleware on every API route; role-scoped claim queries.
- **State**: TanStack Query for server state; React Hook Form + Zod for forms.
- **Styling**: Tailwind CSS v4 with Headless UI for accessible components; design tokens sourced from `design.md`.
- **Fonts/Icons**: Hanken Grotesk + JetBrains Mono; `lucide-react` 20px line-style icons.
- **Brand**: `logo.png` used in sidebar, login, favicon, and reports.
- **Reports**: `docxtemplater` for DOCX, `puppeteer` for PDF, `exceljs` for Excel export.
- **Files**: Local `uploads/` and `reports/` for MVP; S3-compatible migration path documented.
- **Tests**: Jest + Supertest (backend); Vitest + React Testing Library (frontend).

## Tech Stack (Pinned)

| Layer | Package | Version |
|-------|---------|---------|
| React | `react` / `react-dom` | 18.3.1 |
| Build | `vite` / `@vitejs/plugin-react` | 6.4.3 / 6.0.5 |
| Router | `react-router-dom` | 6.30.0 |
| CSS | `tailwindcss` / `@tailwindcss/vite` | 4.3.3 |
| Fonts | `@fontsource/hanken-grotesk` / `@fontsource/jetbrains-mono` | 5.3.0 |
| State | `@tanstack/react-query` | 5.101.4 |
| Forms | `react-hook-form` / `@hookform/resolvers` / `zod` | 7.84.0 / 5.7.0 / 4.4.3 |
| UI | `@headlessui/react` / `lucide-react` / `sonner` / `recharts` | 2.2.10 / 1.31.0 / 2.0.8 / 3.10.1 |
| Server | `express` | 4.22.2 |
| ORM | `prisma` / `@prisma/client` | 7.9.1 |
| DB | `mysql2` | 3.23.2 |
| Auth | `bcrypt` / `jsonwebtoken` / `cookie-parser` | 6.0.0 / 9.0.3 / 1.4.7 |
| Security | `helmet` / `cors` / `express-rate-limit` | 8.3.0 / 2.8.6 / 8.6.2 |
| Upload | `multer` | 2.2.0 |
| Docs | `docxtemplater` / `puppeteer` / `pdfkit` / `exceljs` | 3.69.3 / 25.5.0 / 0.19.1 / 4.4.0 |
| Logs | `pino` / `pino-pretty` | 10.3.1 / 13.1.3 |
| Test BE | `jest` / `supertest` | 30.4.2 / 7.2.2 |
| Test FE | `vitest` / `@testing-library/react` / `jsdom` / `msw` | 4.1.10 / 16.3.2 / 30.0.1 / 2.15.0 |

## Database Summary

Prisma schema with 25+ tables: `users`, `roles`, `insurance_companies`, `clients`, `policies`, `claim_types`, `claim_statuses`, `claims`, `claim_assignments`, `claim_status_history`, `investigations`, `contacts`, `inspections`, `inspection_photos`, `document_categories`, `document_requirements`, `documents`, `loss_assessments`, `loss_assessment_items`, `loss_estimates`, `report_templates`, `reports`, `report_versions`, `clarifications`, `settlements`, `offers`, `fees`, `invoices`, `payments`, `tasks`, `notifications`, `audit_logs`.

All money fields are `Decimal(15,2)`. Statuses are a seedable lookup table with 18 configured values.

## API Summary

Base path `/api`. Routes grouped by: auth, users, master data (insurance companies, clients, policies, claim types, document categories, claim statuses), claims (CRUD, status, history, assign, timeline, export), investigations, contacts, inspections, photos, documents, loss assessments, loss estimates, reports (generate, versions, clarifications), settlements, offers, fees, invoices, payments, dashboard, tasks, notifications, audit logs.

## Frontend Summary

Role-based layouts and routes for Admin, Engineer, Accountant. UI follows `design.md` tokens: navy/red/orange palette, fixed 260px sidebar, 12-column content, 40px inputs, sticky table headers, metric cards with 4px top-cap. Shared components: table, modal, status badge, file upload, timeline, dashboard card. Dashboards use `recharts`. Forms use React Hook Form + Zod.

## Phases

1. **Foundation** — repo, MySQL Docker, Prisma, Express, React Vite, Tailwind, design tokens, fonts, `logo.png`, base layout.
2. **Auth & RBAC** — login/logout, JWT cookies, middleware, role-based UI.
3. **Master Data** — companies, clients, policies, types, categories, statuses.
4. **Claim Management** — claim creation, assignment, register, filters, Excel export.
5. **Investigation & Inspection** — investigation record, contacts, inspection, photo upload.
6. **Document Management** — document checklist, upload, preview, download, audit.
7. **Assessment** — loss assessment line items, calculations, reserve/estimate.
8. **Reports & Templates** — template upload, DOCX/PDF generation, clarification workflow.
9. **Settlement & Fees** — settlement, offers, fees, invoices, payments.
10. **Dashboard, Tasks, Notifications, Audit** — role dashboards, tasks, notifications, audit log.
11. **Testing & QA** — backend/frontend tests, coverage, manual checklist.
12. **Deployment** — build, Nginx, SSL, PM2, MySQL backup.

## Risks

- Report templates may be complex/unavailable → start with generic templates and refine.
- File upload storage growth → 20MB limit, MIME validation, backup plan, future S3.
- Puppeteer resource use on VPS → cache PDFs, sandbox flags, queue future.

## Open Questions

1. Where and when will the existing Word/PDF templates be provided?
2. Desired claim/assignment number format?
3. Money rounding rules?
4. File storage: local disk or existing S3/network?
5. Deployment target: specific VPS or provider-agnostic guide?

## Next Step

After plan approval, begin **Phase 1, Task 1.1**: initialize monorepo, ESLint, Prettier, and root scripts.