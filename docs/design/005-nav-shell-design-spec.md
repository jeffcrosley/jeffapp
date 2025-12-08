# Design Specification: Navigation Shell & Feature Status

**Date:** 2025-01-18  
**Component:** Navigation Shell (app.ts, navigation-drawer.component.ts)  
**Related ADR:** [ADR 005](../adr/005-feature-status-visibility.md)

---

## 1. Component: Navigation Drawer

### Purpose

Provides responsive navigation that adapts from a mobile overlay drawer to a persistent desktop sidebar, with integrated feature status badges indicating WIP and Beta features.

### Visual Overview

#### Desktop View (≥1024px)

```
┌──────────────────────────────────────────────┐
│ 🌙 Theme Toggle                              │ ← Header (56px)
├──────────────┬─────────────────────────────┤
│              │                             │
│ Jeff Crosley │      Main Content Area      │
│              │      (Router Outlet)        │
│ ─────────────┤                             │
│ • Home       │                             │
│ • About      │                             │
│ • Comp 🚧    │                             │
│ • GitHub     │                             │
│              │                             │
│              │                             │
└──────────────┴─────────────────────────────┘
   280px          Flexible Width
```

**Layout:**

- **Header:** 56px height, fixed at top
- **Drawer:** 280px wide, persistent, left-aligned, extends from header to viewport bottom
- **Main:** Flexible width (full viewport width minus 280px), scrollable
- **No layout shift:** Drawer is always part of layout flow on desktop

#### Mobile View (<1024px, Closed)

```
┌──────────────────────────────┐
│ 🌙 ☰ Theme + Hamburger Menu  │ ← Header (56px)
├──────────────────────────────┤
│                              │
│      Main Content Area       │
│      (Router Outlet)         │
│                              │
│                              │
└──────────────────────────────┘
   Full Width
```

**Layout:**

- **Header:** 56px height, fixed at top, contains theme toggle + hamburger
- **Drawer:** Hidden (off-screen, slides in on demand)
- **Main:** Full viewport width

#### Mobile View (<1024px, Open)

```
┌──────────────────────────────┐
│ 🌙 ☰ Theme + Hamburger Menu  │ ← Header
├──────────────────────────────┤
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ ← Backdrop (40% opacity)
│ ┌────────────────┐░░░░░░░░░░│
│ │ Jeff Crosley   │░░░░░░░░░░│
│ │ ────────────   │░░░░░░░░░░│
│ │ • Home         │░░░░░░░░░░│
│ │ • About        │░░░░░░░░░░│
│ │ • Comp 🚧      │░░░░░░░░░░│
│ │ • GitHub       │░░░░░░░░░░│
│ │                │░░░░░░░░░░│
│ └────────────────┘░░░░░░░░░░│
└──────────────────────────────┘
   280px drawer     Main content
```

**Layout:**

- **Drawer:** 280px wide, overlays content from left edge
- **Backdrop:** Full viewport, semi-transparent overlay beneath drawer
- **Main:** Visible behind backdrop (no scroll, interaction blocked by backdrop)
- **Header:** Still visible above backdrop

---

## 2. Component: Header

### Dimensions

- **Height:** 56px (uses `--spacing-md * 7` = 7rem from base 8px)
- **Padding:** `--spacing-md` (1rem) horizontal, centered vertically
- **Background:** `var(--color-bg-primary)`
- **Border:** 1px solid `var(--color-border-subtle)`
- **Position:** Fixed, top of viewport, `z-index: 100`

### Layout

```
┌─────────────────────────────────────┐
│ [Gap] 🌙 [Flex: 1] [Hamburger] [Gap]│
└─────────────────────────────────────┘
```

**Grid/Flex:**

- Display: flex
- Justify-content: space-between
- Align-items: center
- Padding: 0 var(--spacing-md)

### Elements

#### Theme Toggle Button

**States:**

