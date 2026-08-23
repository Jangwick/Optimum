# Responsive Design Task List

## Phase 1: Foundation — Shared Layout & Mobile Sidebar

### Task 1: Create AppLayout component with responsive sidebar
- [ ] Create `client/src/components/AppLayout.jsx`
- [ ] Extract the shared shell: `flex h-screen overflow-hidden` + Sidebar + content area + TopBar + main
- [ ] Sidebar: `hidden lg:flex` on mobile (hidden), `fixed w-[260px]` on desktop
- [ ] Content area: `lg:ml-[260px]` (no margin on mobile, 260px on desktop)
- [ ] Add mobile drawer state: when open, show sidebar as `fixed inset-y-0 left-0 w-[260px] z-40` with overlay
- [ ] Drawer overlay: `fixed inset-0 bg-black/50 z-30` (click to close)
- [ ] Auto-close drawer on route change (use `useLocation`)

**Acceptance criteria:**
- AppLayout renders sidebar + topbar + children
- Sidebar is hidden on screens < 1024px
- Sidebar is visible on screens >= 1024px
- Drawer opens/closes via a prop callback
- Clicking overlay closes the drawer

**Verification:**
- Lint passes
- Existing tests still pass
- Browser: sidebar hidden at 375px, visible at 1440px

**Dependencies:** None
**Files:** `client/src/components/AppLayout.jsx` (new)
**Estimated scope:** Small (1 file)

---

### Task 2: Add mobile hamburger menu and sidebar drawer to TopBar
- [ ] Add hamburger button (Menu icon from lucide-react) visible only on mobile: `lg:hidden`
- [ ] Wire hamburger click to call `onMenuClick` prop (passed from AppLayout)
- [ ] Make global search responsive: `w-32 sm:w-64` (narrow on mobile, full on sm+)
- [ ] Make search dropdown responsive: `min-w-[280px] sm:min-w-[320px] max-w-[400px]` and `right-0` so it doesn't overflow left
- [ ] Hide breadcrumb text on very small screens: `hidden sm:flex` for breadcrumb nav
- [ ] Add `onMenuClick` prop to TopBar component

**Acceptance criteria:**
- Hamburger menu visible only on screens < 1024px
- Clicking hamburger opens the sidebar drawer
- Search dropdown doesn't overflow viewport on mobile
- Breadcrumbs hidden on very small screens

**Verification:**
- Lint passes
- Browser: hamburger visible at 375px, hidden at 1440px
- Browser: search dropdown fits within viewport at 375px

**Dependencies:** Task 1
**Files:** `client/src/components/TopBar.jsx`
**Estimated scope:** Small (1 file)

---

### Task 3: Migrate all pages to use AppLayout
- [ ] Replace the duplicated layout shell in each page with `<AppLayout>...</AppLayout>`
- [ ] Pages to migrate: Dashboard, Claims, ClaimDetail, Reports, MasterData, Employees, AuditLogs, NewClaim
- [ ] Remove the `flex h-screen overflow-hidden` + `Sidebar` + `ml-[260px]` + `TopBar` + `main` wrapper from each page
- [ ] Keep page-specific content inside `<AppLayout>` as children
- [ ] Remove unused Sidebar/TopBar imports from pages

**Acceptance criteria:**
- All 8 pages use AppLayout
- No page has a hardcoded `ml-[260px]` or `w-[260px]`
- No page directly imports Sidebar or TopBar
- Layout is consistent across all pages

**Verification:**
- Lint passes
- All tests pass
- Browser: every page renders correctly at 375px and 1440px
- No console errors

**Dependencies:** Task 1, Task 2
**Files:** `Dashboard.jsx`, `Claims.jsx`, `ClaimDetail.jsx`, `Reports.jsx`, `MasterData.jsx`, `Employees.jsx`, `AuditLogs.jsx`, `NewClaim.jsx`
**Estimated scope:** Medium (8 files, mechanical changes)

---

### Checkpoint: Foundation
- [ ] Sidebar shows as drawer on mobile, fixed on desktop
- [ ] All pages render without layout errors
- [ ] `npm run lint` passes
- [ ] `npm test` passes (18/18)

