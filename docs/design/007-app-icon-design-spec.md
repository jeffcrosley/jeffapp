# 007 — App Icon Design Specification

**Component:** `<app-icon>` (Stencil, framework-agnostic)
**Purpose:** Render scalable, theme-aware technology icons with CDN resolution, caching, and graceful fallback. Intended for skills, nav, buttons, cards—no skill-badge wrapper needed.

## Palette (Jewel Tone, Light/Dark)
| Name     | Light             | Dark              |
|----------|-------------------|-------------------|
| sapphire | #1E5BFF           | #6FA1FF           |
| emerald  | #1FA86A           | #6FD8A8           |
| amethyst | #7A3FF2           | #B89CFF           |
| garnet   | #C2274B           | #E7829B           |
| amber    | #E58B17           | #F2C075           |
| topaz    | #1FB3C7           | #7EDDE8           |
| onyx     | #2E3A46           | #7A8A99           |
| peridot  | #7BCF3B           | #B8F28A           |
| ruby     | #E04646           | #F29999           |
| citrine  | #F2C94C           | #F7E6A3           |

CSS vars to add:
```
:root,[data-theme='light'] { --color-jewel-sapphire: #1e5bff; ... }
[data-theme='dark'] { --color-jewel-sapphire: #6fa1ff; ... }
```

## Props / Inputs
- **name** (required): icon slug (e.g., "angular", "react")
- **size**: `sm` (16px) | `md` (24px, default) | `lg` (32px)
- **color**: optional override
  - palette key → `var(--color-jewel-*)`
  - CSS variable (e.g., `--color-primary`) or literal (`#hex`, `rgb`)
  - default: inherit `currentColor`
- **aria-label**: optional; defaults to `name` when not hidden
- **aria-hidden**: hides from a11y tree when true

## Visual Treatment
- Container: inline-flex, center both axes; inherits `currentColor`
- Icon SVG: 100% width/height, fill `currentColor`
- Sizes: sm 16px, md 24px, lg 32px
- Loading: subtle skeleton block at icon size, 1.5s pulse
- Error: fallback SVG (24x24 scalable) circle + "?" in `currentColor`
- Hover/focus: no default hover color change (inherits context); focus-visible ring handled by parent if link/button wraps it

## States
- **Default:** SVG displayed, inherits color
- **Loading:** Skeleton placeholder until SVG injected
- **Error:** Fallback SVG after first attempt + one retry (3s) fails
- **Themed:** Auto-detect theme via `data-theme` on `<html>`; fallback to `prefers-color-scheme` for default color vars

## Behavior & Data Flow
- Resolve URL via configurable resolver (default Simple Icons CDN)
- Fetch SVG → sanitize (strip scripts, event handlers, foreign objects) → cache globally → render via `innerHTML`
- Retry once after 3s on failure; then show fallback
- Optional `prefetchIcons([...])` uses `requestIdleCallback` to warm cache
- Concurrent requests deduped through global cache service

## Layout & Usage Examples
```html
<!-- Inherit color from parent text -->
<app-icon name="angular" size="md"></app-icon>

<!-- Use palette key -->
<app-icon name="react" color="sapphire"></app-icon>

<!-- In skills list (no skill-badge wrapper) -->
<a href="https://angular.io" target="_blank" aria-label="Angular">
  <app-icon name="angular" size="md"></app-icon>
</a>
```

## Accessibility
- `role="img"` with `aria-label` (default to name) unless `aria-hidden=true`
- Fallback SVG includes `<title>` for screen readers
- Respect parent focus management; ensure surrounding links/buttons provide focus styles

## Responsive
- Sizes are tokenized; icons remain crisp at all DPIs
- No layout shifts; skeleton matches final dimensions

## Theming
- Inherit `currentColor` by default; palette overrides map to jewel vars
- Light/dark handled by CSS vars; no manual prop needed for theme switching

## Risks / Notes
- External CDN dependency; mitigated via resolver override
- Sanitization required to reduce SVG injection risk
- Global cache should stay memory-light; consider eviction if many icons added later