| State        | Background               | Icon Color             | Border                    |
| ------------ | ------------------------ | ---------------------- | ------------------------- |
| Default      | `--color-bg-hover`       | `--color-text-primary` | none                      |
| Hover        | `--color-primary`        | `--color-bg-primary`   | none                      |
| Focus        | `--color-primary`        | `--color-bg-primary`   | 2px solid `--color-focus` |
| Active/Click | `--color-primary-active` | `--color-bg-primary`   | none                      |

**Dimensions:**

- Width/Height: 44px (consistent hit target)
- Border-radius: 50% (circular button)
- Font-size: 1.25rem
- Cursor: pointer

**Accessibility:**

- `aria-label="Toggle theme (currently light)"` (updates dynamically)
- Focusable (tab order)
- Keyboard: Space/Enter to activate

**Icon:**

- SVG: Sun icon for light theme, Moon icon for dark theme
- Fill: Inherit from text color
- Transition: `color 200ms ease-in-out`

#### Hamburger Menu Button (Mobile Only)

**Display:** None on desktop (≥1024px), block on mobile (<1024px)

**States:**

| State        | Background               | Icon Color             | Border                    |
| ------------ | ------------------------ | ---------------------- | ------------------------- |
| Default      | `--color-bg-hover`       | `--color-text-primary` | none                      |
| Hover        | `--color-primary`        | `--color-bg-primary`   | none                      |
| Focus        | `--color-primary`        | `--color-bg-primary`   | 2px solid `--color-focus` |
| Active/Click | `--color-primary-active` | `--color-bg-primary`   | none                      |
| Menu Open    | `--color-primary`        | `--color-bg-primary`   | none (stays pressed)      |

**Dimensions:**

- Width/Height: 44px
- Border-radius: 4px
- Font-size: 1.5rem
- Cursor: pointer

**Icon:**

- Text character "☰" (hamburger) OR SVG lines
- Transition: Optional animated hamburger-to-X (advanced, can defer)

**Accessibility:**

- `aria-label="Toggle navigation menu"`
- `aria-expanded="false"` (updates when drawer opens)
- Focusable (tab order)
- Keyboard: Space/Enter to activate, Esc to close drawer

---

## 3. Component: Navigation Drawer

### Dimensions & Positioning

| Aspect                | Value                       |
| --------------------- | --------------------------- |
| Width                 | 280px (fixed)               |
| Position (Desktop)    | Absolute/Sticky, left: 0    |
| Position (Mobile)     | Fixed, left: 0, translate-x |
| Z-index (Mobile Open) | 1000 (above backdrop 900)   |
| Z-index (Desktop)     | Unset (part of flow)        |
| Background            | `var(--color-bg-secondary)` |
| Top (Mobile)          | 56px (below header)         |
| Height                | calc(100vh - 56px)          |
| Overflow-y            | auto (scrollable if needed) |
| Scrollbar             | Thin, styled                |

### Drawer Header Section

**Content:** "Jeff Crosley" portfolio title

**Dimensions:**

- Padding: `--spacing-lg` (1.5rem) horizontal, `--spacing-md` (1rem) vertical
- Border-bottom: 1px solid `var(--color-border-subtle)`

**Typography:**

- Element: `<h1 class="portfolio-title">`
- Font-size: 1.25rem (`--font-size-lg`)
- Font-weight: `--font-weight-bold` (600)
- Color: `var(--color-text-primary)`
- Letter-spacing: -0.5px (slight tightening for elegance)
- Margin: 0 (no extra spacing)

### Navigation Links Section

**Container:**

- Padding: `--spacing-md` (1rem) on all sides
- Margin: 0

**Link List (`<ul class="nav-links">`):**

```html
<ul class="nav-links">
  <li>
    <a href="/home" class="nav-link active"> Home </a>
  </li>
  <li>
    <a href="/about" class="nav-link"> About </a>
  </li>
  <li>
    <a href="/components" class="nav-link feature-wip">
      Components
      <span class="feature-badge">🚧 WIP</span>
    </a>
  </li>
  <li>
    <a href="https://github.com/..." class="nav-link" target="_blank"> GitHub </a>
  </li>
</ul>
```

**List Styling:**

- List-style: none
- Padding: 0
- Margin: 0

**Link Item (`<li>`):**

- Margin: `--spacing-sm` (0.5rem) 0
- Padding: 0