---

## Phase 2: Core Components — Tables, Modals, Forms

### Task 4: Make DataTable horizontally scrollable on mobile
- [ ] Wrap the `<table>` in a `<div className="overflow-x-auto">` container
- [ ] Add `min-w-[600px]` to the table element so it has a minimum width before scrolling
- [ ] Add `-webkit-overflow-scrolling: touch` for iOS smooth scrolling (via inline style or Tailwind)
- [ ] Reduce cell padding on mobile: `px-3 py-2 sm:px-4 sm:py-3`

**Acceptance criteria:**
- Tables with many columns scroll horizontally on mobile
- Table doesn't shrink columns to unusable widths
- Cell padding is compact on mobile, normal on desktop

**Verification:**
- Lint passes
- Browser: Claims table scrolls horizontally at 375px
- Browser: table columns are readable at 375px

**Dependencies:** Task 3
**Files:** `client/src/components/DataTable.jsx`
**Estimated scope:** Small (1 file)

---

### Task 5: Make Modal responsive across all sizes
- [ ] Change all modal size classes to include mobile fallback:
  - `sm`: `max-w-[95vw] sm:max-w-md`
  - `md`: `max-w-[95vw] sm:max-w-lg`
  - `lg`: `max-w-[95vw] sm:max-w-2xl`
  - `xl`: `max-w-[95vw] sm:max-w-4xl`
  - `full`: `max-w-[95vw]` (already done)
- [ ] Ensure all modals have `max-h-[90vh] overflow-y-auto` for vertical scrolling on mobile
- [ ] Add `mx-4` horizontal margin so modal doesn't touch screen edges on mobile

**Acceptance criteria:**
- All modal sizes fit within 95vw on mobile
- Modals scroll vertically if content is too tall
- Modal has 16px margin from screen edges on mobile

**Verification:**
- Lint passes
- Browser: NewClaimModal fits at 375px
- Browser: EditClaimModal fits at 375px
- Browser: ConfirmDialog fits at 375px

**Dependencies:** None (independent of layout)
**Files:** `client/src/components/Modal.jsx`
**Estimated scope:** Small (1 file)

---

### Task 6: Fix form grids in NewClaim, EditClaimModal, ClaimFinance, Employees
- [ ] `NewClaim.jsx`: Change all `grid-cols-2` to `grid-cols-1 sm:grid-cols-2`
- [ ] `EditClaimModal.jsx`: Change all `grid-cols-2` to `grid-cols-1 sm:grid-cols-2`
- [ ] `ClaimFinance.jsx`: Change `grid-cols-3` to `grid-cols-1 md:grid-cols-3` (summary cards)
- [ ] `Employees.jsx`: Change `grid-cols-2` (form sections) to `grid-cols-1 sm:grid-cols-2`
- [ ] `InitialInvestigation.jsx`: Change `grid-cols-2` (line 201) to `grid-cols-1 sm:grid-cols-2`

**Acceptance criteria:**
- All form grids stack to single column on mobile (< 640px)
- Forms are readable and usable on mobile
- No layout overflow

**Verification:**
- Lint passes
- Browser: NewClaim form stacks at 375px
- Browser: EditClaimModal form stacks at 375px
- Browser: ClaimFinance summary cards stack at 375px

**Dependencies:** Task 5 (for modals to be responsive first)
**Files:** `NewClaim.jsx`, `EditClaimModal.jsx`, `ClaimFinance.jsx`, `Employees.jsx`, `InitialInvestigation.jsx`
**Estimated scope:** Medium (5 files, class changes only)

---

### Task 7: Make TopBar search responsive
- [ ] Global search input: `w-32 sm:w-48 lg:w-64` (narrow on mobile, wider on desktop)
- [ ] Search results dropdown: `w-[280px] sm:w-[320px] max-w-[calc(100vw-2rem)]` (fits any screen)
- [ ] Position dropdown with `right-0` so it grows leftward from the search button
- [ ] Hide global search on very small screens (< 640px), show a search icon button that expands it

**Acceptance criteria:**
- Search input doesn't overflow on mobile
- Search dropdown fits within viewport on all screen sizes
- Search is usable on mobile (either visible or expandable)

