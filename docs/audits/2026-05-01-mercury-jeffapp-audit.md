# Return: JeffApp Audit
_Date: 2026-05-01 | Handler: Mercury | Model: Sonnet 4.6 | Brief: 2026-05-01-mercury-jeffapp-audit_

---

## GTD Updates Needed (for Jupiter to handle on return)
- Close task_20260501_022
- Populate `projects/jeffapp/briefing.md` current state table with audit findings
- Write Phase 1 GTD dashboard brief
- Update `manifest.json` jeffapp entry

---

## 1. Repo Structure

**Actual layout** (main branch, SHA `68f740349d`):

```
.editorconfig
.env.development
.env.production
.github/
  adr/
  agents/           ← 7 agent SOPs (architect, designer, devops, qa-coach, requirements-analyst, reviewer, scaffolder)
  copilot-instructions.md
  workflows/
    main.yml        ← single workflow file
.vscode/
README.md
apps/
  api-gateway/
  api-gateway-e2e/
  component-showcase/   ← NOT in README
  nav-shell/
  nav-shell-e2e/
docs/
  INDEX.md
  adr/
  design/
  guides/
  protocols/
eslint.config.mjs
jest.config.ts
jest.preset.js
libs/
  design-tokens/    ← NOT in README
  ui-angular/
  ui-components/
  ui-components-native/
  ui-react/
nx.json
package.json
package-lock.json
pre-flight-check.sh   ← NOT in README
spec-verify.sh        ← NOT in README
tsconfig.base.json
vitest.workspace.ts
```

**Divergences from README:** `apps/component-showcase` (deployed standalone gallery), `libs/design-tokens` (SCSS token system), `pre-flight-check.sh`, `spec-verify.sh`, and `.github/agents/` (7 agent SOPs) are all present but unmentioned in README. No `render.yaml` anywhere — Render is configured entirely via dashboard + webhook secrets.

---

## 2. Apps Inventory

### 2a. `apps/nav-shell` — Angular 20 Shell

**Current state:** Functional, deployed. Core shell infrastructure is complete. Four routes exist; three of four appear in the drawer nav.

**What it does:** Portfolio/resume site. Responsive sidebar-nav shell with theme toggle (light/dark, persisted to localStorage), `<app-icon>` Stencil components in the nav, and route-based page rendering.

**Routes** (`app.routes.ts`):

| Path | Component | Status |
|---|---|---|
| `` | redirect → `/home` | — |
| `/home` | `HomeComponent` | stable |
| `/about` | `AboutComponent` | wip |
| `/contact` | `ContactComponent` | stable |
| `/components` | `ComponentsComponent` | wip |
| `**` | redirect → `/home` | — |

**Nav links in drawer** (from `app.ts`):
- Home (stable), About (wip), Components (wip), GitHub external link (stable)
- **Contact is NOT in the drawer nav** — the route exists and works by direct URL but has no nav link.

**Pages in detail:**

- **Home** (`pages/home/`): Has its own subdirectory with `.ts`, `.html`, `.scss`, `.spec.ts`, and `home.test-coverage.md`. Uses an external template (not inline). Most built-out page by file count.
- **About** (`about.component.ts`): Inline template. Shows: name ("Full-Pipeline AI-Forward Engineer"), bio paragraph, skills grid (Angular, React, TypeScript, Stencil, Web Components, Node.js, Express.js, Nx, Jest, Playwright, GitHub Actions, Docker, Render, TDD, Microfrontends, REST APIs), and a 3-entry "experience" timeline — all three entries are JeffApp project entries from 2025. Hardcoded data, no API calls.
- **Contact** (`contact.component.ts`): Inline template. Static content: email (jeffcrosley@gmail.com), phone (718.513.9786), LinkedIn, GitHub. Simple and complete.
- **Components** (`components.component.ts`): Renders `component-showcase` inside an `<iframe>` using `EnvironmentService.getShowcaseUrl()`. Dev URL: `http://localhost:4300`, prod URL: `https://components.jeffcrosley.com`. Uses `DomSanitizer.bypassSecurityTrustResourceUrl`. Sandbox: `allow-scripts allow-same-origin`.