#### Nav Link States

**HTML Structure:**

```html
<a class="nav-link [feature-wip|feature-beta] [active]" href="...">
  Label Text
  <span class="feature-badge">🚧 WIP</span>
</a>
```

**Default State:**

- Display: flex
- Align-items: center
- Justify-content: space-between
- Padding: `--spacing-sm` (0.5rem) `--spacing-md` (1rem)
- Border-radius: 4px
- Color: `var(--color-text-secondary)`
- Text-decoration: none
- Font-size: 1rem
- Font-weight: 500
- Transition: all 200ms `--ease-smooth`
- Cursor: pointer
- Gap: `--spacing-sm` (0.5rem) between text and badge

**Hover State:**

- Background: `var(--color-bg-hover)`
- Color: `var(--color-text-primary)`
- Padding-left: calc(var(--spacing-md) + 4px) (subtle indent on hover)

**Focus State:**

- Background: `var(--color-bg-hover)`
- Color: `var(--color-text-primary)`
- Outline: 2px solid `var(--color-focus)`
- Outline-offset: -2px

**Active State** (current route via `routerLinkActive`)

- Class: `.active`
- Background: `var(--color-primary-faint)` (10% opacity of primary)
- Color: `var(--color-primary)`
- Border-left: 3px solid `var(--color-primary)`
- Padding-left: calc(var(--spacing-md) - 3px) (account for border)
- Font-weight: 600

**WIP State** (feature-wip class)

- Base appearance unchanged (no color tint)
- Badge text: "🚧 WIP"
- Optional: Subtle animation pulse (defer if time constraint)

**Beta State** (feature-beta class)

- Base appearance unchanged (no color tint)
- Badge text: "🧪 Beta"
- Optional: Subtle animation pulse (defer if time constraint)

### Feature Badge Styling

**Container:** `<span class="feature-badge">`

**Dimensions & Spacing:**

- Display: inline-block
- White-space: nowrap
- Padding: 2px 6px
- Border-radius: 3px
- Font-size: 0.75rem (`--font-size-sm`)
- Font-weight: 600
- Letter-spacing: 0.5px

**Styling by Status:**

| Status | Background              | Text Color        | Border                      |
| ------ | ----------------------- | ----------------- | --------------------------- |
| WIP    | `--color-warning-faint` | `--color-warning` | 1px solid `--color-warning` |
| Beta   | `--color-info-faint`    | `--color-info`    | 1px solid `--color-info`    |

**Light Theme (Example):**

- WIP: bg: #fff3e0 (warm yellow), text: #f57c00 (orange), border: #f57c00
- Beta: bg: #e3f2fd (cool blue), text: #1976d2 (blue), border: #1976d2

**Dark Theme (Example):**

- WIP: bg: #4d2e00 (dark orange), text: #ffb74d (light orange), border: #ffb74d
- Beta: bg: #1a3a52 (dark blue), text: #64b5f6 (light blue), border: #64b5f6

**Animations (Optional, Can Defer):**

- Pulse: Subtle opacity fade (0.7 → 1 → 0.7) every 2s using `--duration-slow` animations

---

## 4. Component: Backdrop Overlay (Mobile Only)

**Display:** None on desktop, visible on mobile when drawer is open

**Properties:**

| Property     | Value                              |
| ------------ | ---------------------------------- |
| Position     | Fixed                              |
| Top          | 0                                  |
| Left         | 0                                  |
| Width        | 100vw                              |
| Height       | 100vh                              |
| Z-index      | 900 (below drawer 1000)            |
| Background   | `rgba(0, 0, 0, 0.4)` (40% opacity) |
| Cursor       | pointer                            |
| Opacity Anim | 0 → 1 over 300ms on open           |

**Interaction:**

- Click on backdrop closes drawer
- Prevents interaction with main content while drawer is open

**Accessibility:**

- No semantic role (purely visual)
- Click handler triggers `drawer.close()`

---

## 5. Animations & Transitions

### Drawer Slide Animation (Mobile)

**Trigger:** Hamburger clicked → drawer opens

