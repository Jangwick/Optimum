# Implementation Plan: Responsive Design Across All Devices

## Overview

Make the Optimum Claims system fully responsive from mobile phones (< 768px) through tablets (768-1024px) to desktop (1024px+). The current system is desktop-only: a fixed 260px sidebar, fixed-width search dropdowns, non-scrollable tables, and form grids that don't collapse on small screens.

## Architecture Decisions

1. **Mobile-first sidebar pattern**: Hide the fixed sidebar on mobile (< 1024px) and show it as a slide-in drawer triggered by a hamburger menu in the TopBar. On desktop (>= 1024px), keep the current fixed sidebar. This is the most common and reliable pattern for admin dashboards.

2. **Shared layout component**: Extract the repeated `flex h-screen overflow-hidden bg-background` + `Sidebar` + `ml-[260px]` + `TopBar` + `main` shell into a single `AppLayout` component. Every page currently duplicates this structure. A shared component ensures responsive behavior is applied consistently and reduces duplication across 9+ pages.

3. **Tailwind v4 breakpoints (default)**: Use Tailwind's built-in breakpoints (`sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`). No custom breakpoints needed. The sidebar collapses at `lg` (1024px) since tablet users still benefit from a drawer.

4. **DataTable horizontal scroll**: Wrap tables in `overflow-x-auto` so wide tables scroll horizontally on mobile rather than breaking layout. This is simpler than column-hiding and preserves all data.

5. **Modal responsive sizing**: All modals use `max-w-[95vw]` on mobile and their current max-width on `sm:` and above. The Modal component already has this for `size="full"` — extend it to all sizes.

6. **Form grids**: Change all bare `grid-cols-2` and `grid-cols-3` to `grid-cols-1 sm:grid-cols-2` and `grid-cols-1 md:grid-cols-3` respectively. This is a one-class-per-grid change with no logic impact.

7. **No bottom navigation**: The sidebar drawer pattern is sufficient. Bottom nav adds complexity and duplicates navigation. Keep it simple.

## Breakpoint Strategy

| Breakpoint | Width | Behavior |
|-----------|-------|----------|
| Mobile (default) | < 640px | Single column, sidebar hidden (drawer), compact spacing, horizontal scroll tables |
| `sm` | >= 640px | Two-column forms, search visible, slightly larger touch targets |
| `md` | >= 768px | Summary cards in 3-4 columns, filter grids multi-column |
| `lg` | >= 1024px | Fixed sidebar visible, full desktop layout, 3-column detail grids |
| `xl` | >= 1280px | Current desktop behavior unchanged |

## Task List

### Phase 1: Foundation — Shared Layout & Mobile Sidebar

- [ ] Task 1: Create AppLayout component with responsive sidebar
- [ ] Task 2: Add mobile hamburger menu and sidebar drawer to TopBar
- [ ] Task 3: Migrate all pages to use AppLayout

### Checkpoint: Foundation
- [ ] Sidebar shows as drawer on mobile, fixed on desktop
- [ ] All pages render without layout errors
- [ ] Lint passes, tests pass

### Phase 2: Core Components — Tables, Modals, Forms

- [ ] Task 4: Make DataTable horizontally scrollable on mobile
- [ ] Task 5: Make Modal responsive across all sizes
- [ ] Task 6: Fix form grids in NewClaim, EditClaimModal, ClaimFinance, Employees
- [ ] Task 7: Make TopBar search responsive

### Checkpoint: Core Components
- [ ] Tables scroll horizontally on mobile
- [ ] Modals fit mobile screens
- [ ] Forms stack to single column on mobile
- [ ] Search doesn't overflow on mobile

### Phase 3: Page-Level Polish

- [ ] Task 8: Responsive padding and spacing across all pages
- [ ] Task 9: Responsive Claim Detail tabs and summary grid
- [ ] Task 10: Responsive Pagination component
- [ ] Task 11: Responsive Reports charts and grids

### Checkpoint: Complete
- [ ] All acceptance criteria met
- [ ] Tested on mobile (375px), tablet (768px), desktop (1440px)
- [ ] Lint passes, tests pass, build succeeds
- [ ] No console errors in browser

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Sidebar drawer z-index conflicts with Select portal (z-9999) | Med | Use z-30 for drawer overlay, Select portal stays at z-9999 |
| Breaking existing tests that query sidebar elements | Med | Keep sidebar DOM present but hidden on mobile (CSS, not conditional render) |
| Modal scroll behavior on iOS Safari | Low | Use `max-h-[90vh] overflow-y-auto` which works on iOS |
| Table horizontal scroll UX on mobile | Low | Add `-webkit-overflow-scrolling: touch` for smooth scrolling |
| Performance impact of re-renders from window resize listener | Low | Debounce resize handler in Select component |

## Open Questions

- Should the sidebar auto-close when navigating to a new page on mobile? (Assumed yes — standard behavior)
- Should there be a swipe-to-open gesture for the mobile drawer? (Assumed no — hamburger button is sufficient, keeps it simple)
- Should tables hide less-important columns on mobile? (Assumed no — horizontal scroll is simpler and preserves all data)
