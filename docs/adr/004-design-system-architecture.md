# ADR 004: Design System Architecture

**Status:** Accepted  
**Date:** 2025-01-18  
**Deciders:** Jeff Crosley (Architect)

## Context

JeffApp is a portfolio application demonstrating full-stack polyglot architecture across multiple frameworks (Angular, Stencil, future React/Vue). A cohesive design system is needed to:

- Maintain visual consistency across microfrontends and microservices
- Support light/dark mode theming (v1 requirement)
- Enable component reusability across framework boundaries
- Demonstrate professional design patterns and accessibility practices
- Allow independent theming of sub-apps while maintaining brand coherence

### Requirements

- **Theme switching:** User-toggleable light/dark mode with OS preference detection and localStorage persistence
- **Cross-framework compatibility:** Tokens consumable by Angular, Stencil (Shadow DOM), React, Vue
- **Mobile-first:** Responsive design with desktop enhancements where appropriate
- **Component flexibility:** Stencil components themeable by consumers with per-component overrides
- **Jewel tone palette:** Rich, sophisticated color choices that stand out in portfolio context
- **Runtime theming:** CSS custom properties for dynamic theme switching without rebuilds

## Decision

Implement a **CSS Custom Properties-based design system** distributed via shared Nx library (`@jeffapp/design-tokens`).

### Architecture Overview

```
libs/design-tokens/              # Shared design tokens library
├── src/
│   ├── index.scss              # Main entry (imports all partials)
│   ├── _tokens.scss            # CSS custom properties (colors, spacing, z-index)
│   ├── _typography.scss        # Type scale and font stacks
│   ├── _mixins.scss            # Responsive breakpoints, utilities
│   └── _animations.scss        # Transition durations, easing curves
└── project.json                # Nx buildable library config

apps/nav-shell/src/styles.scss       → @use '@jeffapp/design-tokens';
apps/component-showcase/styles.scss  → @use '@jeffapp/design-tokens';
libs/ui-components/src/global.scss   → @use '@jeffapp/design-tokens';
```

### Color System: Jewel Tone Palette

**Light Theme (Default):**

```scss
:root {
	// Jewel tone primaries
	--color-sapphire-600: #1e40af; // Primary brand (deep blue)
	--color-sapphire-500: #3b82f6; // Interactive elements
	--color-emerald-600: #059669; // Success, accents
	--color-amethyst-600: #7c3aed; // Secondary brand (purple)
	--color-ruby-600: #dc2626; // Errors, warnings
	--color-topaz-600: #d97706; // Alerts, highlights

	// Neutrals (cool gray scale)
	--color-slate-900: #0f172a; // Darkest text
	--color-slate-700: #334155; // Body text
	--color-slate-500: #64748b; // Muted text
	--color-slate-300: #cbd5e1; // Borders
	--color-slate-100: #f1f5f9; // Subtle backgrounds
	--color-slate-50: #f8fafc; // Page background

	// Semantic tokens (light mode)
	--color-text-primary: var(--color-slate-900);
	--color-text-secondary: var(--color-slate-700);
	--color-text-muted: var(--color-slate-500);
	--color-bg-primary: #ffffff;
	--color-bg-secondary: var(--color-slate-50);
	--color-bg-tertiary: var(--color-slate-100);
	--color-border-primary: var(--color-slate-300);
	--color-border-secondary: var(--color-slate-200);

	// Interactive states
	--color-link: var(--color-sapphire-600);
	--color-link-hover: var(--color-sapphire-500);
	--color-focus-ring: var(--color-sapphire-500);

	// Component-specific
	--color-button-primary-bg: var(--color-sapphire-600);
	--color-button-primary-text: #ffffff;
	--color-button-secondary-bg: var(--color-emerald-600);
	--color-card-bg: var(--color-bg-primary);
	--color-card-border: var(--color-border-primary);
}
```

**Dark Theme:**

