# Home Page Design Specification

**Project:** JeffApp Portfolio  
**Component:** Home Page (Dashboard/Landing)  
**Designer:** GitHub Copilot  
**Date:** 2025-01-09  
**Status:** Ready for Architecture Review

---

## Design Overview

A modern, welcoming landing page that communicates Jeff's full-pipeline AI-forward capabilities with generous whitespace, startup energy, and professional polish. Features a full-bleed hero with geometric pattern, organized skill badges with hover interactions, and balanced CTAs for exploration and contact.

---

## 1. Hero Section

### Purpose

Create immediate impact and communicate core value proposition within 3 seconds of landing.

### Layout

**Desktop (≥1024px):**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FULL-BLEED GEOMETRIC PATTERN BACKGROUND              │
│                         (Abstract shapes, sapphire gradient)            │
│                                                                         │
│                                                                         │
│                    ┌────────────────────────────┐                       │
│                    │   FULL-PIPELINE AI-FORWARD │                       │
│                    │        ENGINEER            │                       │
│                    │                            │                       │
│                    │  Building scalable systems │                       │
│                    │  that solve real problems  │                       │
│                    │                            │                       │
│                    │  [Explore Work] [Contact]  │                       │
│                    └────────────────────────────┘                       │
│                         (Text block centered)                           │
│                    (Semi-transparent dark overlay)                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Mobile (<768px):**

- Same full-bleed pattern
- Text block takes full width with padding
- Buttons stack vertically
- Smaller typography scale

### Visual Specs

**Background Pattern:**

- **Type:** Abstract geometric shapes (overlapping circles, triangles, polygons)
- **Colors:** Gradient from `--color-sapphire-600` → `--color-amethyst-600`
- **Opacity:** Shapes at varying opacities (30%, 50%, 70%)
- **Animation:** Subtle floating animation (optional, CSS transform)
- **Fallback:** Solid gradient if pattern image unavailable

**Overlay:**

- Semi-transparent dark scrim: `rgba(15, 23, 42, 0.7)` (slate-900 @ 70%)
- Ensures text contrast meets WCAG AA (≥4.5:1)

**Headline:**

- **Text:** "Full-Pipeline AI-Forward Engineer"
- **Typography:**
  - Font: `--font-sans`
  - Size: `--font-size-5xl` (clamp 3rem → 4rem)
  - Weight: `--font-weight-extrabold` (800)
  - Color: `#ffffff`
  - Line height: `--line-height-tight` (1.25)
  - Text align: center
  - Letter spacing: `-0.02em` (tighter for large display text)

**Subheading:**

- **Text:** "Building scalable systems that solve real problems with adaptable, full-stack expertise"
- **Typography:**
  - Font: `--font-sans`
  - Size: `--font-size-xl` (1.25rem)
  - Weight: `--font-weight-normal` (400)
  - Color: `rgba(255, 255, 255, 0.9)`
  - Line height: `--line-height-relaxed` (1.75)
  - Text align: center
  - Max width: 600px (centered)

**CTA Buttons:**

- Positioned below subheading with `--space-8` (32px) gap
- Horizontal layout on desktop, stack on mobile
- Gap between buttons: `--space-4` (16px)

### Responsive Behavior

| Breakpoint          | Height                | Headline Size             | Button Layout        |
| ------------------- | --------------------- | ------------------------- | -------------------- |
| Mobile (<768px)     | 100vh (full viewport) | --font-size-3xl (30-36px) | Stacked, full width  |
| Tablet (768-1024px) | 80vh                  | --font-size-4xl (36-48px) | Horizontal, centered |
| Desktop (≥1024px)   | 80vh                  | --font-size-5xl (48-64px) | Horizontal, centered |

### Accessibility

- **Role:** `<section aria-label="Hero introduction">`
- **Heading hierarchy:** `<h1>` for headline, `<p>` for subheading
- **Contrast:** Text on dark overlay meets WCAG AA (≥4.5:1)
- **Focus states:** CTAs have visible focus rings (`--color-focus-ring`)
- **Alt text:** Background pattern decorative, use `role="presentation"`

