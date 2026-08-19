---
name: Optimum Assurance Desktop
colors:
  surface: '#f9f9fc'
  surface-dim: '#d9dadd'
  surface-bright: '#f9f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f6'
  surface-container: '#edeef1'
  surface-container-high: '#e8e8eb'
  surface-container-highest: '#e2e2e5'
  on-surface: '#1a1c1e'
  on-surface-variant: '#454651'
  inverse-surface: '#2f3133'
  inverse-on-surface: '#f0f0f3'
  outline: '#767683'
  outline-variant: '#c6c5d3'
  surface-tint: '#4958ab'
  primary: '#102175'
  on-primary: '#ffffff'
  primary-container: '#2b3a8c'
  on-primary-container: '#9ba9ff'
  inverse-primary: '#bac3ff'
  secondary: '#bc0100'
  on-secondary: '#ffffff'
  secondary-container: '#e1291a'
  on-secondary-container: '#fffbff'
  tertiary: '#5a0f00'
  on-tertiary: '#ffffff'
  tertiary-container: '#811b00'
  on-tertiary-container: '#ff9075'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dee0ff'
  primary-fixed-dim: '#bac3ff'
  on-primary-fixed: '#00105c'
  on-primary-fixed-variant: '#303f91'
  secondary-fixed: '#ffdad4'
  secondary-fixed-dim: '#ffb4a8'
  on-secondary-fixed: '#410000'
  on-secondary-fixed-variant: '#930100'
  tertiary-fixed: '#ffdad2'
  tertiary-fixed-dim: '#ffb4a2'
  on-tertiary-fixed: '#3c0700'
  on-tertiary-fixed-variant: '#8a1d00'
  background: '#f9f9fc'
  on-background: '#1a1c1e'
  surface-variant: '#e2e2e5'
  accent-orange: '#f26522'
  sidebar-bg: '#1a2456'
  success-green: '#28a745'
  surface-border: '#e2e2e5'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  sidebar-width: 260px
  sidebar-collapsed: 72px
  gutter: 24px
  margin-desktop: 32px
  row-height-dense: 40px
  row-height-standard: 56px
  container-gap: 24px
---

## Brand & Style

This design system is engineered for a professional, data-rich desktop insurance adjustment environment. The brand personality is **authoritative, systemic, and high-performance**. It adapts the core institutional identity of the existing mobile-first system into a robust workstation experience, prioritizing the efficient processing of complex claims.

The visual style is **Corporate / Modern** with a focus on functional density. It utilizes a structured sidebar-navigation model to maximize horizontal real estate for expansive data tables and multi-step adjustment forms. The aesthetic is characterized by sharp information hierarchy, a "Safety First" UI philosophy that prioritizes critical claim statuses, and a sophisticated use of tonal layering to distinguish complex data modules without visual clutter.

**Core Values:**
- **Institutional Trust:** A primary navy foundation suggests stability and regulatory compliance.
- **Operational Velocity:** Layouts optimized for rapid scanning and keyboard-centric data entry.
- **Clarity under Pressure:** High-contrast signaling for urgent claims and financial discrepancies.

## Colors

The palette leverages the core brand navy as a dominant anchor for the professional desktop environment. 

