# TypeScript Migration — Remaining JavaScript Sweep

## Phase 1: Client

### Task 1.1: Clean stale `.jsx` dashboard duplicates
- [ ] Delete `client/src/components/DashboardCharts.jsx`
- [ ] Delete `client/src/components/DashboardLists.jsx`
- [ ] Delete `client/src/components/DashboardWidgets.jsx`
- [ ] Verify `Dashboard.tsx` still resolves components with `.jsx` import specifiers

### Task 1.2: Migrate `client/src/services/search.service.js`
- [ ] Create `client/src/services/search.service.ts` with typed `searchAll` function and `SearchResponse` type
- [ ] Delete `client/src/services/search.service.js`
- [ ] Create `client/src/services/search.service.test.ts`
- [ ] Delete `client/src/services/search.service.test.js`
- [ ] Keep imports using `.js` extension

### Task 1.3: Migrate client ESLint config
- [ ] Create `client/eslint.config.ts`
- [ ] Delete `client/eslint.config.js`
- [ ] Add `jiti` to `client/package.json` devDependencies if needed

## Phase 2: Server Search Module

### Task 2.1: Migrate `server/src/services/search.service.js`
- [ ] Create `server/src/services/search.service.ts`
- [ ] Delete `server/src/services/search.service.js`
- [ ] Add types for `SearchFilters`, `SearchResult`, and `SearchGroups`

### Task 2.2: Migrate `server/src/controllers/search.controller.js`
- [ ] Create `server/src/controllers/search.controller.ts`
- [ ] Delete `server/src/controllers/search.controller.js`
- [ ] Add `Request`, `Response`, `NextFunction`, `AuthenticatedRequest` types

### Task 2.3: Migrate `server/src/routes/search.routes.js`
- [ ] Create `server/src/routes/search.routes.ts`
- [ ] Delete `server/src/routes/search.routes.js`

## Phase 3: Server Tests and Scripts

### Task 3.1: Remove stale `.js` test duplicates
- [ ] Delete `server/tests/dashboard.test.js`
- [ ] Delete `server/tests/file-path.test.js`
- [ ] Delete `server/src/utils/escape-html.js`

### Task 3.2: Migrate remaining server tests
- [ ] Create `server/tests/search.test.ts`
- [ ] Delete `server/tests/search.test.js`
- [ ] Create `server/tests/globalSetup.ts`
- [ ] Delete `server/tests/globalSetup.js`
- [ ] Create `server/tests/setup-test-env.ts`
- [ ] Delete `server/tests/setup-test-env.cjs`
- [ ] Update `server/package.json` Jest `globalSetup`, `setupFiles`, and `collectCoverageFrom`

### Task 3.3: Migrate server scripts
- [ ] Create `server/scripts/create-default-template.ts`
- [ ] Delete `server/scripts/create-default-template.js`
- [ ] Create `server/scripts/migrate-paths.ts`
- [ ] Delete `server/scripts/migrate-paths.mjs`

## Phase 4: Server Config

### Task 4.1: Prisma and ESLint configs
- [ ] Create `server/prisma.config.ts`
- [ ] Delete `server/prisma.config.js`
- [ ] Create `server/eslint.config.ts`
- [ ] Delete `server/eslint.config.js`
- [ ] Add `jiti` to `server/package.json` devDependencies if needed

### Task 4.2: PM2 ecosystem
- [ ] Verify `server/ecosystem.config.cjs` is still required by PM2
- [ ] Update `server/ecosystem.config.cjs` `script` path to `./dist/src/server.js`

## Phase 5: Verification

- [ ] `cd client && npm run typecheck`
- [ ] `cd client && npm run build`
- [ ] `cd client && npm run lint`
- [ ] `cd client && npx vitest run src/services/search.service.test.ts`
- [ ] `cd server && npx tsc --noEmit`
- [ ] `cd server && npm run lint`
- [ ] `cd server && npx jest --testPathPatterns=search`
- [ ] `cd server && npx jest --testPathPatterns=dashboard`
- [ ] `cd server && npx jest --testPathPatterns=file-path`