**Services** (all have companion spec files):

| Service | Purpose |
|---|---|
| `ThemeService` | Dark/light theme, localStorage persistence |
| `DrawerService` | Mobile sidebar open/close state |
| `BreakpointService` | Responsive breakpoint detection |
| `EnvironmentService` | Loads `/config.json` at startup (APP_INITIALIZER), exposes `getShowcaseUrl()`, `getApiGatewayUrl()`, `isLocalDevelopment()` |
| `FeatureVisibilityService` | Drives `feature-wip`, `feature-beta` CSS classes on nav links |

**Components:** `NavigationDrawerComponent` (one component under `src/app/components/navigation-drawer/`)

**Build config** (`project.json`):
- Executor: `@angular/build:application`
- Output: `dist/apps/nav-shell`
- Serve: port 4200 (dev); `proxy.conf.json` proxies `/showcase` → `http://localhost:4300`
- `serve-static` target uses `dist/apps/nav-shell/browser` (matches Render publish dir)

**Environment files:**
- `.env.development`: showcase `http://localhost:4300`, gateway `http://localhost:3333`
- `.env.production`: showcase `https://components.jeffcrosley.com`, gateway `https://api-gateway.onrender.com`
- Angular uses runtime `config.json` (loaded by EnvironmentService), not env files directly

**Notable gaps:**
- Contact page has no nav link
- Home page breaks the "inline template" pattern prescribed in copilot-instructions (uses external `.html`/`.scss`)
- No microfrontend sub-apps wired in yet

---

### 2b. `apps/api-gateway` — Express Gateway

**Current state:** Minimal but deployable.

**What it does:** Single route: `GET /health` → `{ status: 'healthy', service: 'API Gateway' }`. Port: `process.env.PORT || 3333`.

**Routes:**
- `GET /health` — health check ✓
- Everything else — no routes defined (Express 404)
- Proxy middleware for `/api/todo` — **commented out** in `main.ts`

**Build config** (`project.json`): Webpack build (`@nx/webpack`). Has `prune-lockfile` and `copy-workspace-modules` targets for production dependency pruning on Render. Serve executor: `@nx/js:node`.

**Notable gap:** api-gateway-e2e spec tests `GET /` for `{ message: 'Hello API' }` — this **fails** against the actual running gateway (wrong route, wrong response body).

---

### 2c. `apps/component-showcase` — Vanilla TS Gallery

**Current state:** Functional, deployed to `https://components.jeffcrosley.com`.

**What it does:** Framework-agnostic component gallery built with vanilla TypeScript + Vite (no Angular, no React). Single page. `main.ts` calls `renderGallery(root)` from `pages/gallery.ts`, which injects raw HTML into `#root`. Demonstrates:
- Stencil `<app-button>` (primary, secondary, disabled)
- Native WC `<native-card>` (3 cards), `<native-badge>` (new, beta, deprecated)
- Framework integration reference section (Angular, React, Vanilla)

**Build config** (`project.json`): Vite build. Output: `dist/apps/component-showcase`. Vitest for unit tests. Has `gallery.spec.ts`.

**Notable gap:** `gallery.ts` uses `variant` attribute on `<native-badge>` (`variant="primary"`, `variant="secondary"`, `variant="warning"`) but `native-badge.ts` only observes/handles `status` attribute (success/warning/error/info). Badges in the showcase render incorrectly — they all fall through to default "info" blue regardless of the variant value passed.

---

### 2d. `apps/nav-shell-e2e` — Playwright E2E

**Current state:** Substantive tests, not scaffolding.

