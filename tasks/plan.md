# (COMPLETED) Implementation Plan: Remaining JavaScript to TypeScript Sweep

## Overview

This sweep was completed on the `feature/typescript-migration-and-dockerization` branch. All source and tests are now `.ts` / `.tsx`. The remaining `.js` / `.jsx` / `.mjs` files and stale `.js` duplicates have been removed or migrated. This file is kept for historical reference; the active plan is `C:\Users\mikmikk03\.devin\plans\analyze-and-optimize-codebase.md`.

## Master Plan

For full context see `C:\Users\mikmikk03\.devin\plans\plan-typescript-and-docker.md`.

## Scope

### Client

- Delete stale `.jsx` duplicates of already-typed dashboard components (`DashboardCharts`, `DashboardLists`, `DashboardWidgets`). Keep the existing `.tsx` versions; do not change `.jsx` import specifiers because Vite + TypeScript `moduleResolution: Bundler` resolves them.
- Migrate `client/src/services/search.service.js` → `search.service.ts` and `search.service.test.js` → `search.service.test.ts`.
- Migrate `client/eslint.config.js` → `client/eslint.config.ts` (requires `jiti` for ESLint 9 to load TS config in Node).

### Server

- Delete stale `.js` duplicates of already-typed files (`server/src/utils/escape-html.js`, `server/tests/dashboard.test.js`, `server/tests/file-path.test.js`).
- Create typed `.ts` files for the remaining JS modules:
  - `server/src/services/search.service.ts`
  - `server/src/controllers/search.controller.ts`
  - `server/src/routes/search.routes.ts`
  - `server/tests/search.test.ts`
  - `server/tests/globalSetup.ts`
  - `server/tests/setup-test-env.ts` (replaces `.cjs`)
  - `server/scripts/create-default-template.ts`
  - `server/scripts/migrate-paths.ts`
- Migrate `server/prisma.config.js` → `prisma.config.ts`.
- Migrate `server/eslint.config.js` → `server/eslint.config.ts`.
- Update `server/package.json` Jest `globalSetup`, `setupFiles`, and `collectCoverageFrom` paths.
- Keep `server/ecosystem.config.cjs` as PM2's ecosystem file format; only fix the `script` path to point to the compiled `dist/src/server.js`.

### Tooling

- Add `jiti` to `devDependencies` in `client/package.json` and `server/package.json` so ESLint 9 can load `eslint.config.ts`.
- Confirm all `tsconfig.json` `allowJs` settings remain compatible with the removed files.

## Verification

- `cd client && npm run typecheck`
- `cd client && npm run build`
- `cd client && npm run lint`
- `cd client && npx vitest run src/services/search.service.test.ts`
- `cd server && npx tsc --noEmit`
- `cd server && npm run lint`
- `cd server && npx jest --testPathPatterns=search`
- `cd server && npx jest --testPathPatterns=dashboard`
- `cd server && npx jest --testPathPatterns=file-path`

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Deleting `.jsx` duplicate while `.jsx` imports remain | Med | Vite Bundler resolution resolves `.jsx` specifiers to `.tsx`; verify with `npm run build` before commit. |
| `eslint.config.ts` not loaded without `jiti` | High | Add `jiti` to devDependencies; confirm `npm run lint` in both workspaces. |
| Jest `setupFiles` / `globalSetup` break after extension change | Med | Update `server/package.json` Jest config and run targeted server tests. |
| `ecosystem.config.cjs` left as only non-TS file | Low | It is a PM2 config boundary and remains valid; path fixed to built output. |

## Notes

- This plan supersedes the stale `tasks/plan.md` responsive-design plan, which referenced files that no longer exist (e.g. `client/src/components/AppLayout.jsx`).
- Import specifiers keep the existing `.js` / `.jsx` extensions because `server/tsconfig.json` uses `moduleResolution: NodeNext` and `client/tsconfig.json` uses `moduleResolution: Bundler`; the actual source files change extension only.