**Duration:** `var(--duration-normal)` = 300ms

**Easing:** `var(--ease-smooth)` = cubic-bezier(0.4, 0, 0.2, 1)

**Property:** `transform: translateX(-280px)` → `translateX(0)`

**Performance:** Uses `will-change: transform` on drawer to enable GPU acceleration

### Drawer Close Animation (Mobile)

**Trigger:** Backdrop clicked OR Esc pressed OR link clicked

**Duration:** 200ms (faster, more snappy)

**Easing:** `var(--ease-smooth)`

**Property:** `transform: translateX(0)` → `translateX(-280px)`

### Backdrop Fade Animation

**Open:** Opacity 0 → 1 over 300ms

**Close:** Opacity 1 → 0 over 200ms

### Link Hover Animation

**Trigger:** Mouse enter on nav link

**Duration:** 200ms

**Properties:**

- Background color fade
- Padding adjustment (subtle 4px indent)
- Text color fade

---

## 6. Responsive Breakpoints

### Mobile (<1024px)

```scss
// Drawer styling
.nav-drawer {
  position: fixed;
  left: 0;
  top: 56px;
  transform: translateX(-100%);
  width: 280px;

  &.open {
    transform: translateX(0);
  }
}

.hamburger {
  display: block;
}

.backdrop {
  display: block;
}
```

### Desktop (≥1024px)

```scss
// Drawer part of layout flow
.app-container {
  display: flex;
  gap: 0;
}

.nav-drawer {
  position: relative;
  left: auto;
  top: auto;
  transform: none;
  width: 280px;
  flex-shrink: 0;
  border-right: 1px solid var(--color-border-subtle);
}

.main-content {
  flex: 1;
  overflow-y: auto;
}

.hamburger {
  display: none;
}

.backdrop {
  display: none;
}
```

---

## 7. CSS Classes Reference

### Root Element Classes

| Class                          | Purpose                                      | Mobile           | Desktop          |
| ------------------------------ | -------------------------------------------- | ---------------- | ---------------- |
| `.app-container`               | Flex wrapper for drawer + main               | flex column      | flex row         |
| `.nav-drawer`                  | Navigation drawer container                  | fixed overlay    | relative sidebar |
| `.drawer-header`               | Title section of drawer                      | Always visible   | Always visible   |
| `.drawer-nav`                  | Navigation list container                    | Always visible   | Always visible   |
| `.nav-links`                   | Unordered list of links                      | -                | -                |
| `.nav-link`                    | Individual navigation link                   | -                | -                |
| `.nav-link.active`             | Current route link                           | -                | -                |
| `.feature-badge`               | WIP/Beta badge inline element                | -                | -                |
| `.feature-wip`                 | Class on `<a>` when status='wip'             | -                | -                |
| `.feature-beta`                | Class on `<a>` when status='beta'            | -                | -                |
| `.backdrop`                    | Semi-transparent overlay                     | hidden / visible | hidden           |
| `.hamburger`                   | Mobile menu button                           | block            | none             |
| `.nav-drawer.open`             | Drawer state when open (mobile)              | translateX(0)    | N/A              |
| `.main-content.overlay-active` | Main content state when drawer open (mobile) | lower z-index    | N/A              |

### Additional States

| Class                  | When Applied      | Effect                   |
| ---------------------- | ----------------- | ------------------------ |
| `[data-theme="dark"]`  | Dark mode active  | Apply dark theme colors  |
| `[data-theme="light"]` | Light mode active | Apply light theme colors |

---

## 8. Color Tokens (From Design System)

### Primary Palette