```scss
[data-theme='dark'] {
	// Jewel tones remain vibrant in dark mode (slightly adjusted)
	--color-sapphire-500: #60a5fa; // Lighter for contrast
	--color-emerald-500: #10b981;
	--color-amethyst-500: #a78bfa;

	// Dark neutrals
	--color-slate-900: #f8fafc; // Inverted for text
	--color-slate-700: #e2e8f0;
	--color-slate-500: #94a3b8;
	--color-slate-300: #475569;
	--color-slate-100: #1e293b;
	--color-slate-50: #0f172a;

	// Semantic tokens (dark mode overrides)
	--color-text-primary: var(--color-slate-900);
	--color-text-secondary: var(--color-slate-700);
	--color-text-muted: var(--color-slate-500);
	--color-bg-primary: #0f172a;
	--color-bg-secondary: #1e293b;
	--color-bg-tertiary: #334155;
	--color-border-primary: var(--color-slate-300);
	--color-border-secondary: #475569;

	// Interactive states (adjusted for dark backgrounds)
	--color-link: var(--color-sapphire-500);
	--color-link-hover: #93c5fd;
	--color-focus-ring: var(--color-sapphire-500);

	// Component-specific
	--color-button-primary-bg: var(--color-sapphire-500);
	--color-card-bg: #1e293b;
	--color-card-border: var(--color-slate-300);
}
```

### Typography Scale

```scss
:root {
	// Font families
	--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
	--font-mono: 'SF Mono', 'Cascadia Code', 'Consolas', 'Liberation Mono', monospace;

	// Fluid type scale (responsive via clamp)
	--font-size-xs: 0.75rem; // 12px
	--font-size-sm: 0.875rem; // 14px
	--font-size-base: 1rem; // 16px
	--font-size-lg: 1.125rem; // 18px
	--font-size-xl: 1.25rem; // 20px
	--font-size-2xl: clamp(1.5rem, 3vw, 1.875rem); // 24-30px
	--font-size-3xl: clamp(1.875rem, 4vw, 2.25rem); // 30-36px
	--font-size-4xl: clamp(2.25rem, 5vw, 3rem); // 36-48px

	// Line heights
	--line-height-tight: 1.25;
	--line-height-normal: 1.6;
	--line-height-relaxed: 1.75;

	// Font weights
	--font-weight-normal: 400;
	--font-weight-medium: 500;
	--font-weight-semibold: 600;
	--font-weight-bold: 700;
}
```

### Spacing & Layout

```scss
:root {
	// Spacing scale (8px base unit)
	--space-0: 0;
	--space-1: 0.25rem; // 4px
	--space-2: 0.5rem; // 8px
	--space-3: 0.75rem; // 12px
	--space-4: 1rem; // 16px
	--space-5: 1.25rem; // 20px
	--space-6: 1.5rem; // 24px
	--space-8: 2rem; // 32px
	--space-10: 2.5rem; // 40px
	--space-12: 3rem; // 48px
	--space-16: 4rem; // 64px
	--space-20: 5rem; // 80px

	// Border radius
	--radius-sm: 0.25rem; // 4px
	--radius-md: 0.5rem; // 8px
	--radius-lg: 0.75rem; // 12px
	--radius-xl: 1rem; // 16px
	--radius-full: 9999px; // Pill shape

	// Shadows
	--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
	--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
	--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.15);
	--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.2);

	// Z-index scale
	--z-base: 0;
	--z-dropdown: 100;
	--z-sticky: 200;
	--z-modal-backdrop: 300;
	--z-modal: 400;
	--z-toast: 500;
}

[data-theme='dark'] {
	// Darker shadows for dark mode
	--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
	--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
	--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
	--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.6);
}
```

### Responsive Breakpoints

