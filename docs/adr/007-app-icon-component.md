## ADR: Generic Icon Component (app-icon)

### Context

We need a reusable, theme-aware icon component usable across frameworks. Requirements:
- Implemented in `libs/ui-components` (Stencil) with TSX (consistent with `app-button`).
- Icons loaded from a configurable resolver (default Simple Icons CDN) with sanitization on fetch.
- Global singleton cache with concurrent request deduplication; optional lazy prefetch.
- Auto theme detection via `data-theme` and `prefers-color-scheme`; inherits `currentColor` by default.
- Color override via a jewel-tone palette (10 colors) or CSS var/literal. Fallback renders a minimal SVG when load fails after one retry.
- Replace skill badges; use `<app-icon>` directly in nav-shell skills.

### Decision

- Add `app-icon` component in `libs/ui-components/src/components/app-icon/` with TSX.
- Add utilities/services:
  - `icon-resolver.ts` with `setIconResolver` and default Simple Icons CDN resolver.
  - `icon-cache.service.ts` singleton with global cache and concurrent dedupe.
  - `sanitize-svg.ts` to strip scripts/event handlers/foreign objects before caching.
  - `prefetch-icons.ts` to optionally lazy-prefetch via `requestIdleCallback`.
- Implement one retry after 3 seconds; on failure render fallback SVG (circle + "?").
- Theme handling: auto-detect `data-theme` (light/dark/custom) with `prefers-color-scheme` fallback; otherwise inherit `currentColor`.
- Color API: accept palette key, CSS var, or literal color; default inherit. Map palette keys to `--color-jewel-*` tokens defined in design tokens.
- Jewel-tone palette (light/dark variants): sapphire, emerald, amethyst, garnet, amber, topaz, onyx, peridot, ruby, citrine.
- Update nav-shell skills to use `<app-icon>` directly (no skill-badge component).

### Consequences

- Pros: Reusable, themeable icon solution with low maintenance; caching reduces network chatter; sanitizer mitigates SVG injection risk; resolver abstraction allows future source swap.
- Cons: Slight complexity in fetch+sanitize; CDN dependency for defaults; palette requires token additions; global cache must be kept lightweight.

### Alternatives Considered

- Local static SVGs only: simpler but manual upkeep and larger bundle.
- Icon font: easy theming but less control and additional font payload.
- No sanitizer: simpler but riskier; rejected for safety.