- **Primary (Navy - #2b3a8c):** Used for key structural elements, active navigation states, and primary call-to-action buttons. On desktop, a darker variant (`sidebar-bg`) is used for the persistent navigation rail to provide a strong visual frame.
- **Secondary (Vibrant Red - #bc0100):** Strictly reserved for high-priority alerts, overdue claims, and critical errors.
- **Tertiary (Orange/Coral):** Used for warnings, in-progress indicators, and secondary data highlights.
- **Neutral (Cool Gray):** A sophisticated range of cool-toned grays provides the background for data-heavy surfaces, ensuring primary colors retain their semantic meaning.

Color is applied with a semantic-first logic: Navy represents the system/institution, Red represents immediate action, and Orange represents transitions or cautions.

## Typography

**Hanken Grotesk** serves as the primary typeface, optimized for its geometric clarity and legibility at smaller sizes in data tables. Its professional character is essential for the desktop application's institutional feel.

**JetBrains Mono** is utilized for technical data points, including Claim IDs, policy numbers, currency amounts, and timestamps. The monospaced nature of the font ensures vertical alignment in large data grids, allowing adjusters to scan numerical discrepancies with precision.

On desktop, line heights are tightened slightly for `body-sm` to support high-density information displays without sacrificing readability. Headlines use a tighter letter-spacing to maintain a modern, "compact" editorial aesthetic.

## Layout & Spacing

The layout utilizes a **Fixed Sidebar / Fluid Content** model. The sidebar remains the primary navigation anchor, while the main content area adjusts to fill the remaining screen real estate, ensuring full visibility of large-scale tables and adjustment dashboards.

- **Grid Model:** A 12-column fluid grid system within the content area.
- **Sidebar:** Fixed at 260px for high-level navigation, collapsible to 72px for "Focus Mode" during complex document reviews.
- **Density:** The system supports a "Dense" mode for expert users, where table row heights drop to 40px and internal padding is halved.
- **Breakpoints:**
  - **Desktop Large (1440px+):** 12-column, 32px margins.
  - **Desktop Standard (1200px):** 12-column, 24px margins.
  - **Tablet (Navigation collapses):** 8-column, 16px margins.

## Elevation & Depth

In a professional data-rich application, depth is used to indicate context rather than decoration. This design system uses **Tonal Layers** and **Low-Contrast Outlines** to maintain a clean, flat architecture.

- **Layer 0 (App Shell):** The persistent navigation and background use `#f9f9fc`.
- **Layer 1 (Workspace):** Data cards and table containers use white surfaces with a 1px `surface-border` (`#e2e2e5`). 
- **Layer 2 (Overlays):** Tooltips and dropdown menus use a subtle 4px blur shadow with a 5% primary-tinted opacity to distinguish them from the workspace.
- **Modals:** Use a centered position with a 16px diffused shadow and a high-opacity neutral backdrop to force focus.

Interactions (hover) on table rows or menu items are indicated by a subtle background shift to `#f3f3f6` rather than an increase in shadow.

## Shapes

The shape language is **Soft (0.25rem)** to reflect the precision of an insurance adjustment tool. 

- **Inputs and Buttons:** 4px radius provides a structured, professional appearance.
- **Cards and Large Containers:** Use `rounded-lg` (8px) to subtly differentiate major interface sections from individual components.
- **Status Pills:** Fully rounded (pill-shaped) to distinguish them from interactive buttons.
- **Data Selection:** Multi-select checkboxes use a 2px radius to feel distinct from circular radio buttons.

## Components

### Sidebar Navigation
The sidebar uses the `sidebar-bg` (#1a2456) with a high-contrast white text for active states. Icons should be line-style and 20px in size. Active navigation items include a 4px primary-blue vertical "active" bar on the left edge.

### Data Tables
The core of the desktop experience.
- **Headers:** Sticky positioning, background `#eeeef0`, using `label-md` uppercase typography.
- **Action Cells:** Right-aligned icon buttons for "Edit," "View," or "Download."
- **Status Indicators:** Use the "Status Pills" with low-opacity background tints (e.g., 10% opacity Red for "Overdue").

### Metric Cards
Dashboard components that display high-level stats. These feature a 4px colored "top-cap" border to semantically categorize the metric (Navy for total, Orange for pending, Red for critical).

### Form Fields
Desktop inputs use a fixed-height of 40px. Labels are positioned above the field in `body-sm` bold. Active states are indicated by a 2px Primary Navy border.

### Buttons
- **Primary:** Solid Navy with white text.
- **Secondary:** Outlined Navy with 1px border.
- **Utility:** Ghost buttons (no border/background) for less frequent actions like "Cancel" or "Clear Filters."