| File | Coverage |
|---|---|
| `navigation-shell.spec.ts` (7.5KB) | Page nav, drawer open/close/escape/backdrop, theme toggle + persistence + reload, responsive (mobile/desktop), accessibility (aria-label, aria-expanded, focusable links), feature status classes, external GitHub link |
| `home.e2e.spec.ts` | Home page tests |
| `app-icon.e2e.spec.ts` | `<app-icon>` Stencil component E2E |

**Assessment:** Real, meaningful tests. Primary quality gate for nav-shell UI. **Not run in CI** (see Section 5).

---

### 2e. `apps/api-gateway-e2e` — Jest E2E

**Current state:** Stale scaffolding.

Single spec (`api-gateway.spec.ts`) tests `GET /` returning `{ message: 'Hello API' }`. The gateway has no `GET /` route and returns `{ status: 'healthy', service: 'API Gateway' }` at `/health`. This test **fails** against any running instance of api-gateway.

---

## 3. Libraries Inventory

### 3a. `@jeffapp/ui-components` — Stencil Web Components

**Path alias:** `libs/ui-components/src/index.ts` (exports types only; Stencil components self-register via side-effect import)

| Component | Tag | Status | Props / Events |
|---|---|---|---|
| `app-button` | `<app-button>` | **Functional** | `label`, `variant` (primary/secondary), `disabled` |
| `app-icon` | `<app-icon>` | **Functional** | `name`, `color` (jewel palette or CSS), `size` (sm/md/lg), `ariaLabel`, `ariaHidden`. Loads SVG from CDN with retry logic, caching (`iconCache` service in `services/`), color palette mapping, and sanitization |
| `app-card` | `<app-card>` | **Stub (TDD exercise)** | Props defined: `cardTitle`, `description`, `imageUrl`, `imageAlt`, `variant` (default/highlighted/compact), `cardClick` event. `render()` returns `<p>TODO</p>`. Has full spec + `TDD_CHALLENGE.md`. Intentional. |

`app-icon` is the most complex component — has `services/` (icon-cache) and `utils/` (icon-resolver) subdirs, state for loading/error, and retry logic.

---

### 3b. `@jeffapp/ui-components-native` — Vanilla Web Components

**Path alias:** `libs/ui-components-native/src/index.ts`

| Component | Tag | Status | Attributes |
|---|---|---|---|
| `native-card` | `<native-card>` | **Functional** | `title`, `description`, `<slot>`. Shadow DOM, hover lift effect, `::slotted(*)` support |
| `native-badge` | `<native-badge>` | **Functional** | `status` (success/warning/error/info), `label`. Shadow DOM, color map. **Bug:** showcase passes `variant` attr, component observes `status` — mismatch |

---

### 3c. `@jeffapp/ui-angular` — Angular Wrappers

**Path alias:** `libs/ui-angular/src/index.ts`

**Exports:** `UiAngularModule` only — a single NgModule with `CUSTOM_ELEMENTS_SCHEMA` and `CommonModule`. No directives, pipes, or services. nav-shell does not even import this; it applies `CUSTOM_ELEMENTS_SCHEMA` directly in `app.ts`.

**Assessment:** Near-empty. Placeholder for future Angular-specific utilities.

---

### 3d. `@jeffapp/ui-react` — React Wrappers

**Path alias:** `libs/ui-react/src/index.ts`

**Exports:** `loadWebComponents` (no-op — just logs a console message), `AppButton`, `NativeCard`, `NativeBadge` typed React wrapper components, JSX type declarations (`web-components.d.ts`).

**Assessment:** Functional wrappers for the three existing WC types. `loadWebComponents()` is a documentation placeholder — consuming app must import WC libs directly. No React app in the monorepo currently uses this library.

---

### 3e. `@jeffapp/design-tokens` — SCSS Token System

**Not in README. Not in tsconfig paths as a TS import** (path alias maps to `libs/design-tokens/src/index.scss` — SCSS only, no TS exports).