```scss
// _mixins.scss
$breakpoints: (
	'sm': 640px,
	// Large phones (portrait tablets)
	'md': 768px,
	// Tablets (portrait)
	'lg': 1024px,
	// Tablets (landscape), small laptops
	'xl': 1280px,
	// Laptops, desktops
	'2xl': 1536px // Large desktops
);

// Mobile-first mixin
@mixin respond-above($breakpoint) {
	@media (min-width: map-get($breakpoints, $breakpoint)) {
		@content;
	}
}

// Desktop-first mixin (for specific cases)
@mixin respond-below($breakpoint) {
	@media (max-width: map-get($breakpoints, $breakpoint) - 1px) {
		@content;
	}
}

// Expose breakpoints for JS access
:root {
	--breakpoint-sm: 640px;
	--breakpoint-md: 768px;
	--breakpoint-lg: 1024px;
	--breakpoint-xl: 1280px;
	--breakpoint-2xl: 1536px;
}
```

### Animation & Transitions

```scss
:root {
	// Durations
	--duration-fast: 150ms;
	--duration-normal: 300ms;
	--duration-slow: 500ms;

	// Easing curves
	--ease-in: cubic-bezier(0.4, 0, 1, 1);
	--ease-out: cubic-bezier(0, 0, 0.2, 1);
	--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
	--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

// Respect user motion preferences
@media (prefers-reduced-motion: reduce) {
	*,
	*::before,
	*::after {
		animation-duration: 0.01ms !important;
		animation-iteration-count: 1 !important;
		transition-duration: 0.01ms !important;
	}
}
```

### Theme Service Implementation

**Location:** `apps/nav-shell/src/app/services/theme.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class ThemeService {
	private readonly STORAGE_KEY = 'jeffapp-theme'
	private currentTheme$ = new BehaviorSubject<'light' | 'dark'>('light')

	constructor() {
		this.initializeTheme()
	}

	private initializeTheme(): void {
		// Priority: localStorage > OS preference > default light
		const stored = localStorage.getItem(this.STORAGE_KEY)
		const theme = stored || this.detectSystemTheme()
		this.applyTheme(theme as 'light' | 'dark')
	}

	private detectSystemTheme(): 'light' | 'dark' {
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
	}

	private applyTheme(theme: 'light' | 'dark'): void {
		document.documentElement.setAttribute('data-theme', theme)
		this.currentTheme$.next(theme)
	}

	toggle(): void {
		const newTheme = this.currentTheme$.value === 'light' ? 'dark' : 'light'
		localStorage.setItem(this.STORAGE_KEY, newTheme)
		this.applyTheme(newTheme)
	}

	getTheme(): Observable<'light' | 'dark'> {
		return this.currentTheme$.asObservable()
	}
}
```

### Stencil Component Theming

**Pattern:** Components inherit global tokens via CSS custom properties

```scss
// libs/ui-components/src/components/app-button/app-button.scss
:host {
	display: inline-block;

	// Inherit from global theme by default
	// Can be overridden via component attributes or inline styles
}

.btn {
	padding: var(--space-3) var(--space-6);
	border-radius: var(--radius-md);
	font-family: var(--font-sans);
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-medium);
	transition: all var(--duration-fast) var(--ease-out);
	border: none;
	cursor: pointer;

	&:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 2px;
	}
}

.btn-primary {
	background: var(--color-button-primary-bg);
	color: var(--color-button-primary-text);

	&:hover:not(:disabled) {
		filter: brightness(1.1);
	}
}

// Per-component theme override support
:host([data-theme='light']) {
	// Force light mode for this component
	--color-button-primary-bg: #1e40af;
	--color-button-primary-text: #ffffff;
}

:host([data-theme='dark']) {
	// Force dark mode for this component
	--color-button-primary-bg: #60a5fa;
	--color-button-primary-text: #0f172a;
}
```

**Usage:**

```html
<!-- Inherits theme from nav-shell -->
<app-button variant="primary">Submit</app-button>

<!-- Forces light mode on this button -->
<app-button variant="primary" data-theme="light">Submit</app-button>

<!-- Override specific token inline -->
<app-button style="--color-button-primary-bg: #dc2626;">Danger</app-button>
```