---

## 2. About / Bio Section

### Purpose

Communicate who Jeff is, what he does, and the startup-minded ethos in 2-3 paragraphs.

### Layout

**Desktop:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                         [80px vertical space]                           │
│                                                                         │
│                    ┌────────────────────────────┐                       │
│                    │     Who I Am & What I Do   │                       │
│                    │                            │                       │
│                    │  [Paragraph 1: Intro]      │                       │
│                    │  [Paragraph 2: Value prop] │                       │
│                    │  [Paragraph 3: Ethos]      │                       │
│                    │                            │                       │
│                    └────────────────────────────┘                       │
│                      (Max width 700px, centered)                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Visual Specs

**Section Container:**

- Max width: 700px
- Margin: `0 auto`
- Padding: `--space-20` (80px) top, `--space-12` (48px) bottom
- Background: `--color-bg-primary` (white/dark mode bg)

**Section Heading (Optional):**

- If included: "Who I Am & What I Do" or skip entirely
- Typography: `--font-size-3xl`, `--font-weight-bold`, `--color-text-primary`
- Margin bottom: `--space-8` (32px)
- Text align: center

**Body Paragraphs:**

- **Typography:**
  - Font: `--font-sans`
  - Size: `--font-size-lg` (1.125rem)
  - Weight: `--font-weight-normal` (400)
  - Color: `--color-text-secondary`
  - Line height: `--line-height-relaxed` (1.75)
  - Text align: left (readability)
- **Spacing:** `--space-6` (24px) between paragraphs
- **Emphasis:** Use `<strong>` for key phrases, styled with `--font-weight-semibold` and `--color-text-primary`

### Content Guidance

**Paragraph 1:** Introduction (who you are, current focus)  
**Paragraph 2:** Value statement (problems solved, who you serve, differentiators)  
**Paragraph 3:** Startup ethos (adaptable, scrappy, full-pipeline, inclusive of established companies)

### Accessibility

- **Semantic HTML:** `<section>` with `<h2>` heading (if included) and `<p>` tags
- **No ARIA needed:** Semantic structure sufficient

---

## 3. Technical Skills Section

### Purpose

Showcase technical breadth and depth with organized, scannable skill categories using logo badges with hover interactions.

### Layout

**Desktop:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                         Technical Expertise                             │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  Frontend                                                        │  │
│  │  [Icon] [Icon] [Icon] [Icon] [Icon]                             │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  Backend                                                         │  │
│  │  [Icon] [Icon] [Icon] [Icon]                                    │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  [AI/ML category...]                                                    │
│  [Cloud & DevOps category...]                                           │
│  [Architecture category...]                                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Visual Specs

**Section Container:**

- Max width: 1200px (wider for grid)
- Margin: `0 auto`
- Padding: `--space-16` (64px) top/bottom
- Background: `--color-bg-secondary` (slate-50 / dark bg)

**Section Heading:**

- **Text:** "Technical Expertise"
- **Typography:**
  - Font: `--font-sans`
  - Size: `--font-size-4xl`
  - Weight: `--font-weight-bold`
  - Color: `--color-text-primary`
  - Text align: center
  - Margin bottom: `--space-12` (48px)

**Category Container:**

- Margin bottom: `--space-10` (40px)
- Padding: `--space-6` (24px)
- Background: `--color-bg-primary` (white cards on gray bg)
- Border: `1px solid --color-border-secondary`
- Border radius: `8px`
- Box shadow: `--shadow-sm` (subtle)

**Category Heading:**

- **Typography:**
  - Font: `--font-sans`
  - Size: `--font-size-xl`
  - Weight: `--font-weight-semibold`
  - Color: `--color-text-primary`
  - Margin bottom: `--space-4` (16px)

**Skill Badge (Icon + Label):**

**Default State:**

- **Container:**
  - Display: inline-flex
  - Align items: center
  - Gap: `--space-2` (8px)
  - Padding: `--space-3` (12px) `--space-4` (16px)
  - Border radius: `6px`
  - Background: transparent
  - Border: `1px solid --color-border-primary`
  - Transition: all 0.2s ease