| File | Content |
|---|---|
| `_tokens.scss` (~10KB) | CSS custom properties: colors, spacing, typography scale, shadows, border-radius, z-index, breakpoints, component-specific tokens |
| `_animations.scss` (~3.3KB) | Keyframe animations and utility classes |
| `_mixins.scss` (~3.3KB) | SCSS mixins (responsive, flex, grid, etc.) |
| `_typography.scss` (~2.3KB) | Typography utility classes |
| `index.scss` | Barrel `@use` of all partials |

**Assessment:** Substantive design system foundation. Both nav-shell and component-showcase have their own `styles.scss` — unclear how much of `design-tokens` they actually consume vs. redefine independently. No build target in `project.json` (lint only). Imported via SCSS `@use` in consuming apps.

---

## 4. Build System

| Key | Value |
|---|---|
| Nx | 22.0.3 (some packages at 22.1.0) |
| Angular | 20.3.0 |
| React | 19.2.0 |
| Stencil | 4.38.3 |
| TypeScript | 5.9.2 |
| Vite | 7.0.0 |
| Vitest | 3.2.4 |
| Jest | 29.7.0 |
| Playwright | 1.36.0 |
| Node (CI) | 20 |

**Nx Cloud:** Configured. `nxCloudId: "6914d9c4c4609b4a12bb526e"` in `nx.json`. No `NX_CLOUD_AUTH_TOKEN` visible in CI workflow — may not be sending cache hits.

**Scripts:** `package.json` has **no scripts defined** (`"scripts": {}`). All commands via `npx nx`.

**Common dev commands:**
```bash
npx nx serve nav-shell          # port 4200
npx nx serve api-gateway        # port 3333
npx nx serve component-showcase # port 4300 (inferred)
npx nx build <project>
npx nx test <project>
npx nx lint <project>
npx nx affected --target=build
npx nx graph
```

**Test runners by project:**

| Project | Unit Tests | E2E |
|---|---|---|
| nav-shell | Jest | Playwright |
| api-gateway | Jest | Jest (stale) |
| component-showcase | Vitest | — |
| ui-components (Stencil) | Stencil test runner | — |
| ui-angular | Jest | — |

**tsconfig.base.json path aliases:**
```
@jeffapp/ui-components        → libs/ui-components/src/index.ts
@jeffapp/ui-components/loader → libs/ui-components/loader
@jeffapp/ui-components-native → libs/ui-components-native/src/index.ts
@jeffapp/ui-angular           → libs/ui-angular/src/index.ts
@jeffapp/ui-react             → libs/ui-react/src/index.ts
@jeffapp/design-tokens        → libs/design-tokens/src/index.scss
```

---

## 5. CI/CD

### GitHub Actions — `.github/workflows/main.yml`

**Trigger:**
- Push to `main` (paths: `apps/**`, `libs/**`, `package*.json`, `nx.json`, `.github/workflows/**`)
- PRs (same paths + `component-showcase/**`)

**Pipeline:**

| Job | What it does |
|---|---|
| `setup_and_find_affected` | Full checkout, Node 20, npm cache, Nx cache, `npm ci`, `nrwl/nx-set-shas@v3`, compute affected projects and apps |
| `build_test_affected` | Lint affected, test (nav-shell only, `\|\| true`), build affected |
| `deploy_api_gateway` | Push to main + api-gateway affected → POST `RENDER_API_DEPLOY_HOOK` |
| `deploy_nav_shell` | Push to main + nav-shell affected → POST `RENDER_SHELL_DEPLOY_HOOK` |
| `deploy_component_showcase` | Push to main + component-showcase affected → POST `RENDER_SHOWCASE_DEPLOY_HOOK` |

**CI bugs:**
1. Test step uses `--select="nav-shell,nav-shell-e2e"` — not a valid Nx flag. Combined with `|| true`, **test failures are fully masked in CI**.
2. Playwright E2E tests are **never run in CI**. The comprehensive navigation-shell.spec.ts suite has no CI step.

**Nx Cloud caching:** Wired via `nxCloudId` + cache action, but no `NX_CLOUD_AUTH_TOKEN` in the workflow env vars — may be running unauthenticated.