## Consequences

### Positive

- **Unified design language:** All apps/components share consistent visual foundation
- **Dynamic theming:** Light/dark mode switches instantly without rebuilds or page refresh
- **Framework-agnostic:** CSS custom properties work in Angular, React, Vue, Stencil Shadow DOM
- **Developer experience:** Semantic token names (`--color-text-primary`) are self-documenting
- **Accessibility:** Built-in support for `prefers-reduced-motion` and focus management
- **Scalability:** New themes (e.g., high-contrast) can be added via additional `[data-theme]` selectors
- **Component flexibility:** Per-component theme overrides enable component showcase gallery variations

### Negative

- **Browser support:** CSS custom properties require IE11+ (acceptable for modern portfolio)
- **Runtime overhead:** Small performance cost vs. compiled SCSS (negligible for portfolio scale)
- **Shadow DOM piercing:** Stencil components must explicitly inherit tokens (not automatic cascade)
- **Token proliferation:** Risk of creating too many tokens; requires discipline to maintain semantic structure
- **Migration effort:** Existing hardcoded colors must be refactored to use tokens

### Mitigation

- Document token naming conventions in design system README
- Create linting rules to prevent hardcoded colors (`#rrggbb` outside token definitions)
- Provide Storybook/showcase examples demonstrating theme overrides
- Use semantic tokens (`--color-text-primary`) over primitives (`--color-slate-900`) in components
- Version design-tokens library separately to track breaking changes

## Alternatives Considered

### SCSS Variables with Theme Mixins

```scss
// Rejected: SCSS approach
@mixin light-theme {
	$text-primary: #0f172a;
	$bg-primary: #ffffff;
}

@mixin dark-theme {
	$text-primary: #f8fafc;
	$bg-primary: #0f172a;
}
```

**Rejected because:**

- Requires compile-time theme selection (cannot toggle at runtime)
- No cross-framework compatibility (SCSS is build-time only)
- Shadow DOM components cannot access SCSS variables from global scope
- Would need duplicate builds for light/dark modes

### Tailwind CSS Utility Classes

```html
<!-- Rejected: Tailwind approach -->
<button class="bg-blue-600 text-white dark:bg-blue-500"></button>
```

**Rejected because:**

- Not suitable for Shadow DOM components (scoped styles)
- Large utility class bundle size for simple portfolio
- Less control over semantic naming and design token structure
- Would still need CSS custom properties for Stencil components
- Over-engineered for current scope (reconsider if team scales)

### CSS-in-JS (Styled Components / Emotion)

```typescript
// Rejected: CSS-in-JS approach
const Button = styled.button`
	background: ${(props) => props.theme.colors.primary};
`
```

**Rejected because:**

- Framework-specific (React-only, Angular support is poor)
- Cannot penetrate Shadow DOM in Stencil components
- Runtime style injection overhead larger than CSS custom properties
- Additional bundle size and complexity
- Not suitable for polyglot microfrontend architecture

## Implementation Plan

1. **Create `libs/design-tokens` library** (Nx buildable)
2. **Define token files** (`_tokens.scss`, `_typography.scss`, `_mixins.scss`)
3. **Implement `ThemeService`** in nav-shell with toggle UI in header
4. **Refactor `apps/nav-shell/src/styles.scss`** to use tokens
5. **Update Stencil components** to inherit tokens
6. **Refactor `component-showcase`** to demonstrate theme switching
7. **Document token usage** in design system README
8. **Add theme toggle to nav-shell header** (sun/moon icon)

## References

- Related: ADR 001 (Runtime Configuration)
- Implementation: `libs/design-tokens/`, `apps/nav-shell/src/app/services/theme.service.ts`
- CSS Custom Properties: https://developer.mozilla.org/en-US/docs/Web/CSS/--*
- Stencil Theming: https://stenciljs.com/docs/styling#css-custom-properties
- Tailwind Color Palette (inspiration): https://tailwindcss.com/docs/customizing-colors