```scss
// Light Theme
--color-primary: #007bff; // Sapphire
--color-primary-faint: rgba(0, 123, 255, 0.1);
--color-primary-active: #0056b3; // Darker sapphire
--color-text-primary: #1a1a1a; // Near-black
--color-text-secondary: #666666; // Gray
--color-bg-primary: #ffffff; // White
--color-bg-secondary: #f5f5f5; // Off-white
--color-bg-hover: #eeeeee; // Light gray
--color-border-subtle: #e0e0e0; // Light border
--color-focus: #ff6b00; // Orange (high contrast)

// Status Colors
--color-warning: #f57c00; // Orange (WIP)
--color-warning-faint: rgba(245, 124, 0, 0.1);
--color-info: #1976d2; // Blue (Beta)
--color-info-faint: rgba(25, 118, 210, 0.1);

// Dark Theme (inverted)
--color-text-primary: #f5f5f5;
--color-text-secondary: #b0b0b0;
--color-bg-primary: #1e1e1e;
--color-bg-secondary: #2d2d2d;
--color-bg-hover: #3a3a3a;
--color-border-subtle: #444444;
```

---

## 9. Typography

### Font Family

```scss
--font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
```

### Font Sizes

| Use Case                        | Size    | Token              |
| ------------------------------- | ------- | ------------------ |
| Portfolio Title (drawer header) | 1.25rem | `--font-size-lg`   |
| Nav Link Label                  | 1rem    | `--font-size-base` |
| Feature Badge Text              | 0.75rem | `--font-size-sm`   |

### Font Weights

| Use             | Weight | Token                  |
| --------------- | ------ | ---------------------- |
| Portfolio title | 600    | `--font-weight-bold`   |
| Nav link        | 500    | `--font-weight-medium` |
| Badge text      | 600    | `--font-weight-bold`   |

---

## 10. Spacing Reference

```scss
--spacing-sm: 0.5rem; // 8px
--spacing-md: 1rem; // 16px
--spacing-lg: 1.5rem; // 24px
```

**Application:**

- Header padding: horizontal `--spacing-md`
- Drawer header padding: `--spacing-lg` horizontal, `--spacing-md` vertical
- Nav section padding: `--spacing-md` all sides
- Link item padding: `--spacing-sm` vertical, `--spacing-md` horizontal
- Badge padding: 2px 6px (custom, outside token system)

---

## 11. Accessibility Requirements

### Keyboard Navigation

- **Tab Order:** Theme toggle → Hamburger (mobile) → Nav links (in order)
- **Enter/Space:** Activate buttons and links
- **Esc:** Close drawer (mobile)
- **Tab (while drawer open):** Focus remains within drawer
- **Arrow Down/Up (optional):** Navigate between links (defer if time constraint)

### ARIA Labels & Attributes

| Element            | Attribute       | Value                                          |
| ------------------ | --------------- | ---------------------------------------------- |
| Theme button       | `aria-label`    | "Toggle theme (currently light)" or "...dark)" |
| Hamburger button   | `aria-label`    | "Toggle navigation menu"                       |
| Hamburger button   | `aria-expanded` | "false" / "true" (updates with drawer state)   |
| Drawer (`<aside>`) | `role`          | (implicit via `<aside>`)                       |
| Drawer header      | `role`          | (implicit via `<h1>`)                          |
| Backdrop           | `role`          | (not needed, purely visual)                    |

### Focus Management

- Focus visible: 2px solid outline using `--color-focus` (orange for high contrast)
- Outline-offset: -2px (inset for compact appearance)
- Focus trap: When drawer open on mobile, Tab cycles within drawer only

### Screen Reader Announcements

- Status badges announce as part of link text: "Components, 🚧 WIP"
- External links: Optionally add `aria-label="GitHub (opens in new window)"`

### Color Contrast

**Minimum WCAG AA (4.5:1 for text):**

- Text on primary button hover: `--color-bg-primary` on `--color-primary` ✓ (7:1+)
- Active link text: `--color-primary` on `--color-bg-primary` ✓ (6:1+)
- Secondary text: `--color-text-secondary` on `--color-bg-primary` ✓ (5:1+)
- WIP badge: `--color-warning` on `--color-warning-faint` ✓ (5:1+)

---

## 12. Component Integration Points

### With App Root (`app.ts`)

**Inputs to NavigationDrawerComponent:**

```typescript
@Input() links: NavLink[];  // Array of navigation items with status
@Input() isOpen$: Observable<boolean>;  // Drawer open/close state
```

**Outputs/Interactions:**

- Drawer emits close on backdrop click
- Links emit route navigation
- Badges render based on link status