### Deployment — Render

No `render.yaml` in repo. All Render config lives in the dashboard. Auto-deploy is OFF on all services.

| Service | Type | Publish Dir | URL |
|---|---|---|---|
| `api-gateway` | Node.js web service | `dist/apps/api-gateway/main.js` | https://api-gateway.onrender.com |
| `nav-shell` | Static site | `dist/apps/nav-shell/browser` | (not recorded in repo) |
| `component-showcase` | Static site | `dist/apps/component-showcase` | https://components.jeffcrosley.com |

SPA rewrite rules (`/* → /index.html`) required on nav-shell and component-showcase in Render dashboard.

Runtime config: nav-shell loads `/config.json` from `apps/nav-shell/public/` at startup via APP_INITIALIZER. This file contains `showcaseUrl` and `apiGatewayUrl`. Falls back to localhost defaults if fetch fails.

Required GitHub secrets: `RENDER_API_DEPLOY_HOOK`, `RENDER_SHELL_DEPLOY_HOOK`, `RENDER_SHOWCASE_DEPLOY_HOOK`

---

## 6. Copilot Instructions Summary

**File:** `.github/copilot-instructions.md` (16KB, last updated 2025-01-18)

**What it covers:**
- **Purpose:** Portfolio/resume for Jeff Crosley, "full-pipeline AI-forward engineer." Goal: demonstrate multi-language/framework proficiency to employers.
- **Architecture intent:** nav-shell orchestrates multiple microfrontend sub-apps (future). api-gateway routes to multiple microservice backends (future). Current state: one shell, one gateway, one showcase.
- **Agent flow (sequential):** Requirements Analyst → Designer → Architect → user approval → QA Coach → Developer → Reviewer → DevOps. Pause if upstream artifact missing.
- **TDD mandate:** Agents write tests + leave TODO comments. Never implement logic. Use `describe.skip()`/`it.skip()` for pending. `app-card` is the canonical example of this pattern in action.
- **Page pattern:** "Condensed architecture" — inline `template` and `styles` in `.ts` files. Modern `@if/@for` control flow. (Home page breaks this pattern with external `.html`/`.scss`.)
- **Library decision matrix:** Cross-framework → ui-components (Stencil). WC fundamentals demo → ui-components-native. Angular-specific → ui-angular. React-specific → ui-react.
- **Deployment:** Full Render dashboard checklist included. No render.yaml — all in dashboard.
- **Docs location rules:** Agent SOPs → `.github/agents/`. Protocols → `docs/protocols/`. Guides → `docs/guides/`. Design → `docs/design/`. ADRs → `docs/adr/`.

---

## 7. Open PRs / Active Branches

- **Open PRs:** None
- **Branches:** `main` only (plus this audit branch `claude/jeffapp-audit-docs-iLR0J`)
- No in-flight feature work detected

---

## 8. Gaps and Questions

### Known bugs / mismatches

| # | Issue | Location | Severity |
|---|---|---|---|
| 1 | api-gateway-e2e spec tests wrong route and response body | `apps/api-gateway-e2e/src/api-gateway/api-gateway.spec.ts` | Medium — test always fails |
| 2 | `native-badge` `status` vs. `variant` attribute mismatch | `gallery.ts` vs. `native-badge.ts` | Medium — badges render incorrectly in showcase |
| 3 | CI test step uses invalid `--select` Nx flag + `\|\| true` | `.github/workflows/main.yml` line ~60 | High — test failures are invisible in CI |
| 4 | Playwright E2E tests never run in CI | `.github/workflows/main.yml` | High — no E2E gate |
| 5 | `app-card` renders TODO placeholder | `libs/ui-components/src/components/app-card/app-card.tsx` | Low — intentional TDD exercise |
| 6 | Contact page has no nav link | `app.ts` `navigationLinks` array | Low — route reachable by URL only |
| 7 | `component-showcase` publish dir discrepancy | copilot-instructions says `dist/component-showcase`, project.json builds to `dist/apps/component-showcase` | Medium — may cause deploy failures |
| 8 | Nx Cloud token may be missing from CI | `.github/workflows/main.yml` (no `NX_CLOUD_AUTH_TOKEN`) | Low — cache misses, slower CI |