- **Icon:**
  - Width/Height: 24px
  - Color: `--color-slate-600` (monochrome)
  - SVG preferred (scalable, small file size)

- **Label:**
  - Font: `--font-sans`
  - Size: `--font-size-sm` (0.875rem)
  - Weight: `--font-weight-medium`
  - Color: `--color-text-secondary`

**Hover State:**

- Background: `--color-bg-tertiary` (slate-100)
- Border color: `--color-sapphire-500`
- Icon color: `--color-sapphire-600` (color transition)
- Label color: `--color-text-primary` (darker)
- Transform: `translateY(-2px)`
- Box shadow: `--shadow-md`

**Focus State (keyboard):**

- Outline: `2px solid --color-focus-ring`
- Outline offset: `2px`

**Grid Layout:**

- Display: flex
- Flex wrap: wrap
- Gap: `--space-3` (12px)
- Justify content: flex-start

### Categories & Example Skills

1. **Frontend**
   - Angular, React, TypeScript, Stencil, Web Components, HTML5, CSS3, SCSS

2. **Backend**
   - Node.js, Express, Python, REST APIs, GraphQL

3. **AI/ML**
   - Prompt Engineering, RAG, LLM Integration, OpenAI API, Model Evaluation

4. **Cloud & DevOps**
   - GitHub Actions, CI/CD, Docker, Render, Nx Cloud, Webpack

5. **Architecture & Patterns**
   - Nx Monorepos, Microfrontends, TDD, Design Systems, Component Libraries

### Responsive Behavior

| Breakpoint          | Badge Size                         | Grid Columns      | Padding   |
| ------------------- | ---------------------------------- | ----------------- | --------- |
| Mobile (<768px)     | Smaller icons (20px), font-size-xs | Full width badges | --space-3 |
| Tablet (768-1024px) | Standard (24px), font-size-sm      | Wrap naturally    | --space-4 |
| Desktop (≥1024px)   | Standard (24px), font-size-sm      | Wrap naturally    | --space-4 |

### Accessibility

- **Semantic HTML:** `<section>`, category `<h3>`, badges as `<span>` or `<div>`
- **Icon alt text:** Include `aria-label` on icon or label text for screen readers
- **Keyboard navigation:** If badges are interactive (e.g., link to docs), ensure focusable with Tab
- **Color contrast:** Monochrome icons @ 4.5:1 contrast minimum

---

## 4. Featured Highlights Section

### Purpose

Showcase 2-3 professional accomplishments/highlights that demonstrate impact and range.

### Layout

**Desktop:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                       Professional Highlights                           │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  ▎ Led AI Integration for Enterprise Platform                   │  │
│  │    Built scalable RAG pipeline, reducing query time by 60%...   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  ▎ Designed Cross-Framework Component Library                   │  │
│  │    Shipped reusable Web Components used across 5 products...    │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  ▎ Built CI/CD Pipeline with 80% Test Coverage                  │  │
│  │    Automated deployments, reducing release time from days...    │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Visual Specs

**Section Container:**

- Max width: 900px
- Margin: `0 auto`
- Padding: `--space-16` (64px) top/bottom
- Background: `--color-bg-primary`

**Section Heading:**

- **Text:** "Professional Highlights"
- **Typography:**
  - Font: `--font-sans`
  - Size: `--font-size-4xl`
  - Weight: `--font-weight-bold`
  - Color: `--color-text-primary`
  - Text align: center
  - Margin bottom: `--space-12` (48px)

**Highlight Item:**

- **Container:**
  - Margin bottom: `--space-6` (24px)
  - Padding: `--space-6` (24px)
  - Border left: `4px solid --color-sapphire-600` (accent bar)
  - Background: `--color-bg-secondary` (subtle card bg)
  - Border radius: `0 8px 8px 0` (rounded right, square left for accent)
  - Transition: all 0.2s ease

- **Hover State (optional):**
  - Border left color: `--color-emerald-600`
  - Box shadow: `--shadow-sm`
  - Transform: `translateX(4px)`

**Title:**

