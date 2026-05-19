---
name: RetentionIQ
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#ca8100'
  on-tertiary-container: '#3e2400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

The design system is engineered for executive-level data storytelling, prioritizing clarity, speed, and analytical precision. It adopts a **Corporate Modern** aesthetic influenced by the high-density utility of developer tools and the polished finish of premium fintech platforms. 

The emotional response should be one of "effortless command"—complex churn and retention data should feel digestible and actionable. The interface utilizes a deep, nocturnal foundation to minimize eye strain during prolonged analysis, while using high-chroma accents to direct attention toward critical insights. 

**Core Principles:**
- **Density with Intent:** Information is packed efficiently but separated by rigorous whitespace to prevent cognitive overload.
- **Visual Veracity:** Subtle gradients and depth cues are used only to reinforce hierarchy, never as decoration.
- **Kinetic Feedback:** Transitions are short (150ms-200ms) to maintain a "fast-feeling" application experience.

## Colors

The palette is anchored in a multi-layered dark scheme. The primary background is the darkest value, with panels and containers stepping up in luminance to create a sense of physical stacking.

- **Primary (Indigo):** Used for primary actions, active states, and brand-critical data points.
- **Success (Emerald):** Reserved for positive growth trends, retention gains, and "Healthy" status indicators.
- **Warning/Danger (Amber/Rose):** High-contrast signals for churn alerts, data anomalies, or negative thresholds.
- **Neutral/Surface:** A range of deep navy-greys used to define the application's structure. Surface levels are defined by `#111827` for secondary containers and `#1E293B` for subtle borders.

Data visualization should use a distinct, high-contrast palette that remains legible against the `#111827` panel color.

## Typography

This design system utilizes a dual-font strategy. **Plus Jakarta Sans** is used for headlines and high-level metrics to provide a modern, premium character. **Inter** is the workhorse for all body text, inputs, and data tables due to its exceptional legibility in dark mode and high-density environments.

For mobile devices, `display-lg` scales down to 36px and `headline-lg` scales to 28px. 

All tabular data and numerical figures should use tabular lining (monospaced numbers) to ensure columns of data align perfectly for visual comparison.

## Layout & Spacing

The system employs a **12-column fluid grid** for dashboard views, with a maximum content width of 1440px for standard reporting pages. 

- **Sidebar:** Fixed at 260px for desktop, collapsing to an icon-only rail (64px) or hidden behind a hamburger menu on mobile.
- **Dashboards:** Use a "bento-box" layout where widgets span 3, 4, 6, or 12 columns.
- **Vertical Rhythm:** A strict 4px base unit ensures alignment across disparate components like charts and tables.

On mobile devices, the 12-column grid collapses to a single column, and internal padding within cards is reduced from `lg` (24px) to `md` (16px) to maximize screen real estate.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layering** and **Low-Contrast Outlines**.

1.  **Level 0 (Base):** `#0F172A` - The canvas.
2.  **Level 1 (Cards/Panels):** `#111827` - Primary surface for content. Features a 1px border of `#1E293B`.
3.  **Level 2 (Dropdowns/Modals):** `#1E293B` - Elevated surfaces. These utilize "Deep Shadows": a 15% opacity black shadow with a 24px blur and 12px offset to create a distinct sense of floating.

Backdrop blurs (12px) are applied to sticky navigation headers and modal overlays to maintain context while focusing the user's attention.

## Shapes

The design system uses an approachable but structured corner radius. 
- **Standard Components:** Buttons, Input fields, and Tags use a `0.5rem` (8px) radius.
- **Containers:** Dashboard widgets and main content panels use `rounded-xl` (1.5rem / 24px) to create a soft, modern container feel that contrasts with the technical data inside.
- **Selection Indicators:** Active states in the sidebar or segmented controls use a `0.375rem` (6px) radius for a sharper, more precise look.

## Components

### Buttons
- **Primary:** Solid Indigo `#6366F1` with white text. Subtle inner-glow on hover.
- **Secondary:** Ghost style with `#1E293B` border and white text.
- **Tertiary:** Pure ghost, no border, Indigo text for "quiet" actions.

### Data Cards
- Must include a `title-md` header.
- Use a `1px` top-border of the accent color (Indigo/Emerald/Rose) to categorize the metric type at a glance.

### Input Fields
- Background: `#0F172A` (inset look).
- Border: `#334155` on rest, `#6366F1` on focus.
- Typography: `body-md`.

### Status Chips
- Semi-transparent backgrounds (10% opacity of the status color) with high-contrast text and a center-aligned dot icon.

### Data Tables
- Row height: 52px.
- Borderless rows, using a subtle `#1E293B` zebra stripe or hover-state highlight.
- Header text: `label-md` in uppercase with 0.05em letter spacing for a professional, "report" feel.