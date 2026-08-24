# Claims Solutions / Optimum — Insurance Adjustment Management System

A greenfield React + Node.js + MySQL web application for managing insurance claims from assignment through closure.

## Quick Start

### Prerequisites

- [Node.js 22+](https://nodejs.org/)
- MySQL 8 or MariaDB (local install, XAMPP, WampServer, or any MySQL-compatible server)
- Git

### 1. Clone and install

```bash
git clone https://github.com/Jangwick/Optimum.git
cd Optimum
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

### 2. Configure environment

Copy the example environment files and update values, especially `DATABASE_URL` in `server/.env`:

```bash
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env` to point at your local database, for example:

```env
DATABASE_URL="mysql://root:yourpassword@localhost:3306/claims_solutions?schema=public"
```

### 3. Start your database

Create a database named `claims_solutions` and start your MySQL/MariaDB server. If you use Docker, the repo includes a compose file:

```bash
docker compose up -d
```

On Windows without Docker, options include the [MySQL Installer](https://dev.mysql.com/downloads/installer/), [MariaDB Installer](https://mariadb.org/download/), or [XAMPP](https://www.apachefriends.org/).

### 4. Generate the Prisma client

The server imports the generated Prisma client from a custom output path, so it must be generated before the server can start:

```bash
cd server
npx prisma generate
```

### 5. Apply migrations and seed

```bash
npx prisma migrate dev
npx prisma db seed
```

### 6. Run the dev servers

```bash
cd ..
npm run dev
```

This runs the API (`npm run dev` in `server/`) and the Vite client (`npm run dev` in `client/`) concurrently.

- Client: http://localhost:5173
- API: http://localhost:3001
- API health: http://localhost:3001/api/health

You can also run them in separate terminals:

```bash
cd server && npm run dev
cd client && npm run dev
```

### Note on `client/dist not found`

In development the Express server may print `client/dist not found`. This is expected — the dev client runs separately on port 5173. The server only serves the built client from `client/dist` when it exists, such as after `npm run build` in the client or in production.

## Project Structure

- `server/` — Express API, Prisma ORM, MySQL schema, tests
- `client/` — React 18 + Vite + Tailwind CSS v4 frontend
- `tasks/plan.md` and `tasks/todo.md` — implementation plan and task list
- `design.md` — design system source of truth
- `logo.png` — application brand logo

## Environment

Copy `.env.example` files to `.env` and fill in real values before running in production.

## Production Deployment

### Railway (recommended)

The project includes a `Dockerfile` and `railway.json` for one-click Railway deployment.

#### Steps

1. **Push your code to GitHub** (Railway deploys from a Git repo).

2. **Create a new project on Railway**:
   - Go to [railway.app](https://railway.app) and sign in.
   - Click **New Project** → **Deploy from GitHub repo**.
   - Select your repository.

3. **Add a MySQL database**:
   - In the Railway project, click **Add** → **Database** → **Add MySQL**.
   - Railway creates a MySQL instance and provides connection variables.

4. **Set environment variables** on the server service:
   - Go to your service → **Variables** tab.
   - Add the following (see `.env.railway.example` for reference):

   | Variable | Value |
   |----------|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `3001` (Railway auto-detects, but set explicitly) |
   | `DATABASE_URL` | Reference the MySQL addon's `MYSQL_URL` (Railway will suggest this) |
   | `JWT_SECRET` | Generate with `openssl rand -hex 32` |
   | `JWT_EXPIRES_IN` | `24h` |
   | `BCRYPT_ROUNDS` | `12` |
   | `UPLOAD_DIR` | `/tmp/uploads` |
   | `REPORT_DIR` | `/tmp/reports` |
   | `CLIENT_URL` | Your Railway public URL (e.g. `https://your-app.up.railway.app`) or `*` |

5. **Set a custom start command** (if not auto-detected from `railway.json`):
   ```
   sh -c "npx prisma migrate deploy && npx prisma db seed && node src/server.js"
   ```

6. **Deploy**:
   - Railway will build the Docker image, run Prisma migrations, seed the database, and start the server.
   - The Express server serves both the API (`/api/*`) and the built React client (all other routes).

7. **Generate a public domain**:
   - Go to your service → **Settings** → **Networking** → **Generate Domain**.
   - Update `CLIENT_URL` to match the generated domain.

8. **Login** with the default admin:
   - Email: `admin@optimum.com`
   - Password: `ChangeMe123!`
   - **Change the password immediately after first login.**

#### Notes

- Puppeteer/Chromium is installed in the Docker image for PDF report generation.
- File uploads are stored in `/tmp/uploads` (ephemeral). For persistent storage, configure an S3-compatible service and update `server/src/middleware/upload.js`.
- Railway's free tier provides limited hours. See [Railway pricing](https://railway.app/pricing) for details.

### Manual / VPS Deployment

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

## User Guide — Claims & Claim Details

A step-by-step procedure for using the Claims Registry and Claim Detail page.

### 1. Logging In

1. Open **http://localhost:5173** in your browser.
2. You will be redirected to the **Login page**.
3. Enter your credentials:
   - **Email**: `admin@optimum.com`
   - **Password**: `ChangeMe123!`
4. Click **Sign In**.
5. You will land on the **Dashboard**.

### 2. Claims Registry (`/claims`)

The Claims Registry is the master list of all claims in the system.

#### 2.1 Navigate to the Claims Registry
- Click **Claims** in the left sidebar, OR
- Click the **Claims** breadcrumb at the top.

#### 2.2 Summary Cards
At the top of the registry you will see four counters:

| Card | Meaning |
|---|---|
| **Total Claims** | Every claim in the system |
| **Active (Editable)** | Claims still being worked on (`isReadOnly = false`) |
| **Historical** | Closed / read-only claims |
| **Cancelled** | Claims marked as cancelled |

#### 2.3 View Tabs
Three tabs filter the table:
- **Active** — claims you can still edit (default)
- **Closed** — finished, read-only claims
- **Cancelled** — cancelled claims

#### 2.4 Search and Filter
- **Search box**: Type any keyword (claim number, insured name, insurer) to filter rows instantly.
- **Filter by process status**: Dropdown to show only claims at a specific 18-stage workflow stage (e.g. "New Claim", "Report Preparation", "Claim Closed").

#### 2.5 Columns and Pagination
- **Toggle columns** button: Show/hide table columns.
- **Rows per page** dropdown: Choose 10, 25, 50, or 100 rows per page.
- **Pagination buttons**: Move between pages if there are more claims than one page can show.

#### 2.6 Export the Registry
- Click **Export** to download the current filtered registry as a spreadsheet.

#### 2.7 View a Claim's Details
- Click the **View** button (eye icon) on any row to open that claim's full detail page.

### 3. Creating a New Claim

You can start a new claim from either the **Claims Registry** or the **Dashboard**.

#### 3.1 Open the New Claim Modal
- Click the **NEW CLAIM** button (top-right of Claims Registry or Dashboard).

#### 3.2 Choose an Intake Mode
The modal presents two options:

| Mode | When to use |
|---|---|
| **From Policy** | The claim is linked to an existing policy already in the system |
| **Record Assignment** | Direct, Excel-style entry — no policy needed (matches the old workbook flow) |

##### Option A: From Policy
1. Click **From Policy**.
2. **Policy & Parties** section:
   - Select a **Policy** from the dropdown (e.g. `POL-2026-0001 · XYZ Retail · Global Insurance`).
3. **Loss Information** section:
   - **Date of Loss** *(required)* — pick the date the loss occurred.
   - **Location** — where the loss happened.
   - **Estimated Loss** — initial peso estimate.
   - **Reserve** — reserve amount.
   - **Description** *(required)* — describe what happened.
4. **Assignments** section:
   - **Engineer** — select the assigned field engineer.
   - **Accountant** — select the assigned accountant.
5. Click **Create Claim**.

##### Option B: Record Assignment (Excel-style)
1. Click **Record Assignment**.
2. Fill in the direct-entry fields (OCS Ref #, insured, insurer, broker, dates, etc.) — these mirror the columns from the legacy Excel workbook.
3. Click **Create Claim**.

#### 3.3 After Creation
- The modal closes.
- You are automatically navigated to the new claim's **Claim Detail** page.
- The claim appears in the Claims Registry with status **New Claim**.
- A `CLAIM_CREATED` audit log entry is written.
- The Dashboard **Total Claims** count increases by 1.

### 4. Claim Detail Page (`/claims/:id`)

This is where the full lifecycle of a single claim is managed. It has **11 tabs**.

#### 4.1 Header Area
- **Back to Claims** button — return to the registry.
- **Claim number** (e.g. `CS-2026-0003`) and claim type.
- **Current process status pill** — colored badge showing the workflow stage.
- **Internal status** — the legacy internal status (ASSIGNED, INVESTIGATION, etc.).
- **Breadcrumbs** — Dashboard › Claims › [Claim Number].

#### 4.2 Tab 1: Summary
Read-only overview of the claim's master data.

- **Claim Summary**: OCS Ref #, Assignment #, Insurer Claim #, Handling Adjuster, Insured, Insurer, Broker, Policy No., Policy Type, Date of Loss, Nature of Loss, Location, Received, Date Inspected, Description.
- **Financial Summary**: Estimated Loss, Reserve, Claimed Amount, Proposed Settlement, Agreed Settlement (all in ₱).
- **Assignment**: Engineer, Accountant, Assigned By, Contact.
- **Update Status** panel (right side): Change the legacy internal status with notes.
- **Status History**: Timeline of past status transitions.

#### 4.3 Tab 2: Process Status
Advance the claim through the 18-stage workflow.

The 18 stages in order:
```
NEW_CLAIM → CLAIM_ASSIGNED → INITIAL_REVIEW → CONTACTED_INSURED →
SITE_INSPECTION_SCHEDULED → UNDER_INVESTIGATION → INSPECTION_COMPLETED →
DOCUMENTS_REQUIRED → DOCUMENTS_RECEIVED → LOSS_ASSESSMENT →
RESERVE_LOSS_ESTIMATE_PREPARED → REPORT_PREPARATION → REPORT_SUBMITTED →
CLIENT_REVIEW → FURTHER_CLARIFICATION → ADJUSTMENT_COMPLETED →
CLAIM_SETTLED → CLAIM_CLOSED
```

How to use it:
1. Select the next status from the dropdown (only allowed transitions are shown).
2. Add **Notes** explaining the transition.
3. Click **Update Status**.
4. The system:
   - Persists the new status to the database.
   - Creates a **status history** record.
   - Writes a `PROCESS_STATUS_CHANGED` **audit log**.
   - Sends **notifications** to the assigned Engineer and Accountant.
   - Updates the status pill in the header.

**Closing guards**: Before moving to `CLAIM_CLOSED`, the system checks that a submitted report exists and fee/invoice conditions are met. If not met, you must provide an **override reason**.

#### 4.4 Tab 3: Investigation
Record investigation findings and inspection details.

- Create / edit / delete investigation records.
- Record findings, dates, and notes.
- Upload inspection photos.
- Each action is audit-logged (`INVESTIGATION_CREATED`, `INSPECTION_PHOTO_UPLOADED`, etc.).

#### 4.5 Tab 4: Documents
Manage the document checklist and upload files.

- A **drag-and-drop dropzone** lets you upload files (click to select or drag files in).
- Documents are categorized (e.g. Police Report, Photos, Policy, etc.).
- Mark documents as **Received** once they arrive.
- Delete documents if needed.
- Each action is audit-logged (`DOCUMENT_UPLOADED`, `DOCUMENT_RECEIVED`, `DOCUMENT_DELETED`).

#### 4.6 Tab 5: Assessment
Record loss assessment and reserve / loss estimate details.

- Create assessment records with loss evaluation data.
- Set the reserve and estimated loss amounts.
- These values feed into the **Financial Summary** on the Summary tab.

#### 4.7 Tab 6: Settlement
Manage settlement records and offers.

- Create a settlement record for the claim.
- Add **offers** (proposed settlement amounts) with a maximum of ₱9,999,999,999,999.99.
- Record **offer responses** (accepted / rejected) with response metadata.
- Each action is audit-logged (`SETTLEMENT_SAVED`, `OFFER_CREATED`, `OFFER_RESPONDED`).
- Settlement must exist before the claim can move to `CLAIM_SETTLED`.

#### 4.8 Tab 7: Finance
Track fees, invoices, and payments (Accountant's workspace).

- **Fees**: Create fee records for the adjustment service.
- **Invoices**: Generate invoices for fees.
- **Payments**: Record payments received.
- Each action is audit-logged (`FEE_CREATED`, `INVOICE_CREATED`, `PAYMENT_RECORDED`).
- Fee / invoice conditions are checked by the closing guards before `CLAIM_CLOSED`.

#### 4.9 Tab 8: Reports
Generate, submit, and clarify reports.

- Create report drafts.
- Generate reports from Word / PDF templates.
- **Submit** reports to the client (required before closing).
- Create **clarifications** if the client has questions.
- **Answer** clarifications.
- Each action is audit-logged (`REPORT_GENERATED`, `CLARIFICATION_CREATED`, `CLARIFICATION_ANSWERED`).

#### 4.10 Tab 9: Insurer Panel
Manage insurer participation and financials for the claim.

- Add / update / remove insurers on the panel.
- Track each insurer's financial contribution.
- Each action is audit-logged (`CLAIM_INSURER_ADDED / UPDATED / REMOVED`).

#### 4.11 Tab 10: Timeline
Read-only chronological feed of everything that happened on the claim.

- Aggregates: process status history, activities, correspondence, document events, report events, settlement events.
- Filter by event type.
- This is the audit trail for the claim's lifecycle.

#### 4.12 Tab 11: Tasks
Create and track tasks related to the claim.

- Create tasks with: title, description, assigned to, priority (LOW / MEDIUM / HIGH), due date.
- Task status workflow: `PENDING` → `IN PROGRESS` → `COMPLETED`.
- Edit and delete tasks.
- Task counts feed into the Dashboard (**Open Tasks**, **Overdue**).

### 5. Full Claim Lifecycle (End-to-End)

| Step | Who | Where | What happens |
|---|---|---|---|
| 1 | Admin | Claims Registry / Dashboard | Click **NEW CLAIM**, fill in details, assign Engineer & Accountant |
| 2 | Admin | Claim Detail → Process Status | Move from `NEW_CLAIM` → `CLAIM_ASSIGNED` |
| 3 | Engineer | Investigation tab | Perform initial review, record findings |
| 4 | Admin / Engineer | Process Status | Move to `INITIAL_REVIEW` → `CONTACTED_INSURED` |
| 5 | Engineer | Investigation tab | Schedule inspection, upload photos |
| 6 | — | Process Status | Move to `SITE_INSPECTION_SCHEDULED` → `UNDER_INVESTIGATION` → `INSPECTION_COMPLETED` |
| 7 | Engineer | Documents tab | Request required documents, upload received docs, mark as received |
| 8 | — | Process Status | Move to `DOCUMENTS_REQUIRED` → `DOCUMENTS_RECEIVED` |
| 9 | Engineer | Assessment tab | Record loss assessment and reserve estimate |
| 10 | — | Process Status | Move to `LOSS_ASSESSMENT` → `RESERVE_LOSS_ESTIMATE_PREPARED` |
| 11 | Engineer | Reports tab | Prepare report draft, generate from template |
| 12 | — | Process Status | Move to `REPORT_PREPARATION` → `REPORT_SUBMITTED` |
| 13 | Admin | Process Status | Move to `CLIENT_REVIEW` |
| 14 | Admin | Reports tab | If client has questions, create clarification → answer it |
| 15 | — | Process Status | Move to `FURTHER_CLARIFICATION` → back to `CLIENT_REVIEW` |
| 16 | — | Process Status | Move to `ADJUSTMENT_COMPLETED` |
| 17 | Admin | Settlement tab | Create settlement record, add offers, record accepted offer |
| 18 | — | Process Status | Move to `CLAIM_SETTLED` (settlement guard checked) |
| 19 | Accountant | Finance tab | Record fees, create invoices, record payments |
| 20 | Admin | Process Status | Move to `CLAIM_CLOSED` (closing guards checked — report + fees) |
| 21 | System | Automatic | Claim becomes read-only, appears in **Closed** tab of Claims Registry |

### 6. Where Each Action Is Reflected

When you complete an action in any tab, the result shows up in:

| Location | What updates |
|---|---|
| **Current tab** | Immediate display of the saved data |
| **Summary tab** | Financial values, statuses, assignment info |
| **Process Status tab** | Status history timeline |
| **Timeline tab** | Chronological event feed |
| **Tasks tab** | Task list and counts |
| **Dashboard** | Total claims, financial aggregates, open / overdue tasks, recent activity |
| **Claims Registry** | Status pill color, Active / Closed / Cancelled tab placement |
| **Audit Logs** (`/audit-logs`) | Every mutation is logged with user, action, timestamp |
| **Database** | The source of truth — all data persists to MySQL |

## License

Proprietary — Claims Solutions Insurance Adjustment, Inc.