- **Typography:**
  - Font: `--font-sans`
  - Size: `--font-size-xl`
  - Weight: `--font-weight-semibold`
  - Color: `--color-text-primary`
  - Margin bottom: `--space-2` (8px)

**Description:**

- **Typography:**
  - Font: `--font-sans`
  - Size: `--font-size-base`
  - Weight: `--font-weight-normal`
  - Color: `--color-text-secondary`
  - Line height: `--line-height-relaxed` (1.75)

### Content Guidance

Each highlight should include:

- **Title:** Short, punchy statement of accomplishment
- **Description:** 1-2 sentences explaining context, your role, and measurable outcome

**Placeholder Examples:**

1. "Led AI integration for enterprise platform — Built scalable RAG pipeline processing 10K+ queries/day, reducing response time by 60%"
2. "Designed cross-framework component library — Shipped reusable Web Components adopted across 5 products, improving consistency and dev velocity"
3. "Implemented CI/CD with 80% test coverage — Automated deployments and testing, reducing release cycle from days to hours"

### Accessibility

- **Semantic HTML:** `<section>`, `<h2>` for section heading, `<h3>` for highlight titles
- **List structure:** Consider `<ul>` with `<li>` for screen reader navigation
- **No ARIA needed:** Semantic structure sufficient

---

## 5. Call-to-Action Section

### Purpose

Drive balanced engagement: exploration of work/skills and direct contact.

### Layout

**Desktop:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                     Ready to Explore or Connect?                        │
│                                                                         │
│              Whether you're hiring, collaborating, or just              │
│              curious, I'd love to hear from you.                        │
│                                                                         │
│          [View Full Experience]  [Explore Components]  [Get in Touch]   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Visual Specs

**Section Container:**

- Max width: 800px
- Margin: `0 auto`
- Padding: `--space-16` (64px) top/bottom
- Background: `--color-bg-tertiary` (subtle contrast from main bg)
- Text align: center

**Heading:**

- **Text:** "Ready to Explore or Connect?"
- **Typography:**
  - Font: `--font-sans`
  - Size: `--font-size-3xl`
  - Weight: `--font-weight-bold`
  - Color: `--color-text-primary`
  - Margin bottom: `--space-4` (16px)

**Subtext:**

- **Typography:**
  - Font: `--font-sans`
  - Size: `--font-size-lg`
  - Weight: `--font-weight-normal`
  - Color: `--color-text-secondary`
  - Margin bottom: `--space-8` (32px)

**CTA Buttons:**

- Horizontal layout on desktop, wrap on tablet, stack on mobile
- Gap: `--space-4` (16px)
- Justify content: center

### Accessibility

- **Semantic HTML:** `<section>`, `<h2>` for heading
- **Button roles:** Ensure all CTAs are `<a>` or `<button>` with proper roles
- **Focus order:** Left to right, matches visual order

---

## 6. Footer

### Purpose

Provide contact info, social links, and navigation shortcuts.

### Layout

**Desktop:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ──────────────────────────────────────────────────────────────────────│
│                                                                         │
│  Jeff Crosley                     [GitHub]  [LinkedIn]                  │
│  jeff@example.com                                                       │
│                                                                         │
│  Home  |  About  |  Contact  |  Components                             │
│                                                                         │
│  © 2025 Jeff Crosley. All rights reserved.                             │
│  Last updated: [Date]                                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Visual Specs

**Footer Container:**

- Full width
- Padding: `--space-12` (48px) top/bottom, `--space-6` (24px) left/right
- Background: `--color-bg-elevated` (white in light mode, elevated dark in dark mode)
- Border top: `1px solid --color-border-secondary`

**Layout Grid:**

- Display: flex
- Justify content: space-between
- Align items: flex-start
- Wrap: wrap (mobile stack)

**Contact Info:**

- **Name:**
  - Font: `--font-sans`
  - Size: `--font-size-lg`
  - Weight: `--font-weight-semibold`
  - Color: `--color-text-primary`
- **Email:**
  - Font: `--font-sans`
  - Size: `--font-size-base`
  - Weight: `--font-weight-normal`
  - Color: `--color-link`
  - Hover: `--color-link-hover`