### Open questions for Jeff

1. **Is the contact page intentionally hidden from nav?** Route exists, works by URL, but no drawer link.
2. **What is the production nav-shell URL?** api-gateway and showcase URLs are in the repo; nav-shell URL is not recorded anywhere.
3. **Is Render actually deploying successfully?** Cannot verify from code — depends on dashboard config and secrets being correct.
4. **Is Nx Cloud authenticated in CI?** No token visible in workflow.
5. **What do `pre-flight-check.sh` and `spec-verify.sh` do?** Not read in this audit — likely local dev helpers worth documenting.
6. **How is `design-tokens` actually consumed?** Nav-shell and showcase each have large `styles.scss` — unclear if they `@use` design-tokens or duplicate token definitions.
7. **What's in `docs/adr/`, `docs/protocols/`, `docs/guides/`, `docs/design/`?** Not read. May contain important context for Phase 1 planning.

---

## 9. Phase 1 Readiness Assessment: GTD Visibility Dashboard

### Goal
New page/microfrontend showing GTD task status — surfacing what's in-progress, blocked, or due.

### What already exists that helps
- Monorepo is well-structured for adding new apps (`nx generate @nx/angular:application`)
- nav-shell routing is clean — adding `/gtd` is one line in `app.routes.ts` + one entry in `navigationLinks`
- `EnvironmentService` pattern handles runtime URL config without rebuilds
- `ThemeService`, `DrawerService`, `BreakpointService` are reusable and injectable
- `design-tokens` lib is ready for a shared visual language
- CI/CD pipeline handles new apps automatically via affected detection
- Nx Cloud caching reduces incremental build times
- Render deployment is wired and ready for a new static site if needed

### What doesn't exist yet but is needed
1. **A backend data source.** api-gateway has zero functional routes. GTD data needs storage (Cloudflare D1, Render Postgres, external API) and a `/api/gtd/tasks` route.
2. **A nav-shell route.** Simple addition — one route + one nav link.
3. **A defined GTD data model.** What shape are tasks? What fields matter for visibility (status, project, context, priority, due date, blocked-by)?

### Recommended path: New Angular page component in nav-shell

**Rationale:**
- Adding a `GtdDashboardComponent` page to nav-shell is the lowest-friction path. No new deploy service, no iframe complexity, no CORS config. Inherits theme, nav, services, and design tokens for free.
- Module federation is not wired and would add weeks of infrastructure work for unclear benefit at this stage.
- The component-showcase iframe pattern works but creates a separate deploy, cross-origin concerns, and config management overhead for what is currently a single-page read view.
- When the dashboard grows into something complex or needs to be embedded elsewhere, it can be extracted into a standalone mfe.

**Clearest path to Phase 1:**
1. Add `GtdDashboardComponent` to `apps/nav-shell/src/app/pages/`
2. Add `/gtd` route to `app.routes.ts` and nav link in `app.ts`
3. Add `/api/gtd/tasks` route to `apps/api-gateway/src/main.ts`
4. Choose storage (Cloudflare D1 is natural given R2 is already in use in the wider system)
5. Wire `EnvironmentService` for the API URL — already handles this pattern
6. Ship

**Critical open question before briefing:** Should the GTD dashboard read from the same GTD system Jeff uses operationally (existing tool with an API), or is this a fresh data model built from scratch inside jeffapp? The answer determines whether Phase 1 is an integration task or a greenfield data design task.

---

_Audit complete. Read-only. No code changes were made during this audit._
_Source commit audited: `68f740349d5f11e33b83acb5abc54a3bde6a8f18` (main, 2026-05-01)_
