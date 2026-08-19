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

## License

Proprietary — Claims Solutions Insurance Adjustment, Inc.