**Social Links:**

- Display: inline-flex
- Gap: `--space-4` (16px)
- **Icon buttons:**
  - Width/Height: 40px (min touch target)
  - Border radius: 50% (circular)
  - Background: transparent
  - Border: `1px solid --color-border-primary`
  - Icon color: `--color-text-secondary`
  - Hover: Background `--color-bg-tertiary`, Icon color `--color-sapphire-600`
  - Focus: Outline `2px solid --color-focus-ring`

**Navigation Links:**

- Display: flex
- Gap: `--space-4` (16px)
- Separator: `|` character
- **Link style:**
  - Font: `--font-sans`
  - Size: `--font-size-sm`
  - Weight: `--font-weight-medium`
  - Color: `--color-link`
  - Hover: `--color-link-hover`

**Copyright:**

- Font: `--font-sans`
- Size: `--font-size-xs`
- Weight: `--font-weight-normal`
- Color: `--color-text-muted`

### Responsive Behavior

| Breakpoint          | Layout                        | Social Position  | Nav Position  |
| ------------------- | ----------------------------- | ---------------- | ------------- |
| Mobile (<768px)     | Stack all sections vertically | Below contact    | Below social  |
| Tablet (768-1024px) | Flex wrap, 2 columns          | Right of contact | Below         |
| Desktop (≥1024px)   | Single row, space-between     | Right            | Center bottom |

### Accessibility

- **Semantic HTML:** `<footer>`, `<nav>` for links
- **Social icons:** `aria-label` on each (e.g., "GitHub profile", "LinkedIn profile")
- **External links:** `target="_blank"` with `rel="noopener noreferrer"`
- **Keyboard navigation:** All links focusable with visible focus states

---

## 7. Button Component Specifications

### Primary Button (Filled)

**Default State:**

- Background: `--color-button-primary-bg` (sapphire-600)
- Color: `--color-button-primary-text` (white)
- Padding: `--space-3` (12px) `--space-6` (24px)
- Border radius: `6px`
- Font size: `--font-size-base`
- Font weight: `--font-weight-semibold`
- Border: none
- Box shadow: `--shadow-sm`
- Transition: all 0.2s ease

**Hover State:**

- Background: `--color-button-primary-hover` (sapphire-500)
- Box shadow: `--shadow-md`
- Transform: `translateY(-1px)`

**Active State:**

- Background: `--color-button-primary-bg` (darker)
- Transform: `translateY(0)`

**Focus State:**

- Outline: `2px solid --color-focus-ring`
- Outline offset: `2px`

**Disabled State:**

- Background: `--color-slate-300`
- Color: `--color-text-disabled`
- Cursor: not-allowed
- Opacity: 0.6

### Secondary Button (Outlined)

**Default State:**

- Background: transparent
- Color: `--color-sapphire-600`
- Padding: `--space-3` (12px) `--space-6` (24px)
- Border radius: `6px`
- Font size: `--font-size-base`
- Font weight: `--font-weight-semibold`
- Border: `2px solid --color-sapphire-600`
- Transition: all 0.2s ease

**Hover State:**

- Background: `--color-sapphire-600`
- Color: white
- Border color: `--color-sapphire-600`

**Active State:**

- Background: `--color-sapphire-500`
- Border color: `--color-sapphire-500`

**Focus State:**

- Outline: `2px solid --color-focus-ring`
- Outline offset: `2px`

**Disabled State:**

- Border color: `--color-slate-300`
- Color: `--color-text-disabled`
- Cursor: not-allowed
- Opacity: 0.6

### Size Variants

| Variant          | Padding             | Font Size        | Min Height |
| ---------------- | ------------------- | ---------------- | ---------- |
| Small            | --space-2 --space-4 | --font-size-sm   | 36px       |
| Medium (default) | --space-3 --space-6 | --font-size-base | 44px       |
| Large            | --space-4 --space-8 | --font-size-lg   | 52px       |

### Accessibility