### With Services

**DrawerService:**

- Provides `isOpen$` observable
- Exposes `toggle()`, `open()`, `close()` methods

**BreakpointService:**

- Provides `isDesktop$` observable
- Used to hide/show hamburger button

**FeatureVisibilityService:**

- Provides `getIndicator(status)` method
- Returns badge text ("🚧 WIP", "🧪 Beta", null)

**ThemeService:**

- Sets `[data-theme]` attribute on root element
- Drawer CSS reads `var(--color-*)` tokens from theme

---

## 13. Light & Dark Theme Variants

### Light Theme Active (`[data-theme="light"]`)

```scss
// Example: Active link styling
.nav-link.active {
  background: rgba(0, 123, 255, 0.1); // --color-primary-faint
  color: #007bff; // --color-primary
  border-left-color: #007bff;
}
```

### Dark Theme Active (`[data-theme="dark"]`)

```scss
// Same semantic tokens, different values
.nav-link.active {
  background: rgba(100, 181, 246, 0.2); // Lighter/visible on dark bg
  color: #64b5f6; // Lighter primary
  border-left-color: #64b5f6;
}
```

**Key Difference:** All colors inverted via CSS custom properties, no class duplicates.

---

## 14. File Structure for Implementation

```
apps/nav-shell/src/app/
├── components/
│   └── navigation-drawer/
│       ├── navigation-drawer.component.ts
│       ├── navigation-drawer.component.scss  ← Main drawer + link styling
│       └── navigation-drawer.component.spec.ts
├── styles/
│   ├── _drawer.scss                         ← Desktop/mobile responsive layout
│   ├── _header.scss                         ← Header + buttons
│   ├── _animations.scss                     ← Slide, fade animations
│   └── (imported into styles.scss)
├── app.ts                                   ← Root layout using CSS classes
└── styles.scss                              ← Global + imports
```

---

## 15. Testing Checklist (For QA)

- [ ] Desktop: Drawer visible, persistent (280px)
- [ ] Desktop: Main content uses remaining width
- [ ] Mobile: Drawer hidden (off-screen)
- [ ] Mobile: Hamburger visible in header
- [ ] Mobile: Click hamburger → drawer slides in
- [ ] Mobile: Backdrop visible, semi-transparent
- [ ] Mobile: Click backdrop → drawer slides out
- [ ] Mobile: Esc key → drawer closes
- [ ] Light theme: Colors correct (white bg, dark text)
- [ ] Dark theme: Colors correct (dark bg, light text)
- [ ] Active link: Highlighted with primary color + left border
- [ ] WIP badge: Orange styling, positioned inline
- [ ] Beta badge: Blue styling, positioned inline
- [ ] Badge text: Correct emoji + status text (🚧 WIP, 🧪 Beta)
- [ ] Animations: Smooth 300ms slide + fade
- [ ] Keyboard: Tab through all focusable elements
- [ ] Keyboard: Enter/Space activates buttons and links
- [ ] Focus visible: 2px orange outline on all focusable elements
- [ ] Screen reader: Announces drawer, links, and badge text
- [ ] Responsive: Test at 768px, 1024px, and 1440px widths
- [ ] Touch: Swipe-to-close works on mobile (if implemented)

---

## 16. Design Decision Rationale

**Why 280px drawer width?**

- Sufficient for typical navigation + badges
- Leaves 480px+ for main content on 768px screens
- Professional drawer width (common in Material Design, Bootstrap)

**Why non-shifting overlay on mobile?**

- Preserves layout stability during interaction
- Prevents jarring content reflow on small screens
- More modern UX pattern

**Why 40% backdrop opacity?**

- Readable (main content visible behind) but dimmed
- Signals modality without complete obscuration
- Accessible to users with motion sensitivity

**Why 300ms animation duration?**

- Fast enough to feel responsive (not sluggish)
- Slow enough to perceive as intentional (not jarring)
- Standard interaction timing (matches `--duration-normal`)

**Why badges inline with links?**

- Space-efficient (no extra row)
- Immediate visual association with feature status
- Badge travels with link (hover together)