**Verification:**
- Lint passes
- Browser: search fits at 375px
- Browser: search dropdown doesn't overflow at 375px

**Dependencies:** Task 2
**Files:** `client/src/components/TopBar.jsx`
**Estimated scope:** Small (1 file)

---

### Checkpoint: Core Components
- [ ] Tables scroll horizontally on mobile
- [ ] Modals fit mobile screens
- [ ] Forms stack to single column on mobile
- [ ] Search doesn't overflow on mobile
- [ ] `npm run lint` passes
- [ ] `npm test` passes

---

## Phase 3: Page-Level Polish

### Task 8: Responsive padding and spacing across all pages
- [ ] Change bare `p-6` to `p-4 sm:p-6 md:p-8` in: ClaimDetail, AuditLogs, NewClaim
- [ ] Ensure all pages use consistent responsive padding
- [ ] Reduce gap values on mobile where `gap-6` is used: `gap-4 sm:gap-6`

**Acceptance criteria:**
- All pages have comfortable padding on mobile (16px) and desktop (32px)
- No content touches screen edges
- Spacing is consistent across pages

**Verification:**
- Lint passes
- Browser: pages have 16px padding at 375px

**Dependencies:** Task 3
**Files:** `ClaimDetail.jsx`, `AuditLogs.jsx`, `NewClaim.jsx`, `Dashboard.jsx`, `Claims.jsx`, `Reports.jsx`
**Estimated scope:** Small (6 files, class changes only)

---

### Task 9: Responsive Claim Detail tabs and summary grid
- [ ] Tab bar: already has `overflow-x-auto` — verify it works well on mobile
- [ ] Summary grid: `grid-cols-1 lg:grid-cols-3` — already responsive, verify
- [ ] Workflow progress bar: make it scrollable or wrap on mobile
- [ ] Financial summary: ensure it stacks on mobile
- [ ] Status update form: ensure it's usable on mobile

**Acceptance criteria:**
- Claim Detail is fully usable on mobile
- Tabs are scrollable horizontally
- All summary sections stack vertically on mobile
- Workflow progress doesn't overflow

**Verification:**
- Lint passes
- Browser: Claim Detail usable at 375px

**Dependencies:** Task 3, Task 8
**Files:** `client/src/pages/ClaimDetail.jsx`
**Estimated scope:** Small (1 file)

---

### Task 10: Responsive Pagination component
- [ ] Change layout to `flex flex-col sm:flex-row items-center sm:justify-between gap-2`
- [ ] Stack rows-per-page and page navigation vertically on mobile
- [ ] Reduce spacing on mobile

**Acceptance criteria:**
- Pagination stacks vertically on mobile
- All controls are accessible on mobile
- No overflow

**Verification:**
- Lint passes
- Browser: pagination stacks at 375px

**Dependencies:** None
**Files:** `client/src/components/Pagination.jsx`
**Estimated scope:** Small (1 file)

---

### Task 11: Responsive Reports charts and grids
- [ ] Verify charts use `ResponsiveContainer` (already done per audit)
- [ ] Ensure chart heights are reasonable on mobile: `h-64 sm:h-80` (shorter on mobile)
- [ ] Verify metric cards grid: `grid-cols-1 md:grid-cols-4` — already responsive
- [ ] Verify chart cards grid: `grid-cols-1 lg:grid-cols-2` — already responsive
- [ ] Ensure report tables have `overflow-x-auto`

**Acceptance criteria:**
- Charts render at readable height on mobile
- All grids stack on mobile
- Tables scroll horizontally

**Verification:**
- Lint passes
- Browser: Reports page usable at 375px

**Dependencies:** Task 3, Task 8
**Files:** `client/src/pages/Reports.jsx`
**Estimated scope:** Small (1 file)

---

### Checkpoint: Complete
- [ ] All acceptance criteria met
- [ ] Tested on mobile (375px), tablet (768px), desktop (1440px)
- [ ] `npm run lint` passes
- [ ] `npm test` passes (18/18)
- [ ] `npm run build` succeeds
- [ ] No console errors in browser
- [ ] Ready for review
