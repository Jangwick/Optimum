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

## Security & Secure Coding

Security is a constraint on every line that touches user data, authentication, files, or external input. Current hardening plan: `C:\Users\mikmikk03\.devin\plans\plan-security-hardening.md`.

- **Treat all external input as untrusted.** Validate route parameters and body fields at the boundary; cast `id` params with `Number` and reject `NaN`; never trust client-supplied mimetypes or file extensions.
- **Contain all file paths.** Resolve stored paths only under `UPLOAD_DIR` and `REPORT_DIR`; reject absolute paths and `..` traversal before `fs.readFileSync` or `res.sendFile`.
- **Authenticate and authorize every route.** Use `authMiddleware` on all `/api` routes except `/api/health`; apply `requireRole` or a `canAccessClaim(user, claimId)` check before mutating nested resources.
- **Keep secrets out of code and logs.** Use environment variables for `JWT_SECRET`, `DATABASE_URL`, and bcrypt rounds; do not log tokens, passwords, or full request bodies.
- **Use cryptographically secure randomness.** Use `crypto.randomBytes` or the installed `nanoid` for passwords, tokens, and nonces; never use `Math.random()` for security-sensitive values.
- **Secure the auth cookie.** The `token` cookie must be `httpOnly`, `secure` in production, and `sameSite='lax'`; clear it with the same options and `maxAge: 0`. Avoid returning the JWT in JSON or storing it in `localStorage`; if a query-string token is required for binary downloads, restrict it to those specific GET routes.
- **Rate-limit auth endpoints.** Apply `express-rate-limit` to `POST /api/auth/login` and `POST /api/auth/me/password` with a stricter limit than the global API rate limit.
- **Escape output before rendering.** HTML-escape all user-controlled values before inserting them into report PDF templates or DOCX placeholders; encode filenames in `Content-Disposition` headers.
- **Run targeted tests.** After security changes, run only the relevant test files (e.g., `auth.test.js`, `claim.test.js`, `discussion-note.test.js`) instead of the full suite.