- **Touch targets:** Minimum 44px height (WCAG 2.1 AA)
- **Focus indicators:** Visible 2px outline
- **ARIA:** Use semantic `<button>` or `<a>` elements; no additional ARIA needed
- **Keyboard:** Enter/Space activates button

---

## 8. Design Tokens Reference

### Colors Used

| Token                    | Light Value | Dark Value | Usage                  |
| ------------------------ | ----------- | ---------- | ---------------------- |
| `--color-text-primary`   | slate-900   | white      | Headings, primary text |
| `--color-text-secondary` | slate-700   | slate-300  | Body text              |
| `--color-text-muted`     | slate-500   | slate-500  | Captions, meta         |
| `--color-bg-primary`     | white       | slate-900  | Main background        |
| `--color-bg-secondary`   | slate-50    | slate-800  | Section backgrounds    |
| `--color-bg-tertiary`    | slate-100   | slate-700  | Card backgrounds       |
| `--color-sapphire-600`   | #1e40af     | #3b82f6    | Primary brand          |
| `--color-emerald-600`    | #059669     | #10b981    | Accents, success       |
| `--color-border-primary` | slate-300   | slate-600  | Borders, dividers      |

### Spacing Used

- `--space-2` (8px): Tight gaps (icon-label)
- `--space-3` (12px): Badge gaps
- `--space-4` (16px): Button gaps, paragraph spacing
- `--space-6` (24px): Section padding, card padding
- `--space-8` (32px): Component gaps
- `--space-10` (40px): Category spacing
- `--space-12` (48px): Section heading margins
- `--space-16` (64px): Large section padding
- `--space-20` (80px): Hero to content gap

### Typography Used

- `--font-size-5xl`: Hero headline
- `--font-size-4xl`: Section headings
- `--font-size-3xl`: Sub-section headings
- `--font-size-xl`: Highlight titles, category headings
- `--font-size-lg`: Body large, CTA subtext
- `--font-size-base`: Body text, buttons
- `--font-size-sm`: Skill badges, footer links
- `--font-size-xs`: Copyright, meta

---

## 9. Responsive Breakpoints

| Breakpoint | Width      | Layout Changes                           |
| ---------- | ---------- | ---------------------------------------- |
| Mobile     | <768px     | Stack all, full-width CTAs, smaller type |
| Tablet     | 768-1024px | 2-column grids, wrap skill badges        |
| Desktop    | ≥1024px    | Multi-column, full layout, hover states  |

---

## 10. Accessibility Checklist

- [ ] Color contrast ≥4.5:1 for all text (WCAG AA)
- [ ] Focus indicators visible on all interactive elements
- [ ] Semantic HTML (`<section>`, `<h1>-<h6>`, `<nav>`, `<footer>`)
- [ ] Alt text for hero pattern (decorative, `role="presentation"`)
- [ ] ARIA labels for icon-only buttons (social links)
- [ ] Keyboard navigable (Tab order logical)
- [ ] Touch targets ≥44px (buttons, social icons)
- [ ] Heading hierarchy logical (no skipped levels)
- [ ] External links open in new tab with `rel="noopener noreferrer"`
- [ ] Dark mode tested for readability

---

## 11. Dark Mode Considerations

All design tokens automatically adapt via CSS custom properties. Specific notes:

- **Hero pattern:** Ensure geometric shapes visible in dark mode (adjust opacity/colors)
- **Text overlay:** Dark scrim remains at 70% opacity for consistency
- **Skill badges:** Border color adjusts to `--color-border-primary` (lighter in dark mode)
- **Shadows:** Use `rgba(0, 0, 0, X)` for light mode, `rgba(255, 255, 255, X)` for dark mode if needed

---

## 12. Performance Considerations

- **Hero image:** Optimize to <200KB (WebP format, responsive sizes)
- **Skill icons:** Use inline SVG or SVG sprites (avoid 20+ HTTP requests)
- **Fonts:** Subset font files, preload critical weights
- **Lazy loading:** Hero above fold loads immediately; defer below-fold images
- **Critical CSS:** Inline hero styles for faster FCP

---

## 13. Visual Mockup (ASCII)

**Full Page Layout (Desktop):**

