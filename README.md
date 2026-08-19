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

## License

Proprietary — Claims Solutions Insurance Adjustment, Inc.
