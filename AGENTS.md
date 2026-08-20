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
- Repo plan: `tasks/plan.md`
- Task list: `tasks/todo.md`

## Tech Stack (MVP)

- React 18 + Vite 6 + Tailwind CSS 4
- Node.js 22 + Express 4
- MySQL 8 + Prisma 7
- JWT + bcrypt, Multer, docxtemplater, puppeteer, exceljs