```
┌───────────────────────────────────────────────────────────────────────────┐
│ ████████████████████ HERO SECTION (80vh) █████████████████████████████    │
│ ░░░░░░░░░░░░░░ Geometric Pattern Background ░░░░░░░░░░░░░░░░░░░░░        │
│                                                                           │
│                       FULL-PIPELINE AI-FORWARD                            │
│                              ENGINEER                                     │
│                                                                           │
│                 Building scalable systems that solve                      │
│                         real problems                                     │
│                                                                           │
│                  [Explore Work]    [Get in Touch]                         │
│                                                                           │
├───────────────────────────────────────────────────────────────────────────┤
│                          [80px whitespace]                                │
├───────────────────────────────────────────────────────────────────────────┤
│                         WHO I AM & WHAT I DO                              │
│                                                                           │
│  I'm a full-pipeline engineer who thrives in fast-moving environments... │
│  [Paragraph 2: Value proposition and unique perspective...]              │
│  [Paragraph 3: Startup ethos, adaptable, inclusive of all companies...]  │
│                                                                           │
├───────────────────────────────────────────────────────────────────────────┤
│                          [64px whitespace]                                │
├───────────────────────────────────────────────────────────────────────────┤
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│                       TECHNICAL EXPERTISE                                 │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Frontend                                                        │    │
│  │ [🅰️ Angular] [⚛️ React] [📘 TypeScript] [🔷 Stencil] [🌐 HTML5]│    │
│  └─────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Backend                                                         │    │
│  │ [🟢 Node.js] [🚂 Express] [🐍 Python] [📡 REST APIs]           │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│  [... AI/ML, Cloud & DevOps, Architecture categories ...]                │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
├───────────────────────────────────────────────────────────────────────────┤
│                          [64px whitespace]                                │
├───────────────────────────────────────────────────────────────────────────┤
│                       PROFESSIONAL HIGHLIGHTS                             │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ ▎Led AI Integration for Enterprise Platform                     │    │
│  │   Built scalable RAG pipeline, reducing query time by 60%...    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ ▎Designed Cross-Framework Component Library                     │    │
│  │   Shipped reusable Web Components used across 5 products...     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ ▎Built CI/CD Pipeline with 80% Test Coverage                    │    │
│  │   Automated deployments, reducing release time from days...     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
├───────────────────────────────────────────────────────────────────────────┤
│                          [64px whitespace]                                │
├───────────────────────────────────────────────────────────────────────────┤
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│                    Ready to Explore or Connect?                           │
│                                                                           │
│          Whether you're hiring, collaborating, or just curious,           │
│                      I'd love to hear from you.                           │
│                                                                           │
│       [View Experience]  [Explore Components]  [Get in Touch]             │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
├───────────────────────────────────────────────────────────────────────────┤
│ ──────────────────────────────────────────────────────────────────────── │
│  Jeff Crosley                             [GitHub]  [LinkedIn]            │
│  jeff@example.com                                                         │
│                                                                           │
│  Home  |  About  |  Contact  |  Components                               │
│                                                                           │
│  © 2025 Jeff Crosley. All rights reserved. Last updated: Jan 9, 2025     │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Handoff Notes

**For Architect:**

- Component structure: Single page component or composed sub-components?
- Integration with `@jeffapp/ui-components` for buttons (if exists, or build inline)
- Skill badge data structure: JSON file or hardcoded?
- Hero pattern: SVG asset or CSS gradient with pseudo-elements?
- Responsive strategy: CSS Grid + Flexbox, breakpoints in SCSS mixins

**For QA Coach:**

- Test hero contrast ratios in both themes
- Verify keyboard navigation order
- Test touch targets on mobile (≥44px)
- Validate skill badge hover states
- Check external link behavior (new tab, rel attributes)

**For Developer:**

- Use existing design tokens from `@jeffapp/design-tokens`
- Follow condensed page architecture (inline template + styles)
- Ensure dark mode compatibility via CSS custom properties
- Optimize hero image (WebP, responsive srcset)
- Implement lazy loading for below-fold skill icons

---

**Design Specification Complete. Ready for Architecture Review.**
