# Claims Solutions / Optimum — Insurance Adjustment Management System

A greenfield React + Node.js + MySQL web application for managing insurance claims from assignment through closure.

## Quick Start

```bash
# Start MySQL (requires Docker)
docker compose up -d

# Install dependencies
npm install
cd server && npm install && npx prisma migrate dev && npx prisma db seed
cd ../client && npm install

# Run both servers
cd ..
npm run dev
```

- Client: http://localhost:5173
- API: http://localhost:3001
- API health: http://localhost:3001/api/health

## Project Structure

- `server/` — Express API, Prisma ORM, MySQL schema, tests
- `client/` — React 18 + Vite + Tailwind CSS v4 frontend
- `tasks/plan.md` and `tasks/todo.md` — implementation plan and task list
- `design.md` — design system source of truth
- `logo.png` — application brand logo

## Environment

Copy `.env.example` files to `.env` and fill in real values before running in production.

## Production Deployment

1. Build the client:
   ```bash
   cd client && npm run build
   ```

2. Apply database migrations:
   ```bash
   cd server
   npx prisma migrate deploy
   npx prisma db seed
   ```

3. Start the server with PM2:
   ```bash
   cd server
   pm2 start ecosystem.config.cjs
   ```

4. Serve the client with Nginx using the provided `nginx.conf`, or use a static host.

5. Back up MySQL regularly:
   ```powershell
   .\backup-mysql.ps1 -Database claims_solutions -User root -Password ''
   ```

## Runbook Notes

- MySQL is the canonical data store. Run `backup-mysql.ps1` before any schema change.
- Uploaded files are stored in `server/uploads` by default; configure S3/Azure Blob by replacing `server/src/middleware/upload.js`.
- Default admin: `admin@optimum.com` / `ChangeMe123!` — change before production.
- JWT secret and database credentials must be set in `server/.env`.

## Workflow Architecture

The system uses a three-tier status model (see `docs/adr-004-18stage-workflow-historical-import.md`):

1. **18-stage ProcessStatus** (primary operational workflow):
   `NEW_CLAIM` → `CLAIM_ASSIGNED` → `INITIAL_REVIEW` → `CONTACTED_INSURED` → `SITE_INSPECTION_SCHEDULED` → `UNDER_INVESTIGATION` → `INSPECTION_COMPLETED` → `DOCUMENTS_REQUIRED` → `DOCUMENTS_RECEIVED` → `LOSS_ASSESSMENT` → `RESERVE_LOSS_ESTIMATE_PREPARED` → `REPORT_PREPARATION` → `REPORT_SUBMITTED` → `CLIENT_REVIEW` → `FURTHER_CLARIFICATION` → `ADJUSTMENT_COMPLETED` → `CLAIM_SETTLED` → `CLAIM_CLOSED`

2. **12-stage ImportStatus** (historical OCS source status, read-only):
   `AWAITING_DOCUMENTS`, `DOCUMENTS_UNDER_REVIEW`, `REPORT_UNDER_REVIEW`, `LETTER_REQUEST_UNDER_REVIEW`, `LETTER_AND_REPORT_UNDER_REVIEW`, `AWAITING_INSURER_INSTRUCTION`, `FOR_LETTER_OFFER`, `OFFER_DECLINED_REEVALUATION`, `FOR_CLOSING_AND_BILLING`, `FOR_CLOSING_WAIVED_BILLING`, `CLOSED`, `CANCELLED`

3. **ClaimStatus** (secondary internal status, read-only/action-driven)

### Claim Intake

Two intake modes are supported:
- **From Policy**: Full intake with existing policy, client, and insurer
- **Record Assignment**: Excel-style direct entry with OCS ref, insured name, and policy details

### Workbook Import

The importer parses all workbook sheets (active, closed, cancelled) and:
- Classifies sheets by type (ACTIVE/CLOSED/CANCELLED/LOOKUP)
- Infers both 18-stage primary and 12-stage historical status
- Marks closed/cancelled records as read-only
- Preserves raw source values and import provenance
- Supports Admin-only upload, parse, mapping, validation, commit, and rollback

### Read-Only Historical Records

Imported closed/cancelled claims are marked `isReadOnly = true` and cannot be edited or transitioned without an Admin override with a reason. The claim detail UI displays a banner for these records.

### Currency

All amounts are displayed in Philippine Peso (₱ / PHP). Monetary values are stored as exact Decimal-compatible strings, not floating-point.

## License

Proprietary — Claims Solutions Insurance Adjustment, Inc.
